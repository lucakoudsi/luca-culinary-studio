import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL } from '@/config/roles';

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
      if (arErr) console.warn('[delete user] access_requests update failed:', arErr.message);
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
    const { titel, stufe } = await req.json();

    // stufe must be 1-4 if provided
    if (stufe !== undefined && stufe !== null) {
      const s = Number(stufe);
      if (!Number.isInteger(s) || s < 1 || s > 4) {
        return NextResponse.json({ error: 'Ungültige Stufe (1–4)' }, { status: 400 });
      }
    }

    const update: Record<string, unknown> = {
      id: params.id,
      updated_at: new Date().toISOString(),
    };
    if (titel !== undefined) update.titel = titel;
    if (stufe !== undefined) update.stufe = stufe;

    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .upsert(update, { onConflict: 'id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    console.log('[admin/users PATCH]', params.id, 'titel:', titel, 'stufe:', stufe);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[admin/users PATCH]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
