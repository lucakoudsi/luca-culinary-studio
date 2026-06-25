import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendAccessRequestEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { name, email, password, grund } = await req.json();

  if (!name || !email || !password || !grund) {
    return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 });
  }

  console.log('[register] SERVICE len:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 'MISSING');
  console.log('[register] RESEND set:',  !!process.env.RESEND_API_KEY);

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server-Konfigurationsfehler: Service-Key fehlt.' }, { status: 500 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.error('[register-request] createAdminClient failed:', e);
    return NextResponse.json({ error: 'Server-Konfigurationsfehler (Supabase).' }, { status: 500 });
  }

  // Alle bestehenden Einträge für diese Email laden
  const { data: existingEntries, error: existingErr } = await supabase
    .from('access_requests')
    .select('id, status')
    .eq('email', email);

  console.log('[register] existing entries:', existingEntries?.length ?? 0, existingEntries, 'err:', existingErr?.message ?? null);

  // Einzige Blockierung: offene Anfrage läuft bereits
  const hasPending = existingEntries?.some(e => e.status === 'pending');
  if (hasPending) {
    return NextResponse.json(
      { error: 'Für diese Email-Adresse existiert bereits eine offene Anfrage. Bitte warte auf Genehmigung.' },
      { status: 409 }
    );
  }

  // Alle alten Einträge löschen (approved, rejected, Duplikate, egal)
  if (existingEntries && existingEntries.length > 0) {
    const { error: delErr } = await supabase
      .from('access_requests')
      .delete()
      .eq('email', email);
    console.log('[register] deleted', existingEntries.length, 'old entries for', email, 'err:', delErr?.message ?? null);
  }

  // Neuen Eintrag mit status='pending' anlegen
  console.log('[register] inserting fresh pending entry:', { name, email });
  const { data: inserted, error: insertError } = await supabase
    .from('access_requests')
    .insert({
      name,
      email,
      password_temp: password,
      grund,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select('id, approve_token, reject_token')
    .single();

  console.log('[register] insert result:',
    insertError
      ? `error: ${insertError.message} (code: ${insertError.code})`
      : `ok, id=${inserted?.id}, status=pending`
  );

  if (insertError) {
    console.error('[register-request] insert failed:', insertError.message, insertError.code);
    return NextResponse.json({ error: `Datenbankfehler: ${insertError.message}` }, { status: 500 });
  }

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const approveUrl = `${appUrl}/api/admin/approve?token=${inserted?.approve_token ?? ''}`;
  const rejectUrl  = `${appUrl}/api/admin/reject?token=${inserted?.reject_token ?? ''}`;

  try {
    await sendAccessRequestEmail({ name, email, grund, approveUrl, rejectUrl });
    console.log('[register-request] email sent to admin');
  } catch (e) {
    console.error('[register-request] email send failed (non-fatal):', e);
  }

  return NextResponse.json({ success: true });
}
