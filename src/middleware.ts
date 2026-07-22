import { createServerClient } from '@supabase/ssr';
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
  // Oeffentlich einsehbar unabhaengig vom Login-Status (kein Redirect in
  // beide Richtungen, anders als isAuthPage) -- AGB/Datenschutz muessen
  // z.B. auch aus der Checkbox auf /register heraus lesbar sein.
  const isPublicPage = pathname.startsWith('/agb') || pathname.startsWith('/datenschutz');
  const isPublicRoute = pathname.startsWith('/api/register')
                   || pathname.startsWith('/api/admin/approve')
                   || pathname.startsWith('/api/admin/reject')
                   // Ziel des Supabase-Bestaetigungslinks -- Session existiert
                   // erst NACH dem Code-Tausch in dieser Route selbst.
                   || pathname.startsWith('/auth/callback')
                   // Kommt von Stripes Servern, nie mit Supabase-Session --
                   // Auth laeuft ueber die Signaturpruefung (STRIPE_WEBHOOK_SECRET)
                   // in der Route selbst, nicht ueber eingeloggte Nutzer.
                   || pathname.startsWith('/api/stripe/webhook');

  // ── Not logged in → login ─────────────────────────────────────────────────
  if (!user && !isAuthPage && !isPublicPage && !isPublicRoute) {
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

  // ── KI-Seiten: jede Route prueft ihr EIGENES Flag, nicht ein globales ──────
  const AI_ROUTE_FLAGS: Record<string, string | undefined> = {
    '/menuegenerator': process.env.NEXT_PUBLIC_AI_MENU_ENABLED,
    '/tellerdesigner': process.env.NEXT_PUBLIC_AI_PLATE_ENABLED,
  };
  for (const [prefix, flag] of Object.entries(AI_ROUTE_FLAGS)) {
    if (pathname.startsWith(prefix) && flag !== 'true') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // ── Tier-basierter Schutz ─────────────────────────────────────────────────
  if (user) {
    const minTier = getMinTierForPath(pathname);

    if (minTier > 1 && user.email !== ADMIN_EMAIL) {
      // Fetch profile once per request — only for protected routes.
      // Session-bound Client statt Service-Role: laeuft Edge-kompatibel (kein
      // Node-only Code aus supabase-admin.ts mehr im Middleware-Bundle) und
      // RLS erlaubt einem Nutzer explizit das Lesen der eigenen Zeile
      // (verifiziert: fremde Profile bleiben weiterhin blockiert).
      const { data: profile } = await supabase
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
