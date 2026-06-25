import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL, TITLE_TO_TIER } from '@/config/roles';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (params.id === user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    // Fetch email before deleting (for access_requests soft-delete)
    const { data: authUser } = await admin.auth.admin.getUserById(params.id);
    const email = authUser?.user?.email;

    // Delete Supabase Auth account (profiles cascade via ON DELETE CASCADE)
    const { error: deleteErr } = await admin.auth.admin.deleteUser(params.id);
    console.log('[delete user]', params.id, deleteErr ? deleteErr.message : 'ok');

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // Soft-delete in access_requests (keep history)
    if (email) {
      const { error: arErr } = await admin
        .from('access_requests')
        .update({ deleted_at: new Date().toISOString() })
        .eq('email', email);
      if (arErr) console.warn('[delete user] access_requests update failed (column may not exist yet):', arErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[delete user]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { titel } = await req.json();

    // Only allow known titles (or null to clear)
    if (titel !== null && !(titel in TITLE_TO_TIER)) {
      return NextResponse.json({ error: 'Ungültiger Titel' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .upsert({ id: params.id, titel, updated_at: new Date().toISOString() }, { onConflict: 'id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    console.log('[admin/users PATCH] updated titel for', params.id, '→', titel);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[admin/users PATCH]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
