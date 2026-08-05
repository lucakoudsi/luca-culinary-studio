'use client';
import { useEffect, useRef } from 'react';

// Analog zu usePrintOnDemand.ts: eigener, seiteneffektiger Hook fuer eine
// Browser-API, statt der aufrufenden Seite Feature-Detection und Lifecycle
// selbst zumuten zu muessen.
//
// Der Browser gibt den Wake Lock automatisch frei, sobald der Tab in den
// Hintergrund wechselt (visibilitychange -> 'hidden') -- das ist
// Standardverhalten, kein Bug hier. Kommt der Tab zurueck in den
// Vordergrund, muss der Lock DESHALB explizit neu angefordert werden, sonst
// bleibt der Bildschirm nach einem kurzen App-Wechsel (z.B. eingehender
// Anruf) dauerhaft ungeschuetzt dunkel.
export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!('wakeLock' in navigator)) return; // stilles Degradieren -- kein Fehler, keine UI-Meldung

    let cancelled = false;

    const requestLock = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) { lock.release().catch(() => {}); return; }
        lockRef.current = lock;
      } catch {
        // Ablehnung ist normal (z.B. Akkusparmodus, Tab schon im Hintergrund
        // beim Anfragen) -- kein Fehlerzustand, einfach ohne Wake Lock weiter.
      }
    };

    requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, []);
}
