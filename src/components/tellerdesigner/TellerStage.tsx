'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import type { TellerVariante } from '@/types';

const LOADING_MESSAGES = [
  'Analysiere Rezept…',
  'Bestimme Fokus…',
  'Plane Komposition…',
  'Male den Teller…',
];

const TOUR_START_DELAY_MS = 2000; // wartet, bis Bild-Entrance + Kamera-Zoom sich beruhigt haben
const TOUR_STEP_GAP_MS = 650; // Abstand zwischen dem Einblenden zweier Labels

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Stage-Koordinatenraum 0-150 (breit) x 0-100 (hoch) -- das quadratische Bild
// sitzt zentriert darin (x 42-108, y 17-83, Zentrum 75/50, Halbgroesse 33).
//
// Bild bewusst kleiner als frueher (Halbgroesse 40 -> 33): bei voller Groesse
// sassen die oberen/unteren Labels nur 4 Einheiten von der Bildkante entfernt
// (y 6 vs. Bildkante y 10) -- sichtbar gedraengt, im Widerspruch zur Vision
// ("Der Teller bekommt Platz zum Atmen"). Jetzt betraegt der Abstand y 3 vs.
// Bildkante y 17 = 14 Einheiten, spuerbar mehr Weissraum zwischen Beschriftung
// und Gericht, bei weiterhin gut lesbarer Tellergroesse.
//
// Sechs feste Label-Positionen rings um den Teller (oben links/rechts, links,
// rechts, unten links/rechts) -- die echte Bildposition der Komponenten kennen
// wir nicht (kein Vision-Feedback ueber generierte Bilder), das ist bewusst
// synthetisch statt "richtig" platziert. "target" liegt knapp INNERHALB des
// Tellerrands, auf der dem Label zugewandten Seite (Radius ca. 23 von 33
// Halbgroesse, in dieselbe Richtung wie das Label) -- nicht am aeusseren
// Rand (Linie wuerde den Teller nicht erreichen) und nicht nahe am Zentrum
// (Linie wuerde quer ueber das Gericht laufen).
type Align = 'left' | 'right';
const IMG = { x1: 42, y1: 17, x2: 108, y2: 83, cx: 75, cy: 50 };
const SLOTS: { label: { x: number; y: number }; target: { x: number; y: number }; align: Align }[] = [
  { label: { x: 18, y: 3 }, target: { x: 58, y: 34 }, align: 'right' }, // oben links
  { label: { x: 132, y: 3 }, target: { x: 92, y: 34 }, align: 'left' }, // oben rechts
  { label: { x: 8, y: 50 }, target: { x: 52, y: 50 }, align: 'right' }, // links
  { label: { x: 142, y: 50 }, target: { x: 98, y: 50 }, align: 'left' }, // rechts
  { label: { x: 18, y: 97 }, target: { x: 58, y: 66 }, align: 'right' }, // unten links
  { label: { x: 132, y: 97 }, target: { x: 92, y: 66 }, align: 'left' }, // unten rechts
];

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
  const { techniken } = variant;
  const n = techniken.length;
  const initialRevealed = variant.toured || n === 0 ? n : 0;
  const [revealedCount, setRevealedCount] = useState(initialRevealed);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? pinnedIndex;

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

      <div className="relative mx-auto" style={{ width: '100%', maxWidth: 920, aspectRatio: '150 / 100' }}>
        {/* Bild -- bewusst OHNE Rahmen/Karte, weiche radiale Maske loest die
            Bildkante auf (der generierte Creme-Ton trifft nie exakt den
            Seitenhintergrund, ein harter Rand waere sonst sichtbar). */}
        <motion.img
          key={variant.id}
          src={variant.image}
          alt={variant.titel || 'Generierte Anrichtung'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute teller-image-mask"
          style={{
            top: `${IMG.y1}%`, left: `${IMG.x1 / 1.5}%`, width: `${(IMG.x2 - IMG.x1) / 1.5}%`, height: `${IMG.y2 - IMG.y1}%`,
            objectFit: 'contain',
          }} />

        {/* Duenne, durchgehende Verbindungslinien (motion.path statt line --
            zuverlaessigere pathLength-Unterstuetzung), gedaempftes Grau. */}
        <svg viewBox="0 0 150 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          {SLOTS.slice(0, n).map((slot, i) => {
            if (i >= revealedCount) return null;
            const isActive = activeIndex === i;
            return (
              <motion.path key={i}
                d={`M ${slot.label.x} ${slot.label.y} L ${slot.target.x} ${slot.target.y}`}
                stroke={isActive ? '#6B3A4B' : 'rgba(154,128,112,0.55)'}
                strokeWidth={0.25}
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }} />
            );
          })}
        </svg>

        {/* Labels */}
        {SLOTS.slice(0, n).map((slot, i) => {
          if (i >= revealedCount) return null;
          const t = techniken[i];
          const isActive = activeIndex === i;
          return (
            <motion.div key={i}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={e => { e.stopPropagation(); setPinnedIndex(prev => prev === i ? null : i); }}
              className="absolute cursor-pointer"
              style={{
                left: `${(slot.label.x / 150) * 100}%`, top: `${slot.label.y}%`,
                width: 150,
                transform: `translate(${slot.align === 'right' ? '-100%' : '0%'}, -50%)`,
                textAlign: slot.align,
              }}>
              <div className="font-heading font-bold text-[12.5px] uppercase transition-colors"
                style={{ color: isActive ? '#6B3A4B' : 'var(--text)', letterSpacing: '1.5px' }}>
                {t.schlagwort}
              </div>
              <div className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {t.kurzsatz}
              </div>
              {isActive && t.anleitung && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.25 }}
                  className="text-[10.5px] italic leading-snug mt-1.5 pt-1.5"
                  style={{ color: '#9B7A2A', borderTop: '1px solid rgba(201,168,76,0.3)' }}>
                  {t.anleitung}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
