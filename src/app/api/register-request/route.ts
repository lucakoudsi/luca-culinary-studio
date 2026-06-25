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

  // Check for any existing entry for this email
  const { data: existing } = await supabase
    .from('access_requests')
    .select('id, status')
    .eq('email', email)
    .maybeSingle();

  console.log('[register] existing entry:', existing);

  if (existing) {
    if (existing.status === 'pending') {
      return NextResponse.json(
        { error: 'Für diese Email-Adresse existiert bereits eine offene Anfrage. Bitte warte auf Genehmigung.' },
        { status: 409 }
      );
    }

    if (existing.status === 'approved') {
      // Check if the Auth account actually still exists (might have been deleted by admin)
      const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const authAccountExists = usersData?.users?.some(
        u => u.email?.toLowerCase() === email.toLowerCase()
      );

      console.log('[register] approved entry found, auth account exists:', authAccountExists);

      if (authAccountExists) {
        // Active account — user should log in, not re-register
        return NextResponse.json(
          { error: 'Diese Email-Adresse ist bereits registriert. Bitte logge dich ein.' },
          { status: 409 }
        );
      }

      // Auth account was deleted but access_requests wasn't cleaned up — allow re-registration
      console.log('[register] auth account gone, cleaning up stale approved entry for', email);
      await supabase.from('access_requests').delete().eq('email', email);
    } else {
      // status = 'rejected', 'deleted', or anything else → allow re-registration
      console.log('[register] cleaning up old entry with status:', existing.status, 'for', email);
      await supabase.from('access_requests').delete().eq('email', email);
    }
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
