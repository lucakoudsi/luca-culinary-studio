import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendAccessRequestEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { name, email, password, grund } = await req.json();

  if (!name || !email || !password || !grund) {
    return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 });
  }

  console.log('[register] ANON len:',    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 'MISSING');
  console.log('[register] SERVICE len:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length    ?? 'MISSING');
  console.log('[register] URL:',         process.env.NEXT_PUBLIC_SUPABASE_URL             ?? 'MISSING');
  console.log('[register] RESEND set:',  !!process.env.RESEND_API_KEY);

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[register] SUPABASE_SERVICE_ROLE_KEY is not set — check Vercel env vars');
    return NextResponse.json({ error: 'Server-Konfigurationsfehler: Service-Key fehlt.' }, { status: 500 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.error('[register-request] createAdminClient failed:', e);
    return NextResponse.json({ error: 'Server-Konfigurationsfehler (Supabase).' }, { status: 500 });
  }

  // Check for existing entry — select id + status + deleted_at
  const { data: existing } = await supabase
    .from('access_requests')
    .select('id, status, deleted_at')
    .eq('email', email)
    .maybeSingle();

  console.log('[register] existing entry:', existing);

  if (existing) {
    if (existing.status === 'pending') {
      return NextResponse.json({ error: 'Für diese Email-Adresse existiert bereits eine offene Anfrage.' }, { status: 409 });
    }

    // Active approved account → block
    if (existing.status === 'approved' && !existing.deleted_at) {
      return NextResponse.json({ error: 'Diese Email-Adresse wurde bereits genehmigt.' }, { status: 409 });
    }

    // Rejected or deleted account → remove old entry so re-registration works
    // (also handles unique constraint on email)
    const { error: delErr } = await supabase
      .from('access_requests')
      .delete()
      .eq('email', email);
    if (delErr) console.warn('[register] cleanup old entry failed:', delErr.message);
    else console.log('[register] cleaned up old entry for', email, '(status:', existing.status, ', deleted_at:', existing.deleted_at, ')');
  }

  const { data, error } = await supabase
    .from('access_requests')
    .insert({ name, email, password_temp: password, grund })
    .select('id, approve_token, reject_token')
    .single();

  console.log('[register] insert result:', error ? error.message : 'ok, id=' + data?.id);

  if (error) {
    console.error('[register-request] DB insert failed:', error.message, error.code);
    return NextResponse.json({ error: `Datenbankfehler: ${error.message}` }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const approveUrl = `${appUrl}/api/admin/approve?token=${data.approve_token}`;
  const rejectUrl  = `${appUrl}/api/admin/reject?token=${data.reject_token}`;

  try {
    await sendAccessRequestEmail({ name, email, grund, approveUrl, rejectUrl });
    console.log('[register-request] email sent to admin');
  } catch (e) {
    console.error('[register-request] email send failed (non-fatal):', e);
  }

  return NextResponse.json({ success: true });
}
