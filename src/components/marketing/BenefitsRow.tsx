import { Bot, UtensilsCrossed, Wine, Beaker, Camera } from 'lucide-react';
import { MARKETING_BORDER, MARKETING_CREAM, MARKETING_CREAM_MUTED, MARKETING_GOLD } from '@/config/marketingTheme';

// Nachfolger der bisherigen FeatureBar aus page.tsx -- gleicher Inhalt,
// aber als normale Seiten-Sektion statt als an den unteren Bildschirmrand
// gepinnte Leiste (die alte Ein-Bildschirm-Zwangslage von '/' faellt mit
// dem neuen, normal scrollenden Layout weg).
const BENEFITS = [
  { icon: Bot, title: 'KI-Sous-Chef', text: 'Dein digitaler Küchenpartner' },
  { icon: UtensilsCrossed, title: 'Menü-Entwicklung', text: 'Kreative Menüs in Minuten' },
  { icon: Wine, title: 'Wein Pairing', text: 'Perfekte Begleitung für jedes Gericht' },
  { icon: Beaker, title: 'Fermentation-Expertise', text: 'Tradition trifft Innovation' },
  { icon: Camera, title: 'Food Photography', text: 'Professionelle Bilder für deine Gerichte' },
];

export default function BenefitsRow() {
  return (
    <section className="px-5 sm:px-8 py-10 sm:py-12" style={{ borderTop: `1px solid ${MARKETING_BORDER}`, borderBottom: `1px solid ${MARKETING_BORDER}` }}>
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-8">
        {BENEFITS.map(f => (
          <div key={f.title} className="flex items-start gap-3">
            <f.icon size={17} style={{ color: MARKETING_GOLD, flexShrink: 0, marginTop: 2 }} />
            <div className="min-w-0">
              <div className="font-heading font-semibold" style={{ fontSize: 12.5, color: MARKETING_CREAM }}>{f.title}</div>
              <div style={{ fontSize: 11, color: MARKETING_CREAM_MUTED, marginTop: 2, lineHeight: 1.4 }}>{f.text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
