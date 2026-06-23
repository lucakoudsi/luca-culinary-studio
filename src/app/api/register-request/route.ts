import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendAccessRequestEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { name, email, password, grund } = await req.json();

  if (!name || !email || !password || !grund) {
    return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 });
  }

  // Env-Check für Debugging — sichtbar in Vercel → Deployment → Logs
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

  const { data: existing } = await supabase
    .from('access_requests')
    .select('status')
    .eq('email', email)
    .maybeSingle();

  if (existing?.status === 'pending') {
    return NextResponse.json({ error: 'Für diese Email-Adresse existiert bereits eine offene Anfrage.' }, { status: 409 });
  }
  if (existing?.status === 'approved') {
    return NextResponse.json({ error: 'Diese Email-Adresse wurde bereits genehmigt.' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('access_requests')
    .insert({ name, email, password_temp: password, grund })
    .select('id, approve_token, reject_token')
    .single();

  if (error) {
    console.error('[register-request] DB insert failed:', error.message, error.code);
    return NextResponse.json({ error: `Datenbankfehler: ${error.message}` }, { status: 500 });
  }

  console.log('[register-request] inserted access_request id:', data.id);

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
