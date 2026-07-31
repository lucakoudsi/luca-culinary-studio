import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL } from '@/config/roles';

export const dynamic = 'force-dynamic';

// Liefert alle Feedbacks samt Nutzer-Anzeigenamen/-Email -- Filterung nach
// Kategorie/Status passiert clientseitig im Admin-Panel (gleiches Muster wie
// die Nutzersuche im Verwaltung-Tab), da die erwartbare Menge klein bleibt.
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: feedbackRows, error } = await admin
    .from('feedback')
    .select('id, user_id, kategorie, text, status, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = Array.from(new Set((feedbackRows ?? []).map(f => f.user_id)));
  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profiles ?? []).map(p => [p.id, p.full_name]));

  // E-Mails stehen nur in auth.users, nicht in profiles -- fuer die kleine
  // erwartbare Feedback-Menge reicht ein voller listUsers()-Abgleich statt
  // pro Zeile einzeln nachzuladen.
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((authData?.users ?? []).map(u => [u.id, u.email ?? '']));

  const entries = (feedbackRows ?? []).map(f => ({
    ...f,
    user_name: nameById.get(f.user_id) || emailById.get(f.user_id) || 'Unbekannt',
    user_email: emailById.get(f.user_id) || '',
  }));

  return NextResponse.json({ entries });
}
