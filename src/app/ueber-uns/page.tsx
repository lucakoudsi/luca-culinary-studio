import { Hammer, Sparkles, Focus } from 'lucide-react';
import MarketingPageShell from '@/components/marketing/MarketingPageShell';
import { getMarketingAuthState } from '@/lib/marketingAuth';
import { MARKETING_CREAM, MARKETING_CREAM_MUTED, MARKETING_GOLD, MARKETING_BORDER } from '@/config/marketingTheme';

// Die drei Werte kommen woertlich aus dem Text ("Wert auf Handwerk,
// Kreativitaet und das besondere Detail legen").
const VALUES = [
  { icon: Hammer, label: 'Handwerk' },
  { icon: Sparkles, label: 'Kreativität' },
  { icon: Focus, label: 'Das besondere Detail' },
];

export default async function UeberUnsPage() {
  const authState = await getMarketingAuthState();
  return (
    <MarketingPageShell eyebrow="Über uns" title="Aus Leidenschaft für die Küche" authState={authState}>
      <p style={{ fontSize: 16, color: MARKETING_CREAM_MUTED, lineHeight: 1.75, maxWidth: 640 }}>
        Culinary Studio entstand aus der Idee, professionelle Kochkunst und moderne KI zu verbinden. Kein Werkzeug für Massenrezepte, sondern ein Studio für Menschen, die Wert auf Handwerk, Kreativität und das besondere Detail legen. Gebaut für Köchinnen und Köche, Kreative und alle, die das Außergewöhnliche suchen.
      </p>

      <div className="flex flex-wrap gap-4 mt-10" style={{ maxWidth: 640 }}>
        {VALUES.map(v => (
          <div key={v.label} className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
            style={{ border: `1px solid ${MARKETING_BORDER}` }}>
            <v.icon size={16} style={{ color: MARKETING_GOLD }} />
            <span className="font-heading font-semibold" style={{ fontSize: 13, color: MARKETING_CREAM }}>{v.label}</span>
          </div>
        ))}
      </div>
    </MarketingPageShell>
  );
}
