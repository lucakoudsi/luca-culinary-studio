import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendApprovedEmail } from '@/lib/email';

const html = (title: string, body: string, color: string) => `
<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:80px;background:#f9f9f9;">
<div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;padding:48px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="font-size:48px;margin-bottom:16px;">${color === 'green' ? '✅' : '❌'}</div>
  <h1 style="color:#1a1a1a;margin-bottom:8px;">${title}</h1>
  <p style="color:#666;">${body}</p>
</div></body></html>`;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return new NextResponse(html('Ungültiger Link', 'Kein Token angegeben.', 'red'), { headers: { 'Content-Type': 'text/html' }, status: 400 });

  const supabase = createAdminClient();

  const { data: request, error } = await supabase
    .from('access_requests')
    .select('*')
    .eq('approve_token', token)
    .single();

  if (error || !request) return new NextResponse(html('Nicht gefunden', 'Diese Anfrage existiert nicht.', 'red'), { headers: { 'Content-Type': 'text/html' }, status: 404 });
  if (request.status !== 'pending') return new NextResponse(html('Bereits bearbeitet', `Diese Anfrage hat bereits den Status: ${request.status}`, 'red'), { headers: { 'Content-Type': 'text/html' }, status: 409 });

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: request.email,
    password: request.password_temp,
    user_metadata: { full_name: request.name },
    email_confirm: true,
  });

  if (authError) {
    return new NextResponse(html('Fehler', `Account konnte nicht erstellt werden: ${authError.message}`, 'red'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }

  // Ensure profile has stufe set (email-link approvals default to stufe 2)
  if (authData?.user) {
    const stufe = typeof request.stufe === 'number' ? request.stufe : 2;
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      full_name: request.name,
      stufe,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (profileErr) console.error('[approve token] profile upsert failed:', profileErr.message);
  }

  await supabase
    .from('access_requests')
    .update({ status: 'approved', password_temp: null })
    .eq('id', request.id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  await sendApprovedEmail(request.email, request.name, appUrl);

  return new NextResponse(
    html('Genehmigt!', `${request.name} (${request.email}) hat jetzt Zugang und wurde per Email benachrichtigt.`, 'green'),
    { headers: { 'Content-Type': 'text/html' } }
  );
}
