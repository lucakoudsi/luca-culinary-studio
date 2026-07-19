'use client';

type Zeile = { label: string; value: string | number | null | undefined };

export type DesignInfoBoxProps = {
  stil: string;
  schwierigkeit: string;
  zubereitungszeit?: number | null;
  saison?: string | null;
};

/** Kleine Label/Wert-Box mit den Design-Eckdaten -- wiederverwendet in der Meine-Designs-Galerie-Detailansicht. */
export default function DesignInfoBox({ stil, schwierigkeit, zubereitungszeit, saison }: DesignInfoBoxProps) {
  const zeilen: Zeile[] = [
    { label: 'Stil', value: stil },
    { label: 'Schwierigkeit', value: schwierigkeit },
    { label: 'Zubereitungszeit', value: zubereitungszeit ? `${zubereitungszeit} Min.` : null },
    { label: 'Saison', value: saison },
  ];

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
