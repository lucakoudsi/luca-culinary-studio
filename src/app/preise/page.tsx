import { CheckCircle2, Leaf, Bot, Utensils, Users } from 'lucide-react';
import MarketingPageShell from '@/components/marketing/MarketingPageShell';
import { getMarketingAuthState } from '@/lib/marketingAuth';
import { STUFEN } from '@/config/roles';
import { FEATURE_GATES } from '@/config/featureGates';
import { TEXT_QUOTA_BY_TIER } from '@/config/textQuota';
import { IMAGE_QUOTA_BY_TIER } from '@/config/imageQuota';
import {
  MARKETING_CREAM, MARKETING_CREAM_MUTED, MARKETING_GOLD, MARKETING_SURFACE, MARKETING_BORDER,
} from '@/config/marketingTheme';

// Echte Stufen-/Feature-Definitionen aus src/config/* -- dieselbe Quelle wie
// der "Mein Plan"-Tab (PlanTab.tsx), bewusst OHNE STUFE_PREIS_BRUTTO/
// formatPreis: keine erfundenen oder verfruehten Preiszahlen oeffentlich
// zeigen, solange der Verkauf noch nicht laeuft.
const TIER_SHORT: Record<number, string> = { 1: 'Free', 2: 'Basic', 3: 'Pro', 4: 'Team' };
// Icon je Stufe orientiert sich am jeweils neu freigeschalteten Kern-Feature
// (Basic: KI-Sous-Chef, Pro: Tellerdesigner, Team: groesseres Kontingent).
const TIER_ICON: Record<number, typeof Leaf> = { 1: Leaf, 2: Bot, 3: Utensils, 4: Users };
const PUBLIC_GATES = FEATURE_GATES.filter(g => g.minTier < 99);

export default async function PreisePage() {
  const authState = await getMarketingAuthState();
  return (
    <MarketingPageShell eyebrow="Preise" title="Stufen, die mitwachsen" authState={authState}>
      <p style={{ fontSize: 16, color: MARKETING_CREAM_MUTED, lineHeight: 1.75, maxWidth: 640, marginBottom: 40 }}>
        Starte kostenlos und schalte mehr frei, wenn du mehr brauchst. Jede Stufe erweitert deine kreativen Möglichkeiten und dein KI-Guthaben.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STUFEN.map((s, i) => {
          const prev = STUFEN[i - 1];
          const textLimit = TEXT_QUOTA_BY_TIER[s.stufe] ?? 0;
          const imageLimit = IMAGE_QUOTA_BY_TIER[s.stufe] ?? 0;
          const prevTextLimit = prev ? TEXT_QUOTA_BY_TIER[prev.stufe] ?? 0 : 0;
          const prevImageLimit = prev ? IMAGE_QUOTA_BY_TIER[prev.stufe] ?? 0 : 0;
          const ownGates = PUBLIC_GATES.filter(g => g.minTier === s.stufe);
          const baseGates = PUBLIC_GATES.filter(g => g.minTier === 1);

          const TierIcon = TIER_ICON[s.stufe];
          return (
            <div key={s.stufe} className="rounded-2xl p-5 flex flex-col" style={{ background: MARKETING_SURFACE, border: `1px solid ${MARKETING_BORDER}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(232,198,122,0.12)' }}>
                <TierIcon size={18} style={{ color: MARKETING_GOLD }} />
              </div>
              <div className="font-heading font-bold" style={{ fontSize: 18, color: MARKETING_CREAM }}>{TIER_SHORT[s.stufe]}</div>

              <div style={{ flex: 1, marginTop: 14 }}>
                {i === 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {baseGates.map(g => (
                      <li key={g.label} className="flex items-start gap-1.5" style={{ fontSize: 12, color: MARKETING_CREAM_MUTED, marginBottom: 6 }}>
                        <CheckCircle2 size={13} style={{ color: MARKETING_GOLD, flexShrink: 0, marginTop: 1 }} />
                        {g.label}
                      </li>
                    ))}
                    <li style={{ fontSize: 11.5, color: MARKETING_CREAM_MUTED, marginTop: 8, opacity: 0.7 }}>Keine KI-Funktionen</li>
                  </ul>
                ) : (
                  <>
                    <p style={{ fontSize: 11, color: MARKETING_CREAM_MUTED, opacity: 0.8, marginBottom: 8 }}>
                      Alles aus {TIER_SHORT[prev.stufe]}, außerdem:
                    </p>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {ownGates.map(g => (
                        <li key={g.label} className="flex items-start gap-1.5" style={{ fontSize: 12, color: MARKETING_CREAM_MUTED, marginBottom: 6 }}>
                          <CheckCircle2 size={13} style={{ color: MARKETING_GOLD, flexShrink: 0, marginTop: 1 }} />
                          {g.label}
                        </li>
                      ))}
                      {textLimit > prevTextLimit && (
                        <li className="flex items-start gap-1.5" style={{ fontSize: 12, color: MARKETING_CREAM_MUTED, marginBottom: 6 }}>
                          <CheckCircle2 size={13} style={{ color: MARKETING_GOLD, flexShrink: 0, marginTop: 1 }} />
                          {textLimit} Punkte KI-Guthaben/Monat
                        </li>
                      )}
                      {imageLimit > prevImageLimit && (
                        <li className="flex items-start gap-1.5" style={{ fontSize: 12, color: MARKETING_CREAM_MUTED, marginBottom: 6 }}>
                          <CheckCircle2 size={13} style={{ color: MARKETING_GOLD, flexShrink: 0, marginTop: 1 }} />
                          {imageLimit} Tellerbilder/Monat
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>

              <div className="mt-4 text-center py-2 rounded-lg" style={{ fontSize: 11, color: MARKETING_CREAM_MUTED, border: `1px solid ${MARKETING_BORDER}` }}>
                {i === 0 ? 'Kostenlos verfügbar' : 'Verkauf startet in Kürze'}
              </div>
            </div>
          );
        })}
      </div>
    </MarketingPageShell>
  );
}
