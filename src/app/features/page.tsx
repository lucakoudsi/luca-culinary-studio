import { Bot, UtensilsCrossed, Utensils, ImagePlus, BookOpen, Leaf, GitFork, Sun, Wine } from 'lucide-react';
import MarketingPageShell from '@/components/marketing/MarketingPageShell';
import { getMarketingAuthState } from '@/lib/marketingAuth';
import {
  MARKETING_CREAM, MARKETING_CREAM_MUTED, MARKETING_GOLD, MARKETING_SURFACE, MARKETING_BORDER,
} from '@/config/marketingTheme';

// Inhalt 1:1 aus dem urspruenglichen Fliesstext abgeleitet, nur strukturiert
// statt als Absatz: die vier Haupt-Werkzeuge als Karten, der Rest ("Dazu
// Rezeptarchiv, ... -- alles an einem Ort") als kompakte Liste darunter.
const MAIN_TOOLS = [
  { icon: Bot, title: 'KI-Sous-Chef', text: 'Beantwortet Fragen zu Techniken, Pairings und Fermentation in Echtzeit.' },
  { icon: UtensilsCrossed, title: 'Menügenerator', text: 'Komponiert vollständige Menüfolgen in Minuten.' },
  { icon: Utensils, title: 'Tellerdesigner', text: 'Visualisiert deine Anrichte-Ideen.' },
  { icon: ImagePlus, title: 'Rezept-Import', text: 'Aus einem Foto wird ein strukturiertes Rezept.' },
];

const MORE_TOOLS = [
  { icon: BookOpen, label: 'Rezeptarchiv' },
  { icon: Leaf, label: 'Zutatenbibliothek' },
  { icon: GitFork, label: 'Stammbaum der Zubereitungsarten' },
  { icon: Sun, label: 'Saisonkalender' },
  { icon: Wine, label: 'Wein & Pairing' },
];

export default async function FeaturesPage() {
  const authState = await getMarketingAuthState();
  return (
    <MarketingPageShell eyebrow="Features" title="Alles, was deine Küche braucht" authState={authState}>
      <p style={{ fontSize: 16, color: MARKETING_CREAM_MUTED, lineHeight: 1.75, maxWidth: 640, marginBottom: 40 }}>
        Culinary Studio bündelt professionelle Werkzeuge in einer Oberfläche.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {MAIN_TOOLS.map(f => (
          <div key={f.title} className="rounded-2xl p-6" style={{ background: MARKETING_SURFACE, border: `1px solid ${MARKETING_BORDER}` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(232,198,122,0.12)' }}>
              <f.icon size={20} style={{ color: MARKETING_GOLD }} />
            </div>
            <h3 className="font-heading font-bold" style={{ fontSize: 17, color: MARKETING_CREAM }}>{f.title}</h3>
            <p className="mt-1.5" style={{ fontSize: 13.5, color: MARKETING_CREAM_MUTED, lineHeight: 1.6 }}>{f.text}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: MARKETING_CREAM_MUTED, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
        Dazu, alles an einem Ort
      </p>
      <div className="flex flex-wrap gap-x-8 gap-y-4 pb-2">
        {MORE_TOOLS.map(f => (
          <div key={f.label} className="flex items-center gap-2">
            <f.icon size={15} style={{ color: MARKETING_CREAM_MUTED }} />
            <span style={{ fontSize: 13, color: MARKETING_CREAM_MUTED }}>{f.label}</span>
          </div>
        ))}
      </div>
    </MarketingPageShell>
  );
}
