'use client';

type Zeile = { label: string; value: string | number | null | undefined };

export type DesignInfoBoxProps = {
  stil: string;
  schwierigkeit: string;
  zubereitungszeit?: number | null;
  saison?: string | null;
  /** 'dark' fuer die Verwendung auf dunklem Grund (GalerieDetailOverlay) --
   * ersetzt die hellen Theme-Tokens (bg-card/text-muted), die dort als
   * Fremdkoerper wirken, durch feste dunkle Werte. Default bleibt die
   * bisherige helle Karte fuer alle anderen Verwendungsstellen. */
  variant?: 'light' | 'dark';
};

/** Kleine Label/Wert-Box mit den Design-Eckdaten -- wiederverwendet in der Meine-Designs-Galerie-Detailansicht. */
export default function DesignInfoBox({ stil, schwierigkeit, zubereitungszeit, saison, variant = 'light' }: DesignInfoBoxProps) {
  const zeilen: Zeile[] = [
    { label: 'Stil', value: stil },
    { label: 'Schwierigkeit', value: schwierigkeit },
    { label: 'Zubereitungszeit', value: zubereitungszeit ? `${zubereitungszeit} Min.` : null },
    { label: 'Saison', value: saison },
  ];

  if (variant === 'dark') {
    return (
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.18)' }}>
        <div className="text-[10px] font-semibold uppercase tracking-[2.5px] mb-2.5" style={{ color: 'rgba(201,168,76,0.7)' }}>
          Design-Informationen
        </div>
        <div className="space-y-1.5">
          {zeilen.map(z => (
            <div key={z.label} className="flex items-center justify-between text-[12.5px]">
              <span style={{ color: '#C9A84C' }}>{z.label}</span>
              <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>{z.value || '–'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[2.5px] mb-2.5" style={{ color: 'var(--text-muted)' }}>
        Design-Informationen
      </div>
      <div className="space-y-1.5">
        {zeilen.map(z => (
          <div key={z.label} className="flex items-center justify-between text-[12.5px]">
            <span style={{ color: 'var(--text-muted)' }}>{z.label}</span>
            <span className="font-semibold text-text-primary">{z.value || '–'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
