'use client';
import { useRef, useState } from 'react';
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
  /** Etappe 3: Punkte per Maus/Touch verschiebbar. Nur bei gespeicherten
   * Designs (Galerie-Overlay) gesetzt -- TellerStage auf /tellerdesigner
   * laesst das weg, dort gibt es noch keine DB-id zum Aktualisieren. */
  draggable?: boolean;
  /** Wird genau einmal beim Loslassen nach einem echten Drag gerufen (nicht
   * bei jedem Pointermove) -- der Aufrufer aktualisiert optimistisch und
   * persistiert im Hintergrund. */
  onPositionChange?: (index: number, position: { x: number; y: number }) => void;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const DRAG_THRESHOLD_PX = 4; // Bildschirm-Pixel, bewusst screen-basiert (nicht boxrelativ) -- ein Klick soll sich unabhaengig von der gerenderten Boxgroesse gleich "fest" anfuehlen

// Label waechst immer vom Punkt WEG, nie ueber den Bildrand hinaus -- gleiche
// Lehre wie bei den frueheren Kranz-Labels (TellerStage-Historie): nahe am
// Rand die Richtung umkehren statt eine feste Richtung fuer alle Punkte zu
// erzwingen.
function labelTransform(x: number, y: number): string {
  const h = x < 0.15 ? '0%' : x > 0.85 ? '-100%' : '-50%';
  const v = y < 0.18 ? 'calc(100% + 10px)' : 'calc(-100% - 10px)';
  return `translate(${h}, ${v})`;
}

