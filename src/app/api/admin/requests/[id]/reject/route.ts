import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL } from '@/config/roles';
import { sendRejectedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const admin = createAdminClient();

    const { data: request, error: fetchErr } = await admin
      .from('access_requests')
      .select('id, name, email, status')
      .eq('id', params.id)
      .single();

    if (fetchErr || !request) return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 });
    if (request.status !== 'pending') return NextResponse.json({ error: 'Bereits bearbeitet.' }, { status: 409 });

    const { error: updateErr } = await admin
      .from('access_requests')
      .update({ status: 'rejected', password_temp: null })
      .eq('id', params.id);

    if (updateErr) {
      console.error('[reject] status update failed:', updateErr.message);
      return NextResponse.json(
        { error: `Status konnte nicht gespeichert werden: ${updateErr.message}` },
        { status: 500 },
      );
    }

    try {
      await sendRejectedEmail(request.email, request.name);
    } catch (e) {
      console.error('[reject] rejection email failed (non-fatal):', e);
    }

    console.log('[reject] rejected request', params.id, 'for', request.email);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[reject]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
