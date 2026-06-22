import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendRejectedEmail } from '@/lib/email';

const html = (title: string, body: string) => `
<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:80px;background:#f9f9f9;">
<div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;padding:48px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="font-size:48px;margin-bottom:16px;">❌</div>
  <h1 style="color:#1a1a1a;margin-bottom:8px;">${title}</h1>
  <p style="color:#666;">${body}</p>
</div></body></html>`;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return new NextResponse(html('Ungültiger Link', 'Kein Token angegeben.'), { headers: { 'Content-Type': 'text/html' }, status: 400 });

  const supabase = createAdminClient();

  const { data: request, error } = await supabase
    .from('access_requests')
    .select('*')
    .eq('reject_token', token)
    .single();

  if (error || !request) return new NextResponse(html('Nicht gefunden', 'Diese Anfrage existiert nicht.'), { headers: { 'Content-Type': 'text/html' }, status: 404 });
  if (request.status !== 'pending') return new NextResponse(html('Bereits bearbeitet', `Status ist bereits: ${request.status}`), { headers: { 'Content-Type': 'text/html' }, status: 409 });

  await supabase
    .from('access_requests')
    .update({ status: 'rejected', password_temp: null })
    .eq('id', request.id);

  await sendRejectedEmail(request.email, request.name);

  return new NextResponse(
    html('Abgelehnt', `Die Anfrage von ${request.name} (${request.email}) wurde abgelehnt.`),
    { headers: { 'Content-Type': 'text/html' } }
  );
}
