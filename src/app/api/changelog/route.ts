import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/get-request-user';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// Sichtbare Changelog-Eintraege + der "gesehen bis"-Zeitstempel des Nutzers --
// eine Route fuer Glockchen-Panel (letzte 5) UND /neuigkeiten (volle Liste),
// Client entscheidet per .slice(0, 5), keine Query-Params noetig bei der
// erwartbar niedrigen Eintragszahl.
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 });
  }

  const db = createAdminClient();

  const [{ data: entries, error: entriesErr }, { data: profile }] = await Promise.all([
    db.from('changelog_entries')
      .select('id, titel, text, kategorie, created_at')
      .eq('sichtbar', true)
      .order('created_at', { ascending: false }),
    db.from('profiles').select('changelog_seen_at').eq('id', user.id).maybeSingle(),
  ]);

  if (entriesErr) {
    console.error('[changelog] Laden fehlgeschlagen:', entriesErr.message);
    return NextResponse.json({ error: 'Changelog konnte nicht geladen werden.' }, { status: 500 });
  }

  return NextResponse.json({ entries: entries ?? [], lastSeenAt: profile?.changelog_seen_at ?? null });
}
