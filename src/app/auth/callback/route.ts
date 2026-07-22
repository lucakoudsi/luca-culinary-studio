import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// Ziel des Bestaetigungslinks aus der Supabase-Mail (emailRedirectTo in
// /api/register). Tauscht den Code gegen eine Session und setzt dabei die
// Auth-Cookies -- danach ist der Nutzer eingeloggt und bestaetigt.
// Unterstuetzt sowohl den PKCE-Code-Flow (?code=) als auch den
// OTP-Token-Flow (?token_hash=&type=), je nachdem welches Format das
// tatsaechlich konfigurierte Supabase-Mailtemplate verwendet.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
    console.error('[auth/callback] exchangeCodeForSession fehlgeschlagen:', error.message);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'email',
    });
    if (!error) return NextResponse.redirect(`${origin}/`);
    console.error('[auth/callback] verifyOtp fehlgeschlagen:', error.message);
  }

  return NextResponse.redirect(`${origin}/login?confirm_error=1`);
}
