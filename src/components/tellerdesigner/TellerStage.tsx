'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import type { TellerVariante } from '@/types';
import TellerZutatenDots from './TellerZutatenDots';

const LOADING_MESSAGES = [
  'Analysiere Rezept…',
  'Bestimme Fokus…',
  'Plane Komposition…',
  'Male den Teller…',
];

const TOUR_START_DELAY_MS = 2000; // wartet, bis Bild-Entrance + Kamera-Zoom sich beruhigt haben
const TOUR_STEP_GAP_MS = 650; // Abstand zwischen dem Einblenden zweier Zutaten-Punkte

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type TellerStageProps = {
  loading: boolean;
  variant: TellerVariante | null;
  onTourComplete: () => void;
};

export default function TellerStage({ loading, variant, onTourComplete }: TellerStageProps) {
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setLoadingMsgIdx(0);
    const interval = setInterval(() => setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 1500);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-5" style={{ minHeight: 560 }}>
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border animate-pulse" style={{ borderColor: 'rgba(201,168,76,0.35)' }} />
          <Palette size={24} style={{ color: '#C9A84C' }} strokeWidth={1.5} />
        </div>
        <p key={loadingMsgIdx} className="text-[13px] italic" style={{ color: 'var(--text-muted)' }}>
          {LOADING_MESSAGES[loadingMsgIdx]}
        </p>
      </div>
    );
  }

  if (!variant) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ minHeight: 560 }}>
        <Palette size={28} strokeWidth={1.3} style={{ color: 'rgba(107,58,75,0.35)' }} />
        <p className="font-heading text-lg" style={{ color: 'var(--text)' }}>Noch kein Design generiert</p>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)', maxWidth: 320 }}>
          Wähle links deine Optionen und klicke auf „Generieren".
        </p>
      </div>
    );
  }

  return <TellerStageContent variant={variant} onTourComplete={onTourComplete} />;
}

/** Separat, damit ein Variantenwechsel (Remount ueber key={variant.id} beim Aufrufer) sauber frischen State bekommt. */
function TellerStageContent({ variant, onTourComplete }: { variant: TellerVariante; onTourComplete: () => void }) {
  const { zutaten, techniken } = variant;
  // Tour ist jetzt von den Zutaten-Punkten getrieben (dem Star der Buehne),
  // nicht mehr von den Techniken -- die Techniken-Liste daneben blendet als
  // Block ein, kein einzeln gestaffeltes Erscheinen mehr noetig, sie ist
  // jetzt Beiwerk statt der eigentliche Kranz.
  const n = zutaten.length;
  const initialRevealed = variant.toured || n === 0 ? n : 0;
  const [revealedCount, setRevealedCount] = useState(initialRevealed);

  useEffect(() => {
    if (initialRevealed >= n) return;
    let cancelled = false;
    const run = async () => {
      for (let i = initialRevealed; i < n; i++) {
        await wait(i === initialRevealed ? TOUR_START_DELAY_MS : TOUR_STEP_GAP_MS);
        if (cancelled) return;
        setRevealedCount(i + 1);
      }
      if (!cancelled) onTourComplete();
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- laeuft genau einmal pro Variante (Remount via key)
  }, []);

  return (
    <div>
      {variant.titel && (
        <h2 className="font-heading font-bold text-[20px] mb-3 text-center" style={{ color: 'var(--text)' }}>
          {variant.titel}
        </h2>
      )}

      <div className="flex flex-col min-[900px]:flex-row gap-8 items-start">
        <TellerZutatenDots
          image={variant.image}
          alt={variant.titel || 'Generierte Anrichtung'}
          zutaten={zutaten}
          revealedCount={revealedCount}
          className="flex-1 min-w-0" />

        {/* Techniken als ruhige Liste daneben -- kein Kranz mehr, kein
         * Hover-Tausch kurzsatz/anleitung: anleitung ist der informative
         * Kern (aufrecht, gut lesbar), kurzsatz das nachgeordnete Beiwerk
         * (klein, kursiv, gedaempft) -- gleicher Stil wie im
         * Galerie-Detail-Overlay, nur in den Farben des hellen App-Themes. */}
        {techniken.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full min-[900px]:w-[280px] flex-shrink-0 space-y-5">
            {techniken.map((t, i) => (
              <div key={i}>
                {/* var(--accent), NICHT fix #6B3A4B: das Schlagwort ist jetzt
                 * dauerhaft sichtbar (kein Hover-Zustand mehr wie frueher,
                 * wo der feste Wert nur kurz beim Hovern auftauchte) --
                 * fix #6B3A4B haette auf dunklem App-Hintergrund zu wenig
                 * Kontrast (dasselbe Problem wie bei den Rezepten). --accent
                 * ist bereits theme-bewusst: Bordeaux im Light Mode (exakt
                 * der bisherige Wert), Gold im Dark Mode. */}
                <div className="font-heading font-bold text-[12.5px] uppercase" style={{ color: 'var(--accent)', letterSpacing: '1.5px' }}>
                  {t.schlagwort}
                </div>
                {t.anleitung && (
                  <div className="text-[13px] leading-[1.6] mt-1.5" style={{ color: 'var(--text)' }}>
                    {t.anleitung}
                  </div>
                )}
                {t.kurzsatz && (
                  <div className="text-[11px] italic leading-snug mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t.kurzsatz}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
