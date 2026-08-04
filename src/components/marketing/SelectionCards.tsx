import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { MarketingAuthState } from '@/lib/marketingAuth';
import {
  MARKETING_SURFACE, MARKETING_BORDER, MARKETING_CREAM, MARKETING_CREAM_MUTED, MARKETING_GOLD,
} from '@/config/marketingTheme';

// Zwei grosse Auswahlkarten auf der Landingpage -- Creator Studio (das
// bestehende Produkt, klickbar) und Chef Academy (existiert noch nicht,
// sichtbar mit "In Kürze"-Badge, bewusst NICHT klickbar -- kein totes
// Anfassbares, kein Anspruch auf Wartelisten-/E-Mail-Erfassung).
export default function SelectionCards({ authState }: { authState: MarketingAuthState }) {
  const studioHref = authState === 'loggedIn' ? '/dashboard' : '/register';
  const studioLabel = authState === 'loggedIn' ? 'Studio öffnen' : 'Kostenlos starten';

  return (
    <section className="px-5 sm:px-8 py-14 sm:py-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        {/* Creator Studio -- die ganze Karte ist EIN Link, kein zweites
         * verschachteltes klickbares Element darin (Accessibility). */}
        <Link href={studioHref}
          className="group rounded-3xl overflow-hidden transition-all"
          style={{ background: MARKETING_SURFACE, border: `1px solid ${MARKETING_BORDER}` }}>
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image src="/studio-card.jpg" alt="" fill sizes="(min-width: 640px) 50vw, 100vw"
              className="transition-transform duration-500 group-hover:scale-105"
              style={{ objectFit: 'cover' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(10,10,10,0.8) 100%)' }} />
          </div>
          <div className="p-7 sm:p-9">
            <span style={{ color: MARKETING_GOLD, fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600 }}>
              Für Köche &amp; Kreative
            </span>
            <h2 className="font-heading font-bold mt-2 mb-3" style={{ fontSize: 26, color: MARKETING_CREAM }}>
              Creator Studio
            </h2>
            <p style={{ fontSize: 14, color: MARKETING_CREAM_MUTED, lineHeight: 1.65 }}>
              Entwickle Rezepte, komponiere Menüs und visualisiere Anrichte-Ideen -- dein digitaler Arbeitsplatz für die eigene Küche.
            </p>
            <div className="inline-flex items-center gap-2 mt-6 font-semibold transition-colors"
              style={{ fontSize: 12, color: MARKETING_GOLD, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {studioLabel} <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        {/* Chef Academy -- kein <Link>, bewusst ein reines div (nicht klickbar).
         * aria-disabled statt komplett aus dem Accessibility-Baum zu nehmen,
         * damit Screenreader "in Kürze" statt gar nichts mitbekommen. */}
        <div aria-disabled="true" className="rounded-3xl overflow-hidden cursor-default"
          style={{ background: MARKETING_SURFACE, border: `1px solid ${MARKETING_BORDER}`, opacity: 0.72 }}>
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image src="/academy-card.jpg" alt="" fill sizes="(min-width: 640px) 50vw, 100vw"
              style={{ objectFit: 'cover', filter: 'grayscale(0.4)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(10,10,10,0.8) 100%)' }} />
            <span className="absolute top-4 right-4 px-3 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(10,10,10,0.75)', border: `1px solid ${MARKETING_GOLD}`, color: MARKETING_GOLD, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              In Kürze
            </span>
          </div>
          <div className="p-7 sm:p-9">
            <span style={{ color: MARKETING_CREAM_MUTED, fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600 }}>
              Für angehende Köche
            </span>
            <h2 className="font-heading font-bold mt-2 mb-3" style={{ fontSize: 26, color: MARKETING_CREAM }}>
              Chef Academy
            </h2>
            <p style={{ fontSize: 14, color: MARKETING_CREAM_MUTED, lineHeight: 1.65 }}>
              Lerne die Techniken und Grundlagen der professionellen Küche -- strukturiert, praxisnah, Schritt für Schritt.
            </p>
            <div className="mt-6 font-semibold" style={{ fontSize: 12, color: MARKETING_CREAM_MUTED, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Bald verfügbar
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
