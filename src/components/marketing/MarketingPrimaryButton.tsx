'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MARKETING_BORDEAUX, MARKETING_BORDEAUX_LIGHT } from '@/config/marketingTheme';

// Geteilter Bordeaux-Gradient-Button fuer die Marketing-Seite -- taucht im
// Header, im Hero und auf /studio auf, mit wechselndem Label/Ziel je nach
// Auth-Status (siehe lib/marketingAuth.ts).
export default function MarketingPrimaryButton({ href, children, size = 'md' }: {
  href: string;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}) {
  return (
    <Link href={href}
      className="inline-flex items-center gap-2 rounded-xl font-semibold transition-all"
      style={{
        padding: size === 'sm' ? '10px 18px' : '14px 24px',
        fontSize: size === 'sm' ? 11.5 : 12.5,
        background: `linear-gradient(135deg, #562E3C 0%, ${MARKETING_BORDEAUX} 40%, ${MARKETING_BORDEAUX_LIGHT} 70%, ${MARKETING_BORDEAUX} 100%)`,
        color: '#FFFFFF',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        boxShadow: '0 4px 20px rgba(107,58,75,0.4), 0 1px 0 rgba(255,255,255,0.15) inset',
      }}>
      {children} <ArrowRight size={size === 'sm' ? 13 : 15} />
    </Link>
  );
}
