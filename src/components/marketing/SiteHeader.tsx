'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MarketingPrimaryButton from './MarketingPrimaryButton';
import type { MarketingAuthState } from '@/lib/marketingAuth';
import {
  MARKETING_CREAM as CREAM, MARKETING_CREAM_MUTED as CREAM_MUTED, MARKETING_GOLD as GOLD,
  MARKETING_BORDER as BORDER,
} from '@/config/marketingTheme';

const NAV_ITEMS = [
  { href: '/features', label: 'Features' },
  { href: '/studio', label: 'Creator Studio' },
  { href: '/preise', label: 'Preise' },
  { href: '/ueber-uns', label: 'Über uns' },
];

export default function SiteHeader({ authState }: { authState: MarketingAuthState }) {
  const pathname = usePathname();

  return (
    <header className="relative z-20 flex items-center justify-between px-5 sm:px-8 h-16 sm:h-20 flex-shrink-0"
      style={{ borderBottom: `1px solid ${BORDER}` }}>
      <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
        <img src="/chef-logo-gold.png" alt="" width={30} height={30} style={{ width: 30, height: 30, objectFit: 'contain' }} />
        <span className="font-heading font-bold hidden sm:inline" style={{ fontSize: 13, letterSpacing: '2.5px', color: CREAM, textTransform: 'uppercase' }}>
          Culinary Studio
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className="text-[13px] font-medium transition-colors"
              style={{ color: active ? GOLD : CREAM_MUTED }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = CREAM; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = CREAM_MUTED; }}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
        {authState === 'loggedIn' ? (
          <MarketingPrimaryButton href="/dashboard" size="sm">Studio öffnen</MarketingPrimaryButton>
        ) : (
          <>
            <Link href="/login" className="hidden sm:inline text-[13px] font-medium transition-colors"
              style={{ color: CREAM_MUTED }}
              onMouseEnter={e => (e.currentTarget.style.color = CREAM)}
              onMouseLeave={e => (e.currentTarget.style.color = CREAM_MUTED)}>
              Anmelden
            </Link>
            <MarketingPrimaryButton href="/register" size="sm">Kostenlos starten</MarketingPrimaryButton>
          </>
        )}
      </div>
    </header>
  );
}
