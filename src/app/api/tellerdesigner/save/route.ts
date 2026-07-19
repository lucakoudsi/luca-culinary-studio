import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase-admin';
import { AUFWANDSSTUFEN, type Aufwandsstufe } from '@/config/techniken';
import { STILRICHTUNGEN, type Stilrichtung } from '@/config/tellerStilrichtung';
import { ANRICHTE_FOKUSSE, type AnrichteFokus } from '@/config/tellerAnrichteFokus';

export const dynamic = 'force-dynamic';

const MIN_TIER = 3; // Pro -- gleiche Sperre wie die Generierung selbst
const MAX_TITEL_LENGTH = 200;
const MAX_SAISON_LENGTH = 50;
const MAX_TECHNIKEN = 20; // grosszuegiger als die 6 Label-Slots der Buehne -- die Galerie hat keine feste Positionsgrenze

type Technik = { schlagwort: string; kurzsatz: string; anleitung: string };

type Body = {
  image?: string;
  modus?: 'rezept' | 'frei';
  titel?: string;
  rezeptId?: number | null;
  stilrichtung?: Stilrichtung;
  aufwand?: Aufwandsstufe;
  anrichteFokus?: AnrichteFokus;
  zubereitungszeit?: number | null;
  saison?: string | null;
  techniken?: Technik[];
};

function sanitizeTechniken(input: unknown): Technik[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
    .map(t => ({
      schlagwort: typeof t.schlagwort === 'string' ? t.schlagwort.trim().slice(0, 60) : '',
      kurzsatz: typeof t.kurzsatz === 'string' ? t.kurzsatz.trim().slice(0, 200) : '',
      anleitung: typeof t.anleitung === 'string' ? t.anleitung.trim().slice(0, 600) : '',
    }))
    .filter(t => t.schlagwort && t.kurzsatz)
    .slice(0, MAX_TECHNIKEN);
}

// Save-on-demand: Generierte Bilder kommen als b64 zurueck und werden NUR
// hochgeladen, wenn der Nutzer sich aktiv fuer eine Variante entscheidet --
// verworfene Vorschläge landen nie im Storage (siehe Architektur-Analyse).
// Seit Phase B (Galerie) legt dieselbe Route nach erfolgreichem Upload auch
// die persistierte Zeile in public.tellerdesigns an -- Bild und Metadaten
// gehoeren zum selben "Speichern"-Klick, kein separater zweiter Call.
export async function POST(req: NextRequest) {
  const check = await requireTier(req, MIN_TIER);
  if (!check.ok) return check.response;
  const { user } = check;

  const rateLimit = await checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `rate_limit_${rateLimit.reason}`, message: rateLimit.message },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const match = /^data:image\/([a-zA-Z+]+);base64,(.+)$/.exec(body.image ?? '');
  if (!match) {
    return NextResponse.json({ error: 'Ungültiges Bildformat.' }, { status: 400 });
  }
  const [, mime, base64] = match;
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return NextResponse.json({ error: 'Bild konnte nicht gelesen werden.' }, { status: 400 });
  }

  if (body.modus !== 'rezept' && body.modus !== 'frei') {
    return NextResponse.json({ error: 'Ungültiger Modus.' }, { status: 400 });
  }
  const titel = (body.titel ?? '').trim().slice(0, MAX_TITEL_LENGTH);
  if (!titel) {
    return NextResponse.json({ error: 'Kein Titel angegeben.' }, { status: 400 });
  }
  if (!body.stilrichtung || !STILRICHTUNGEN.includes(body.stilrichtung)) {
    return NextResponse.json({ error: 'Ungültige oder fehlende Stilrichtung.' }, { status: 400 });
  }
  if (!body.aufwand || !AUFWANDSSTUFEN.includes(body.aufwand)) {
    return NextResponse.json({ error: 'Ungültiger oder fehlender Aufwand.' }, { status: 400 });
  }
  if (!body.anrichteFokus || !ANRICHTE_FOKUSSE.includes(body.anrichteFokus)) {
    return NextResponse.json({ error: 'Ungültiger oder fehlender Anrichte-Fokus.' }, { status: 400 });
  }
  // "rezept"-Modus braucht eine gueltige Verknuepfung (DB-Constraint verlangt
  // das ohnehin), "frei" erzwingt umgekehrt IMMER null -- was der Client hier
  // schickt, wird ignoriert statt vertraut (Server ist die Quelle der Wahrheit).
  let rezeptId: number | null = null;
  let zubereitungszeit: number | null = null;
  let saison: string | null = null;
  if (body.modus === 'rezept') {
    if (!Number.isInteger(body.rezeptId) || (body.rezeptId as number) <= 0) {
      return NextResponse.json({ error: 'Kein Rezept angegeben.' }, { status: 400 });
    }
    rezeptId = body.rezeptId as number;
    zubereitungszeit = Number.isInteger(body.zubereitungszeit) ? (body.zubereitungszeit as number) : null;
    saison = typeof body.saison === 'string' && body.saison.trim() ? body.saison.trim().slice(0, MAX_SAISON_LENGTH) : null;
  }
  const techniken = sanitizeTechniken(body.techniken);

  try {
    const db = createAdminClient();
    const path = `${randomUUID()}.${mime === 'jpeg' ? 'jpg' : mime}`;
    const { error: uploadError } = await db.storage.from('teller-bilder').upload(path, buffer, {
      contentType: `image/${mime}`,
      cacheControl: '31536000',
      upsert: false,
    });
    if (uploadError) {
      console.error('[tellerdesigner/save] Upload fehlgeschlagen:', uploadError.message);
      return NextResponse.json({ error: 'Bild konnte nicht gespeichert werden.' }, { status: 500 });
    }
    const { data: publicUrlData } = db.storage.from('teller-bilder').getPublicUrl(path);
    const bildUrl = publicUrlData.publicUrl;

    const { data: inserted, error: insertError } = await db
      .from('tellerdesigns')
      .insert({
        user_id: user.id,
        bild_url: bildUrl,
        titel,
        rezept_id: rezeptId,
        modus: body.modus,
        stilrichtung: body.stilrichtung,
        aufwand: body.aufwand,
        anrichte_fokus: body.anrichteFokus,
        zubereitungszeit,
        saison,
        techniken,
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      // Bild liegt bereits im Storage, aber ohne Galerie-Zeile ist es nur
      // verwaistes Speichervolumen, kein sichtbarer Datenverlust fuer den
      // Nutzer -- deshalb Fehler melden statt still "erfolgreich" zu tun.
      console.error('[tellerdesigner/save] Insert fehlgeschlagen:', insertError.message);
      return NextResponse.json({ error: 'Design konnte nicht in der Galerie gespeichert werden.' }, { status: 500 });
    }

    return NextResponse.json({ url: bildUrl, id: inserted.id, createdAt: inserted.created_at });
  } catch (e) {
    console.error('[tellerdesigner/save] Fehler:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Bild konnte nicht gespeichert werden.' }, { status: 500 });
  }
}
