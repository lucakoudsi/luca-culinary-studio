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
  const { data: existing, error: existingErr } = await supabase
    .from('access_requests')
    .select('id, status')
    .eq('email', email)
    .maybeSingle();

  console.log('[register] existing entry:', existing, 'err:', existingErr?.message ?? null);

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
        return NextResponse.json(
          { error: 'Diese Email-Adresse ist bereits registriert. Bitte logge dich ein.' },
          { status: 409 }
        );
      }

      // Auth account deleted — clean up stale approved entry so email is free
      console.log('[register] auth account gone, deleting stale approved entry for', email);
      await supabase.from('access_requests').delete().eq('email', email);
    } else {
      // status = 'rejected' or anything else → allow re-registration
      console.log('[register] cleaning up old entry with status:', existing.status, 'for', email);
      await supabase.from('access_requests').delete().eq('email', email);
    }
  }

  // UPSERT (defensive: handles UNIQUE-constraint races; requires UNIQUE(email) in DB)
  // If no unique constraint exists, falls back to plain INSERT behaviour.
  console.log('[register] inserting:', { name, email });
  const { data: inserted, error: insertError } = await supabase
    .from('access_requests')
    .upsert(
      { name, email, password_temp: password, grund, status: 'pending' },
      { onConflict: 'email', ignoreDuplicates: false }
    )
    .select('id, approve_token, reject_token')
    .single();

  console.log('[register] upsert result:',
    insertError
      ? `error: ${insertError.message} (code: ${insertError.code})`
      : `ok, id=${inserted?.id}`
  );

  if (insertError) {
    console.error('[register-request] upsert failed:', insertError.message, insertError.code);
    return NextResponse.json({ error: `Datenbankfehler: ${insertError.message}` }, { status: 500 });
  }

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const approveUrl  = `${appUrl}/api/admin/approve?token=${inserted?.approve_token ?? ''}`;
  const rejectUrl   = `${appUrl}/api/admin/reject?token=${inserted?.reject_token ?? ''}`;

  try {
    await sendAccessRequestEmail({ name, email, grund, approveUrl, rejectUrl });
    console.log('[register-request] email sent to admin');
  } catch (e) {
    console.error('[register-request] email send failed (non-fatal):', e);
  }

  return NextResponse.json({ success: true });
}
