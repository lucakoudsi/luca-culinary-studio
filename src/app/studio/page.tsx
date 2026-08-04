import { BookOpen, UtensilsCrossed, Lightbulb, FolderOpen } from 'lucide-react';
import MarketingPageShell from '@/components/marketing/MarketingPageShell';
import MarketingPrimaryButton from '@/components/marketing/MarketingPrimaryButton';
import { getMarketingAuthState } from '@/lib/marketingAuth';
import { MARKETING_CREAM, MARKETING_CREAM_MUTED, MARKETING_GOLD } from '@/config/marketingTheme';

// Die 4 Punkte kommen direkt aus dem Text ("entwickelst du Rezepte, planst
// Menüs, sammelst Ideen und behaeltst deine Projekte im Blick").
const CAPABILITIES = [
  { icon: BookOpen, label: 'Rezepte entwickeln' },
  { icon: UtensilsCrossed, label: 'Menüs planen' },
  { icon: Lightbulb, label: 'Ideen sammeln' },
  { icon: FolderOpen, label: 'Projekte im Blick behalten' },
];

export default async function StudioPage() {
  const authState = await getMarketingAuthState();
  return (
    <MarketingPageShell eyebrow="Creator Studio" title="Deine digitale Küche" heroAccent authState={authState}>
      <p style={{ fontSize: 16, color: MARKETING_CREAM_MUTED, lineHeight: 1.75, maxWidth: 640 }}>
        Das Studio ist dein persönlicher Arbeitsplatz. Hier entwickelst du Rezepte, planst Menüs, sammelst Ideen und behältst deine Projekte im Blick. Jede Kreation wird gespeichert, jede Idee bleibt griffbereit. Melde dich an und öffne dein Studio — kostenlos, jederzeit erweiterbar.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 mb-10" style={{ maxWidth: 640 }}>
        {CAPABILITIES.map(c => (
          <div key={c.label} className="flex flex-col items-start gap-2">
            <c.icon size={18} style={{ color: MARKETING_GOLD }} />
            <span style={{ fontSize: 12.5, color: MARKETING_CREAM, lineHeight: 1.4 }}>{c.label}</span>
          </div>
        ))}
      </div>

      {authState === 'loggedIn' && (
        <MarketingPrimaryButton href="/dashboard">Studio öffnen</MarketingPrimaryButton>
      )}
      {authState === 'loggedOut' && (
        <MarketingPrimaryButton href="/register">Kostenlos starten</MarketingPrimaryButton>
      )}
    </MarketingPageShell>
  );
}
