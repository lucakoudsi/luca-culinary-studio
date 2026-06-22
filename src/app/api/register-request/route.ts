import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendAccessRequestEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { name, email, password, grund } = await req.json();

  if (!name || !email || !password || !grund) {
    return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 });
  }

  const supabase = createAdminClient();

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const approveUrl = `${appUrl}/api/admin/approve?token=${data.approve_token}`;
  const rejectUrl  = `${appUrl}/api/admin/reject?token=${data.reject_token}`;

  await sendAccessRequestEmail({ name, email, grund, approveUrl, rejectUrl });

  return NextResponse.json({ success: true });
}
