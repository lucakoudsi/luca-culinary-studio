'use client';
import { useEffect, useState } from 'react';

type Phase = 'enter' | 'visible' | 'settled';

// Containing-Block-Falle (siehe Warnhinweis an .print-only in globals.css,
// Commits 8ae6a29/252e660/f283a0e): JEDER transform-Wert ungleich "none" --
// auch die reine Identitaet translateY(0) -- erzeugt einen neuen Containing
// Block fuer position:fixed/absolute-Nachfahren. PageTransition liegt auf
// fast jeder Seite und setzte transform bisher DAUERHAFT, auch im
// Ruhezustand -- das brach jedes fixed/absolute-Element, das irgendwo
// darunter gerendert wurde (u.a. das Rezept-Schnellblick-Overlay, siehe
// dessen eigenen Fix-Kommentar).
//
// Deshalb der dritte Zustand "settled": sobald die Eintritts-Transition
// messbar fertig ist, verschwindet transform komplett aus dem Inline-Style
// (nicht auf 'none' gesetzt -- die Property wird weggelassen). translateY(0)
// und "kein transform" rendern identische Pixel, es gibt also keinen
// sichtbaren Sprung beim Umschalten.
//
// WAEHREND der ~250ms-Animation besteht die Falle weiterhin (ein transform
// muss fuer die Bewegung da sein) -- bewusst in Kauf genommen, in der Zeit
// sieht man ohnehin kaum etwas von der Seite, und "loesen" wuerde die
// Animation selbst kosten.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('enter');

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase('visible'));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (phase !== 'visible') return;
    // Sicherheitsnetz zusaetzlich zu onTransitionEnd -- falls das Event aus
    // irgendeinem Grund nicht feuert (z.B. Tab im Hintergrund gedrosselt),
    // bliebe transform sonst dauerhaft stehen. 400ms > die 250ms-Dauer, mit Puffer.
    const t = setTimeout(() => setPhase('settled'), 400);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div
      style={{
        opacity: phase === 'enter' ? 0 : 1,
        transform: phase === 'settled' ? undefined : phase === 'visible' ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
      }}
      onTransitionEnd={e => {
        // target-Check: transitionend bubbelt, und auf denselben Seiten
        // laufen jede Menge framer-motion-Elemente mit eigenen transform-
        // Transitions -- ohne den Check wuerde eine fremde Kind-Transition
        // (z.B. TellerZutatenDots) den Zustand vorzeitig umschalten.
        if (e.target !== e.currentTarget) return;
        if (e.propertyName === 'transform' && phase === 'visible') setPhase('settled');
      }}>
      {children}
    </div>
  );
}
