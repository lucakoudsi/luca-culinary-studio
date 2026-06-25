import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendApprovedEmail, sendRejectedEmail } from '@/lib/email';
import { ADMIN_EMAIL } from '@/config/roles';

export async function POST(req: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 403 });
  }

  const { id, action } = await req.json();
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Ungültige Parameter.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: request, error } = await admin
    .from('access_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !request) return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 });
  if (request.status !== 'pending') return NextResponse.json({ error: 'Bereits bearbeitet.' }, { status: 409 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (action === 'approve') {
    const { error: authError } = await admin.auth.admin.createUser({
      email: request.email,
      password: request.password_temp,
      user_metadata: { full_name: request.name },
      email_confirm: true,
    });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    await admin.from('access_requests').update({ status: 'approved', password_temp: null }).eq('id', id);
    await sendApprovedEmail(request.email, request.name, appUrl);
  } else {
    await admin.from('access_requests').update({ status: 'rejected', password_temp: null }).eq('id', id);
    await sendRejectedEmail(request.email, request.name);
  }

  return NextResponse.json({ success: true });
}
