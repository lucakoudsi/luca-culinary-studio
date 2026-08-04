'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TellerZutat } from '@/types';

// Gemeinsamer Baustein fuer Zutaten-Hotspots auf dem Tellerbild -- genutzt
// von TellerStage (helles App-Theme, volle Buehne, gestaffelte Tour) UND
// GalerieDetailOverlay (festes dunkles Theme, kein Tour). Nur diese Logik
// (Positions-Mapping, Punkt-Hover, randbewusstes Label) existiert einmal,
// die umgebende Chrome bleibt bei den Aufrufern.
//
// Das Bild-Element ist immer exakt quadratisch (generierte Bildgroesse ist
// 1024x1024, hart codiert in api/tellerdesigner/route.ts) UND wird selbst
// als quadratische Box dargestellt (aspect-ratio: 1/1) -- object-contain
// letterboxt deshalb nie, x*100%/y*100% trifft immer den tatsaechlich
// gerenderten Bildbereich, nicht nur den Container. Aendert sich die
// generierte Bildgroesse je auf ein anderes Seitenverhaeltnis, braucht es
// hier eine echte Laufzeit-Messung (naturalWidth/naturalHeight) statt der
// statischen Annahme.
//
// Punktfarben sind FEST (kein var(--...)), nicht theme-abhaengig -- sie
// sitzen auf einem Foto, nicht auf App-Chrome, und das Foto aendert sich
// nicht mit dem Dark-Mode-Toggle. Heller Kern + Bordeaux-Ring im Ruhezustand
// (liest sich auf dem hellen Creme-Hintergrund UND auf variablen
// Speisenfarben), Gold-Fuellung + Glow im aktiven Zustand.
export type TellerZutatenDotsProps = {
  image: string;
  alt: string;
  zutaten: TellerZutat[];
  /** Fuer die gestaffelte Tour-Animation -- nur die ersten N Punkte werden
   * gerendert. Weggelassen = alle sofort (z.B. im Galerie-Overlay, kein Tour). */
  revealedCount?: number;
  className?: string;
};

// Label waechst immer vom Punkt WEG, nie ueber den Bildrand hinaus -- gleiche
// Lehre wie bei den frueheren Kranz-Labels (TellerStage-Historie): nahe am
// Rand die Richtung umkehren statt eine feste Richtung fuer alle Punkte zu
// erzwingen.
function labelTransform(x: number, y: number): string {
  const h = x < 0.15 ? '0%' : x > 0.85 ? '-100%' : '-50%';
  const v = y < 0.18 ? 'calc(100% + 10px)' : 'calc(-100% - 10px)';
  return `translate(${h}, ${v})`;
}

export default function TellerZutatenDots({ image, alt, zutaten, revealedCount, className }: TellerZutatenDotsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? pinnedIndex;
  const visible = zutaten.slice(0, revealedCount ?? zutaten.length);

  return (
    <div className={`relative ${className ?? ''}`} style={{ aspectRatio: '1 / 1' }}
      onClick={() => setPinnedIndex(null)}>
      <motion.img
        src={image}
        alt={alt}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full teller-image-mask"
        style={{ objectFit: 'contain' }} />

      {visible.map((z, i) => {
        const isActive = activeIndex === i;
        return (
          <div key={i} className="absolute" style={{ left: `${z.position.x * 100}%`, top: `${z.position.y * 100}%` }}>
            {/* Groesserer, unsichtbarer Hit-Bereich (28px) um den kleinen
             * sichtbaren Punkt herum -- touch-freundlich, ohne den Punkt
             * selbst optisch aufzublasen. */}
            <motion.button type="button"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={e => { e.stopPropagation(); setPinnedIndex(prev => prev === i ? null : i); }}
              className="absolute flex items-center justify-center cursor-pointer"
              style={{ left: 0, top: 0, x: '-50%', y: '-50%', width: 28, height: 28 }}
              aria-label={z.name}>
              {/* Kern bleibt in BEIDEM Zustand hell (Creme) -- gegen den
               * hellen Creme-Hintergrund des generierten Bilds traegt nicht
               * die Fuellfarbe den Kontrast, sondern der Ring + Schatten
               * (nachgerechnet: Bordeaux-Ring auf Creme ~7.9:1, waehrend ein
               * goldgefuellter Kern auf Creme nur ~2:1 haette -- deshalb
               * bewusst NICHT auf Gold-Fuellung im aktiven Zustand
               * gewechselt, nur Ring/Schatten/Groesse veraendern sich). */}
              <span className="block rounded-full transition-all duration-200" style={{
                width: isActive ? 15 : 11, height: isActive ? 15 : 11,
                background: '#F5F0E8',
                border: `2px solid ${isActive ? '#C9A84C' : '#6B3A4B'}`,
                boxShadow: isActive ? '0 0 0 5px rgba(201,168,76,0.35), 0 2px 10px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </motion.button>

            {/* Nur das aktive Label zeigen -- bei nah beieinanderliegenden
             * Zutaten wuerden sich sonst mehrere Labels ueberlappen. */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                className="absolute whitespace-nowrap pointer-events-none rounded-full px-2.5 py-1 font-heading font-bold uppercase"
                style={{
                  left: 0, top: 0, transform: labelTransform(z.position.x, z.position.y),
                  fontSize: 10.5, letterSpacing: '1px',
                  color: '#F5F0E8', background: 'rgba(20,15,12,0.88)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                }}>
                {z.name}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
