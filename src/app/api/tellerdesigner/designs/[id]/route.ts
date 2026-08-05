import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const MIN_TIER = 3; // Pro -- gleiche Sperre wie der Rest des Tellerdesigners
// Bewusst gleich dem Cap in save/route.ts -- ein Nutzer koennte diese Route
// auch direkt aufrufen, ohne vorher zu speichern, deshalb hier dieselbe
// Obergrenze statt sich auf eine bereits kleinere Menge zu verlassen.
const MAX_ZUTATEN = 6;

type Zutat = { name: string; position: { x: number; y: number }; rolle: string; kurzsatz: string };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Eigene Trust-Boundary, gleiches Muster wie sanitizeZutaten in
// save/route.ts (dort ausfuehrlich begruendet): der Client koennte diese
// Route direkt aufrufen, deshalb hier nochmal vollstaendig sanitizen statt
// dem Body zu vertrauen.
function sanitizeZutaten(input: unknown): Zutat[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((z): z is Record<string, unknown> => !!z && typeof z === 'object')
    .map(z => {
      const pos = z.position as Record<string, unknown> | undefined;
      const x = typeof pos?.x === 'number' ? pos.x : null;
      const y = typeof pos?.y === 'number' ? pos.y : null;
      if (x === null || y === null) return null; // fehlende Position -> verwerfen, NICHT auffuellen
      return {
        name: typeof z.name === 'string' ? z.name.trim().slice(0, 100) : '',
        position: { x: clamp01(x), y: clamp01(y) },
        rolle: typeof z.rolle === 'string' ? z.rolle.trim().slice(0, 60) : '',
        kurzsatz: typeof z.kurzsatz === 'string' ? z.kurzsatz.trim().slice(0, 200) : '',
      };
    })
    .filter((z): z is Zutat => z !== null && !!z.name)
    .slice(0, MAX_ZUTATEN);
}

type Body = { zutaten?: unknown };

// Etappe 3: Nutzer korrigiert eine generierte Zutaten-Position von Hand
// (Ziehen im Galerie-Overlay, siehe TellerZutatenDots). Nur fuer bereits
// GESPEICHERTE Designs -- auf /tellerdesigner gibt es vor dem Speichern noch
// keine id, dort ist Ziehen bewusst nicht aktiv (siehe TellerStage-Aufruf).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireTier(req, MIN_TIER);
  if (!check.ok) return check.response;
  const { user } = check;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const zutaten = sanitizeZutaten(body.zutaten);

  const db = createAdminClient();
  // positionen_korrigiert wird IMMER gesetzt, sobald diese Route erfolgreich
  // durchlaeuft -- ihr einziger Zweck ist die manuelle Korrektur, ein
  // separates Flag vom Client waere nur eine zusaetzliche Vertrauensfrage
  // ohne Nutzen. Owner-Check per .eq('user_id', ...) statt RLS (Service-
  // Role-Client umgeht RLS bewusst, siehe CLAUDE.md-Konvention) -- kein
  // Treffer heisst entweder falsche id oder fremdes Design, beides als 404
  // ohne Unterscheidung, um nichts ueber fremde Designs zu verraten.
  const { data, error } = await db
    .from('tellerdesigns')
    .update({ zutaten, positionen_korrigiert: true })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[tellerdesigner/designs/:id] Update fehlgeschlagen:', error.message);
    return NextResponse.json({ error: 'Position konnte nicht gespeichert werden.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Design nicht gefunden.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
