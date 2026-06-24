import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL, TITLE_TO_TIER } from '@/config/roles';
import { sendApprovedEmail } from '@/lib/email';

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
    const { titel } = await req.json();
    if (titel && !(titel in TITLE_TO_TIER)) {
      return NextResponse.json({ error: 'Ungültiger Titel' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: request, error: fetchErr } = await admin
      .from('access_requests')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchErr || !request) return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 });
    if (request.status !== 'pending') return NextResponse.json({ error: 'Bereits bearbeitet.' }, { status: 409 });

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: request.email,
      password: request.password_temp,
      user_metadata: { full_name: request.name },
      email_confirm: true,
    });
    if (authError) {
      console.error('[approve] createUser failed:', authError.message);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Upsert profile with titel + full_name
    if (authData.user) {
      const profileFields: Record<string, unknown> = {
        id: authData.user.id,
        full_name: request.name,
        updated_at: new Date().toISOString(),
      };
      if (titel) profileFields.titel = titel;
      await admin.from('profiles').upsert(profileFields, { onConflict: 'id' });
    }

    // Mark approved, clear temp password
    await admin
      .from('access_requests')
      .update({ status: 'approved', password_temp: null })
      .eq('id', params.id);

    // Send welcome email (non-fatal)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try {
      await sendApprovedEmail(request.email, request.name, appUrl);
    } catch (e) {
      console.error('[approve] welcome email failed (non-fatal):', e);
    }

    console.log('[approve] approved request', params.id, 'for', request.email, 'with titel:', titel ?? '—');
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[approve]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
