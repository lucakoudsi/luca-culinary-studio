import Link from 'next/link';
import { Bot, UtensilsCrossed, Wine, Beaker, Camera } from 'lucide-react';
import SiteHeader from '@/components/marketing/SiteHeader';
import Hero from '@/components/marketing/Hero';
import { getMarketingAuthState } from '@/lib/marketingAuth';
import { MARKETING_BG, MARKETING_BORDER, MARKETING_CREAM, MARKETING_CREAM_MUTED, MARKETING_GOLD } from '@/config/marketingTheme';

// Oeffentliche Landing-Page unter '/' -- ein Bildschirm, kein Scrollen auf
// normalen Viewports (h-screen + overflow-y-auto als Sicherheitsnetz statt
// hartem Clipping bei sehr kleinen Screens/starker Textvergroesserung).
// Server Component: der Login-Status wird HIER serverseitig ermittelt und
// als fertiger Prop an Header/Hero durchgereicht (kein clientseitiger
// Ladezustand mehr, kein Umspringen der Buttons -- siehe lib/marketingAuth.ts).

const FEATURE_TILES = [
  { icon: Bot, title: 'KI-Sous-Chef', text: 'Dein digitaler Küchenpartner' },
  { icon: UtensilsCrossed, title: 'Menü-Entwicklung', text: 'Kreative Menüs in Minuten' },
  { icon: Wine, title: 'Wein Pairing', text: 'Perfekte Begleitung für jedes Gericht' },
  { icon: Beaker, title: 'Fermentation-Expertise', text: 'Tradition trifft Innovation' },
  { icon: Camera, title: 'Food Photography', text: 'Professionelle Bilder für deine Gerichte' },
];

function FeatureBar() {
  return (
    <div className="flex-shrink-0 relative z-10" style={{ borderTop: `1px solid ${MARKETING_BORDER}`, background: 'rgba(255,255,255,0.02)' }}>
      {/* divide-[#2A2A2A] ist ein Tailwind-Arbitrary-Value -- Klassen koennen
          keine JS-Konstante referenzieren, Wert muss manuell mit
          MARKETING_BORDER synchron gehalten werden. */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-[#2A2A2A]">
        {FEATURE_TILES.map(f => (
          <div key={f.title} className="flex items-start gap-3 px-5 py-4 sm:py-5">
            <f.icon size={17} style={{ color: MARKETING_GOLD, flexShrink: 0, marginTop: 2 }} />
            <div className="min-w-0">
              <div className="font-heading font-semibold" style={{ fontSize: 12.5, color: MARKETING_CREAM }}>{f.title}</div>
              <div style={{ fontSize: 11, color: MARKETING_CREAM_MUTED, marginTop: 2, lineHeight: 1.4 }}>{f.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BottomBar() {
  return (
    <div className="flex-shrink-0 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2.5 px-5 sm:px-8 py-2.5"
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
    <div className="h-screen overflow-y-auto flex flex-col" style={{ background: MARKETING_BG }}>
      <SiteHeader authState={authState} />
      <Hero authState={authState} />
      <FeatureBar />
      <BottomBar />
    </div>
  );
}
