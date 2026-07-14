'use client';
import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

type ImageLightboxProps = {
  images: string[];
  /** null = geschlossen */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

/** Vollbild-Ansicht für ein Bild aus einer Liste -- Schließen per Backdrop-Klick, X oder Escape; bei mehreren Bildern Pfeiltasten/-Buttons zum Blättern. */
export default function ImageLightbox({ images, index, onClose, onNavigate }: ImageLightboxProps) {
  const open = index !== null;
  const count = images.length;

  const goPrev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + count) % count);
  }, [index, count, onNavigate]);

  const goNext = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % count);
  }, [index, count, onNavigate]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && count > 1) goPrev();
      else if (e.key === 'ArrowRight' && count > 1) goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, count, goPrev, goNext, onClose]);

  if (!open || index === null) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: 'rgba(22,13,17,0.94)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors">
        <X size={18} />
      </button>

      {count > 1 && (
        <span className="absolute top-6 left-6 text-[13px] font-medium tabular-nums" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {index + 1} / {count}
        </span>
      )}

      {count > 1 && (
        <button onClick={e => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
      )}

      <img
        src={images[index]}
        alt=""
        onClick={e => e.stopPropagation()}
        className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain"
        style={{ boxShadow: '0 24px 70px rgba(0,0,0,0.55)', border: '1px solid rgba(201,168,76,0.25)' }} />

      {count > 1 && (
        <button onClick={e => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors">
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}