export default function TellerZutatenDots({ image, alt, zutaten, revealedCount, className, draggable, onPositionChange }: TellerZutatenDotsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverride, setDragOverride] = useState<Record<number, { x: number; y: number }>>({});
  const activeIndex = hoveredIndex ?? pinnedIndex;
  const visible = zutaten.slice(0, revealedCount ?? zutaten.length);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null); // clientX/clientY beim Pointerdown, fuer die Bewegungs-Schwelle
  const draggingIndexRef = useRef<number | null>(null); // Ref-Spiegel von draggingIndex -- Move/Up-Handler brauchen den Wert synchron, nicht erst nach dem naechsten Render
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false); // nach einem echten Drag soll der abschliessende Click nicht zusaetzlich das Pin toggeln

  function pointerToRelative(e: React.PointerEvent): { x: number; y: number } | null {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return { x: clamp01((e.clientX - rect.left) / rect.width), y: clamp01((e.clientY - rect.top) / rect.height) };
  }

  function handlePointerDown(e: React.PointerEvent, hitIndex: number) {
    e.stopPropagation();
    const rel = pointerToRelative(e);
    if (!rel) return;
    // Naechstgelegenen Punkt zum tatsaechlichen Klickpunkt waehlen, nicht
    // blind den, dessen Trefferflaeche das Event zuerst abgefangen hat --
    // die 28px-Trefferflaechen ueberlappen sich bei nah beieinander-
    // liegenden Zutaten, und welches Element den Klick "gewinnt" haengt
    // sonst nur von der DOM-/Stacking-Reihenfolge ab, nicht von der Naehe
    // zum Klickpunkt. Distanzvergleich macht das Greifen deterministisch.
    let target = hitIndex;
    let bestDist = Infinity;
    visible.forEach((z, i) => {
      const dx = z.position.x - rel.x, dy = z.position.y - rel.y;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; target = i; }
    });
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    draggingIndexRef.current = target;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
    setDraggingIndex(target);
    setHoveredIndex(null); // verhindert, dass ein zufaellig noch aktiver Hover-Index waehrend des Ziehens das Label eines ANDEREN Punkts zeigt
    setPinnedIndex(target);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const idx = draggingIndexRef.current;
    if (idx === null) return;
    const start = dragStartRef.current;
    if (start && !movedRef.current) {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_THRESHOLD_PX) return; // noch kein Drag, nur ein Wackler -- zaehlt nicht
      movedRef.current = true;
    }
    const rel = pointerToRelative(e);
    if (!rel) return;
    setDragOverride(prev => ({ ...prev, [idx]: rel }));
  }

  function handlePointerUp() {
    const idx = draggingIndexRef.current;
    draggingIndexRef.current = null;
    setDraggingIndex(null);
    if (idx === null) return;
    if (movedRef.current) {
      suppressClickRef.current = true;
      const pos = dragOverride[idx];
      if (pos) onPositionChange?.(idx, pos);
      // dragOverride[idx] bleibt bewusst bestehen (nicht hier geloescht):
      // der Aufrufer aktualisiert sein zutaten-Prop synchron im selben
      // Event-Handler (optimistisches Update) -- React batcht beide State-
      // Updates in denselben Render, das Prop hat also beim naechsten Paint
      // schon den neuen Wert. Erst NACH diesem Zweig (unten) loeschen wir
      // den Override, damit kein Frame mit "leerem" Override und altem
      // Prop-Wert dazwischenblitzt.
    }
    movedRef.current = false;
    dragStartRef.current = null;
    if (idx !== null) {
      setDragOverride(prev => { const next = { ...prev }; delete next[idx]; return next; });
    }
  }

  function handlePointerCancel() {
    const idx = draggingIndexRef.current;
    draggingIndexRef.current = null;
    setDraggingIndex(null);
    movedRef.current = false;
    dragStartRef.current = null;
    // Abgebrochene Geste (z.B. Browser uebernimmt die Pointer-Sequenz) --
    // NICHT speichern, Override verwerfen, Punkt springt optisch zurueck.
    if (idx !== null) {
      setDragOverride(prev => { const next = { ...prev }; delete next[idx]; return next; });
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`} style={{ aspectRatio: '1 / 1' }}
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
        const isDragging = draggingIndex === i;
        const pos = dragOverride[i] ?? z.position;
        return (
          <div key={i} className="absolute" style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}>
            {/* Groesserer, unsichtbarer Hit-Bereich (28px) um den kleinen
             * sichtbaren Punkt herum -- touch-freundlich, ohne den Punkt
             * selbst optisch aufzublasen. Bleibt bewusst so gross (nicht
             * kleiner als das Sichtbare): bei nah beieinanderliegenden
             * Zutaten loest die Distanzpruefung in handlePointerDown die
             * Ambiguitaet auf, ein kleinerer Hit-Bereich waere nur auf
             * Kosten der Touch-Bedienbarkeit gegangen, ohne das Problem
             * grundsaetzlich zu loesen (zwei SEHR nah beieinanderliegende
             * Punkte haetten sich auch mit kleinerer Flaeche noch
             * ueberlappt). */}
            <motion.button type="button"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: isDragging ? 1.05 : 1 }}
              transition={{ duration: isDragging ? 0.15 : 0.3, ease: 'easeOut' }}
              onMouseEnter={() => { if (draggingIndexRef.current === null) setHoveredIndex(i); }}
              onMouseLeave={() => { if (draggingIndexRef.current === null) setHoveredIndex(null); }}
              onPointerDown={draggable ? (e) => handlePointerDown(e, i) : undefined}
              onPointerMove={draggable ? handlePointerMove : undefined}
              onPointerUp={draggable ? handlePointerUp : undefined}
              onPointerCancel={draggable ? handlePointerCancel : undefined}
              onClick={e => {
                e.stopPropagation();
                if (suppressClickRef.current) { suppressClickRef.current = false; return; }
                setPinnedIndex(prev => prev === i ? null : i);
              }}
              className="absolute flex items-center justify-center"
              style={{
                left: 0, top: 0, x: '-50%', y: '-50%', width: 28, height: 28,
                cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
                touchAction: draggable ? 'none' : undefined,
                userSelect: draggable ? 'none' : undefined,
              }}
              aria-label={z.name}>
              {/* Kern bleibt in JEDEM Zustand hell (Creme) -- gegen den
               * hellen Creme-Hintergrund des generierten Bilds traegt nicht
               * die Fuellfarbe den Kontrast, sondern der Ring + Schatten
               * (nachgerechnet: Bordeaux-Ring auf Creme ~7.9:1, waehrend ein
               * goldgefuellter Kern auf Creme nur ~2:1 haette -- deshalb
               * bewusst NICHT auf Gold-Fuellung im aktiven Zustand
               * gewechselt, nur Ring/Schatten/Groesse veraendern sich).
               * isDragging vergroessert den Ring nochmal ueber den
               * normalen aktiven Zustand hinaus -- die einzige zusaetzliche
               * Rueckmeldung dafuer, dass das Ziehen "greift", bewusst
               * dezent (kein Bounce, keine Farbaenderung). */}
              <span className="block rounded-full transition-all duration-200" style={{
                width: isDragging ? 17 : isActive ? 15 : 11, height: isDragging ? 17 : isActive ? 15 : 11,
                background: '#F5F0E8',
                border: `2px solid ${isActive ? '#C9A84C' : '#6B3A4B'}`,
                boxShadow: isDragging
                  ? '0 0 0 6px rgba(201,168,76,0.4), 0 3px 14px rgba(0,0,0,0.45)'
                  : isActive
                    ? '0 0 0 5px rgba(201,168,76,0.35), 0 2px 10px rgba(0,0,0,0.4)'
                    : '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </motion.button>

            {/* Nur das aktive Label zeigen -- bei nah beieinanderliegenden
             * Zutaten wuerden sich sonst mehrere Labels ueberlappen. */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                className="absolute whitespace-nowrap pointer-events-none rounded-full px-2.5 py-1 font-heading font-bold uppercase"
                style={{
                  left: 0, top: 0, transform: labelTransform(pos.x, pos.y),
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
