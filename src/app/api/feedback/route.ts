import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/get-request-user';
import { createAdminClient } from '@/lib/supabase-admin';
import { FEEDBACK_KATEGORIEN, FEEDBACK_TEXT_MAX_LENGTH, FEEDBACK_RATE_LIMIT_PER_HOUR } from '@/config/feedback';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 });
  }

  let body: { kategorie?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const { kategorie, text } = body;
  if (!FEEDBACK_KATEGORIEN.includes(kategorie as never)) {
    return NextResponse.json({ error: 'Ungültige Kategorie.' }, { status: 400 });
  }
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Bitte einen Text eingeben.' }, { status: 400 });
  }
  const trimmed = text.trim();
  if (trimmed.length > FEEDBACK_TEXT_MAX_LENGTH) {
    return NextResponse.json({ error: `Maximal ${FEEDBACK_TEXT_MAX_LENGTH} Zeichen.` }, { status: 400 });
  }

  const db = createAdminClient();

  // Eigene, einfache Zeitfenster-Pruefung statt des AI-Rate-Limit-RPCs
  // (check_and_increment_rate_limit) -- das ist fuer minuten-/tagesbasierte
  // KI-Kostenkontrolle gebaut, hier geht es um Missbrauchsschutz auf einem
  // guenstigen Schreibvorgang mit anderem Zeitfenster (Stunde). Bewusst ohne
  // atomare Sperre (count-then-insert) -- bei einem moderaten 5/Stunde-Limit
  // fuer ein nicht-monetaeres Feature ist ein seltener Off-by-one durch zwei
  // zeitgleiche Anfragen tolerierbar, eine eigene RPC waere hier ueberdimensioniert.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await db
    .from('feedback')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo);

  if (countErr) {
    console.error('[feedback] Rate-Limit-Pruefung fehlgeschlagen:', countErr.message);
  } else if ((count ?? 0) >= FEEDBACK_RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      { error: `Maximal ${FEEDBACK_RATE_LIMIT_PER_HOUR} Feedback-Einträge pro Stunde. Bitte später erneut versuchen.` },
      { status: 429 },
    );
  }

  const { error } = await db.from('feedback').insert({
    user_id: user.id,
    kategorie,
    text: trimmed,
  });

  if (error) {
    console.error('[feedback] Anlegen fehlgeschlagen:', error.message);
    return NextResponse.json({ error: 'Feedback konnte nicht gespeichert werden.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
