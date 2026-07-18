import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const MIN_TIER = 3; // Pro -- gleiche Sperre wie die Generierung selbst

// Save-on-demand: Generierte Bilder kommen als b64 zurueck und werden NUR
// hochgeladen, wenn der Nutzer sich aktiv fuer eine Variante entscheidet --
// verworfene Vorschläge landen nie im Storage (siehe Architektur-Analyse).
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

  let body: { image?: string };
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
    const { data } = db.storage.from('teller-bilder').getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error('[tellerdesigner/save] Fehler:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Bild konnte nicht gespeichert werden.' }, { status: 500 });
  }
}
