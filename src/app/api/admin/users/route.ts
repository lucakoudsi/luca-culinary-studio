import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL } from '@/config/roles';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const admin = createAdminClient();

    // All auth users (up to 1000)
    const { data: authData, error: authErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

    // All profiles
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url, titel');

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

    const users = authData.users.map(u => ({
      id:         u.id,
      email:      u.email ?? '',
      full_name:  profileMap.get(u.id)?.full_name ?? u.user_metadata?.full_name ?? '',
      avatar_url: profileMap.get(u.id)?.avatar_url ?? null,
      titel:      profileMap.get(u.id)?.titel ?? null,
    }));

    // Sort: admin first, then by email
    users.sort((a, b) => {
      if (a.email === ADMIN_EMAIL) return -1;
      if (b.email === ADMIN_EMAIL) return 1;
      return a.email.localeCompare(b.email);
    });

    return NextResponse.json({ users });
  } catch (e) {
    console.error('[admin/users GET]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
