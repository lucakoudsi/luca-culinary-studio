'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import MarketingPrimaryButton from './MarketingPrimaryButton';
import type { MarketingAuthState } from '@/lib/marketingAuth';
import { MARKETING_BG, MARKETING_CREAM, MARKETING_CREAM_MUTED, MARKETING_GOLD } from '@/config/marketingTheme';

export default function Hero({ authState }: { authState: MarketingAuthState }) {
  return (
    <section className="relative flex-1 min-h-0 overflow-hidden">
      {/* Handy/Tablet: Bild als Vollflaechen-Hintergrund mit dunklem Overlay */}
      <div className="absolute inset-0 lg:hidden">
        <Image src="/hero-bg.png" alt="" fill priority sizes="100vw" style={{ objectFit: 'cover', objectPosition: '75% 50%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.9) 75%)' }} />
      </div>
      {/* Desktop: solide dunkle Basis links, echtes Bild nur in der rechten Spalte */}
      <div className="absolute inset-0 hidden lg:block" style={{ background: MARKETING_BG }} />

      <div className="relative z-10 h-full grid grid-cols-1 lg:grid-cols-2">
        {/* Text */}
        <div className="flex items-center h-full px-6 sm:px-10 lg:px-16">
          <div className="max-w-[560px] py-8 lg:py-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(107,58,75,0.28)', border: `1px solid ${MARKETING_GOLD}66` }}>
              <span style={{ color: MARKETING_GOLD, fontSize: 10 }}>✦</span>
              <span style={{ color: MARKETING_GOLD, fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 600 }}>
                Dein persönliches Michelin Studio
              </span>
            </div>

            <h1 className="font-heading font-bold" style={{ fontSize: 'clamp(34px, 5.5vw, 58px)', lineHeight: 1.08 }}>
              <span style={{ color: MARKETING_CREAM }}>Kreativität.</span><br />
              <span style={{ color: MARKETING_CREAM }}>Perfektion.</span><br />
              <span style={{ color: MARKETING_GOLD }}>Jeden Tag.</span>
            </h1>

            <p className="mt-5 max-w-[440px]" style={{ fontSize: 15.5, color: MARKETING_CREAM_MUTED, lineHeight: 1.65 }}>
              Culinary Studio ist dein digitaler Sous-Chef. Entwickle außergewöhnliche Menüs, perfektioniere Rezepte und bringe deine kulinarischen Ideen auf ein neues Level – mit der Kraft künstlicher Intelligenz.
            </p>

            <div className="flex flex-wrap items-center gap-5 mt-8">
              {authState === 'loggedIn' ? (
                <MarketingPrimaryButton href="/dashboard">Studio öffnen</MarketingPrimaryButton>
              ) : (
                <MarketingPrimaryButton href="/register">Kostenlos starten</MarketingPrimaryButton>
              )}
              <Link href="/features" className="inline-flex items-center gap-2 text-[12.5px] font-semibold transition-colors"
                style={{ color: MARKETING_CREAM, letterSpacing: '1px', textTransform: 'uppercase' }}
                onMouseEnter={e => (e.currentTarget.style.color = MARKETING_GOLD)}
                onMouseLeave={e => (e.currentTarget.style.color = MARKETING_CREAM)}>
                <Play size={11} fill={MARKETING_GOLD} color={MARKETING_GOLD} /> Studio entdecken
              </Link>
            </div>
          </div>
        </div>

        {/* Bild, nur Desktop */}
        <div className="relative hidden lg:block h-full">
          <Image src="/hero-bg.png" alt="Angerichtetes Gericht auf dunklem Marmor" fill priority
            sizes="50vw" style={{ objectFit: 'cover', objectPosition: '72% 50%' }} />
          <div className="absolute inset-y-0 left-0 w-40 pointer-events-none"
            style={{ background: `linear-gradient(90deg, ${MARKETING_BG}, transparent)` }} />
        </div>
      </div>
    </section>
  );
}
