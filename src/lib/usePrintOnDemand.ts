'use client';
import { useEffect, useState } from 'react';

// Fallback, falls ein Bild nie laedt (z.B. tote URL) -- lieber unvollstaendig
// drucken als den Druckdialog nie oeffnen.
const IMAGE_LOAD_TIMEOUT_MS = 4000;

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  if (typeof img.decode === 'function') {
    // decode() lehnt bei einem Lade-/Decodier-Fehler ab -- fuer den
    // Druck-Zweck egal, wir wollen nur warten, nicht den Fehler behandeln.
    return img.decode().catch(() => {});
  }
  return new Promise<void>(resolve => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

async function waitForImagesIn(containers: HTMLElement[], timeoutMs: number): Promise<void> {
  const images = containers.flatMap(c => Array.from(c.querySelectorAll('img')));
  if (images.length === 0) return;
  await Promise.race([
    Promise.all(images.map(waitForImage)),
    new Promise<void>(resolve => setTimeout(resolve, timeoutMs)),
  ]);
}

/**
 * Generisches "auf Abruf drucken"-Muster: ein Element wird erst bei Bedarf
 * (z.B. Klick in einer Galerie-Liste) in einen .print-only-Bereich gemountet,
 * window.print() feuert danach automatisch -- kein Umweg ueber Seiten-
 * Navigation noetig. Wartet zusaetzlich, bis alle <img> im .print-only-
 * Bereich geladen sind (Menuekarte hat keine Bilder, folgenlos; beim
 * Tellerdesign-Export ist das zwingend, sonst druckt der Dialog ggf. ein
 * halb geladenes/leeres Bild).
 */
export function usePrintOnDemand<T>() {
  const [printing, setPrinting] = useState<T | null>(null);

  useEffect(() => {
    if (!printing) return;
    let cancelled = false;

    (async () => {
      const containers = Array.from(document.querySelectorAll<HTMLElement>('.print-only'));
      await waitForImagesIn(containers, IMAGE_LOAD_TIMEOUT_MS);
      if (!cancelled) window.print();
    })();

    const reset = () => setPrinting(null);
    window.addEventListener('afterprint', reset, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('afterprint', reset);
    };
  }, [printing]);

  return { printing, triggerPrint: setPrinting };
}
