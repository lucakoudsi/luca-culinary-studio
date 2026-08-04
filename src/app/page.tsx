import Link from 'next/link';
import SiteHeader from '@/components/marketing/SiteHeader';
import SelectionCards from '@/components/marketing/SelectionCards';
import BenefitsRow from '@/components/marketing/BenefitsRow';
import QuoteSection from '@/components/marketing/QuoteSection';
import { getMarketingAuthState } from '@/lib/marketingAuth';
import { MARKETING_BG, MARKETING_BORDER, MARKETING_CREAM, MARKETING_CREAM_MUTED, MARKETING_GOLD } from '@/config/marketingTheme';

// Oeffentliche Landing-Page unter '/' -- normal scrollend (Hero-Kopf +
// zwei Auswahlkarten + Vorteilsreihe + Zitatbereich), kein Ein-Bildschirm-
// Zwang mehr wie in der vorherigen Fassung. Server Component: der
// Login-Status wird HIER serverseitig ermittelt und als fertiger Prop an
// Header/Karten durchgereicht (siehe lib/marketingAuth.ts).

function BottomBar() {
  return (
    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2.5 px-5 sm:px-8 py-4"
      style={{ borderTop: `1px solid ${MARKETING_BORDER}` }}>
      <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ border: `1px solid ${MARKETING_BORDER}` }}>
        <span style={{ color: MARKETING_GOLD, fontSize: 9 }}>✦</span>
        <span style={{ fontSize: 10, letterSpacing: '0.5px', color: MARKETING_CREAM_MUTED }}>Crafted for Chefs · Built with Passion</span>
      </div>
      <div className="flex items-center gap-5">
        <Link href="/agb" className="transition-colors" style={{ fontSize: 11, color: MARKETING_CREAM_MUTED }}>AGB</Link>
        <Link href="/datenschutz" className="transition-colors" style={{ fontSize: 11, color: MARKETING_CREAM_MUTED }}>Datenschutz</Link>
        <Link href="/impressum" className="transition-colors" style={{ fontSize: 11, color: MARKETING_CREAM_MUTED }}>Impressum</Link>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const authState = await getMarketingAuthState();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: MARKETING_BG }}>
      <SiteHeader authState={authState} />

      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(107,58,75,0.22), transparent 70%)' }} />

        <div className="relative z-10">
          {/* Hero-Kopf: nur Ueberschrift, KEIN grosses Bild mehr -- die
           * beiden Auswahlkarten darunter tragen jetzt die Bildsprache,
           * ein zweites grosses Foto direkt darueber waere redundant. */}
          <div className="max-w-2xl mx-auto text-center px-5 sm:px-8 pt-16 sm:pt-24 pb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(107,58,75,0.28)', border: `1px solid ${MARKETING_GOLD}66` }}>
              <span style={{ color: MARKETING_GOLD, fontSize: 10 }}>✦</span>
              <span style={{ color: MARKETING_GOLD, fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 600 }}>
                Dein persönliches Michelin Studio
              </span>
            </div>

            <h1 className="font-heading font-bold" style={{ fontSize: 'clamp(30px, 5vw, 48px)', lineHeight: 1.15 }}>
              <span style={{ color: MARKETING_CREAM }}>Wähle deinen Weg</span><br />
              <span style={{ color: MARKETING_GOLD }}>in der Küche.</span>
            </h1>

            <p className="mt-5 max-w-xl mx-auto" style={{ fontSize: 15.5, color: MARKETING_CREAM_MUTED, lineHeight: 1.65 }}>
              Ob du bereits professionell kochst oder gerade erst beginnst -- Culinary Studio begleitet dich mit der Kraft künstlicher Intelligenz.
            </p>
          </div>

          <SelectionCards authState={authState} />
          <BenefitsRow />
          <QuoteSection />
        </div>
      </main>

      <BottomBar />
    </div>
  );
}
