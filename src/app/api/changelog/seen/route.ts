import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/get-request-user';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// Wird beim Oeffnen des Glockchen-Panels aufgerufen -- markiert "gesehen bis
// jetzt", der Indikator-Punkt verschwindet dadurch fuer alle Eintraege bis
// zu diesem Zeitpunkt.
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 });
  }

  const db = createAdminClient();
  const { error } = await db.from('profiles').update({ changelog_seen_at: new Date().toISOString() }).eq('id', user.id);

  if (error) {
    console.error('[changelog/seen] Update fehlgeschlagen:', error.message);
    return NextResponse.json({ error: 'Konnte nicht gespeichert werden.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
