import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_EMAIL, getUserTier, getMinTierForPath } from '@/config/roles';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage  = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isPublicApi = pathname.startsWith('/api/register-request')
                   || pathname.startsWith('/api/admin/approve')
                   || pathname.startsWith('/api/admin/reject');

  // ── Not logged in → login ─────────────────────────────────────────────────
  if (!user && !isAuthPage && !isPublicApi) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // ── Logged in + auth page → dashboard ────────────────────────────────────
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // ── KI-Seiten: gesperrt solange AI_ENABLED !== 'true' ────────────────────
  const AI_LOCKED = ['/kreativlabor', '/menuegenerator', '/tellerdesigner'];
  const aiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';
  if (!aiEnabled && AI_LOCKED.some(r => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // ── Tier-basierter Schutz ─────────────────────────────────────────────────
  if (user) {
    const minTier = getMinTierForPath(pathname);

    if (minTier > 1 && user.email !== ADMIN_EMAIL) {
      // Fetch profile once per request — only for protected routes
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: profile } = await admin
        .from('profiles')
        .select('stufe')
        .eq('id', user.id)
        .maybeSingle();

      const tier = getUserTier(user.email, profile?.stufe);
      if (tier < minTier) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
