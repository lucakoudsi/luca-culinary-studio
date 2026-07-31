'use client';
import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from './SiteHeader';
import type { MarketingAuthState } from '@/lib/marketingAuth';
import { MARKETING_BG, MARKETING_CREAM, MARKETING_CREAM_MUTED, MARKETING_GOLD } from '@/config/marketingTheme';

// Geteilte Huelle fuer die 4 oeffentlichen Marketing-Unterseiten (/features,
// /studio, /preise, /ueber-uns) -- gleicher dunkler Look wie die
// Landing-Page, aber normal scrollend (kein Ein-Bildschirm-Zwang wie bei '/').
export default function MarketingPageShell({ eyebrow, title, children, heroAccent, authState }: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  // Optional: gedaempftes hero-bg.png als Fond hinter dem Titelbereich --
  // nur auf einzelnen Seiten, damit das Bild nicht auf jeder Unterseite
  // wiederholt wird (siehe /studio).
  heroAccent?: boolean;
  authState: MarketingAuthState;
}) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: MARKETING_BG }}>
      {heroAccent && (
        <div className="absolute inset-x-0 top-0 h-[520px] pointer-events-none">
          <Image src="/hero-bg.png" alt="" fill sizes="100vw" style={{ objectFit: 'cover', objectPosition: '80% 30%', opacity: 0.28 }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(10,10,10,0.55) 0%, ${MARKETING_BG} 95%)` }} />
        </div>
      )}
      {!heroAccent && (
        <div className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(107,58,75,0.22), transparent 70%)' }} />
      )}

      <div className="relative z-10 flex flex-col flex-1">
        <SiteHeader authState={authState} />
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] font-medium mb-8 transition-colors"
              style={{ color: MARKETING_CREAM_MUTED }}
              onMouseEnter={e => (e.currentTarget.style.color = MARKETING_GOLD)}
              onMouseLeave={e => (e.currentTarget.style.color = MARKETING_CREAM_MUTED)}>
              ← Zurück zur Startseite
            </Link>

            {eyebrow && (
              <span style={{ color: MARKETING_GOLD, fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600 }}>
                {eyebrow}
              </span>
            )}
            <h1 className="font-heading font-bold mt-3 mb-8" style={{ fontSize: 'clamp(28px, 5vw, 42px)', color: MARKETING_CREAM, lineHeight: 1.15 }}>
              {title}
            </h1>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
