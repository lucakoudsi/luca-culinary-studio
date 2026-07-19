'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { TellerDesignRow } from '@/types';
import DesignInfoBox from './DesignInfoBox';

const DATE_FORMAT = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

/** Vollbild-Detailansicht eines gespeicherten Designs -- gleiche dunkle,
 * zurueckhaltende Bildschirm-Sprache wie ImageLightbox (statt eines
 * Dashboard-Modals mit Karten-Chrome), damit sich die Galerie wie eine
 * Fortsetzung der Buehne anfuehlt statt wie eine separate Verwaltungsseite. */
export default function GalerieDetailOverlay({ design, onClose }: { design: TellerDesignRow; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-6 overflow-y-auto"
      style={{ background: 'rgba(22,13,17,0.94)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <button onClick={onClose}
        className="fixed top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors">
        <X size={18} />
      </button>

      <div className="flex flex-col md:flex-row gap-10 max-w-[1100px] w-full my-auto py-10" onClick={e => e.stopPropagation()}>
        <img
          src={design.bildUrl}
          alt={design.titel}
          className="md:flex-1 rounded-xl object-contain w-full"
          style={{ maxHeight: '78vh', boxShadow: '0 24px 70px rgba(0,0,0,0.55)', border: '1px solid rgba(201,168,76,0.25)' }} />

        <div className="w-full md:w-[280px] flex-shrink-0">
          <h2 className="font-heading font-bold text-[22px] leading-snug text-white">{design.titel}</h2>
          <p className="text-[12px] mt-1 mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {DATE_FORMAT.format(new Date(design.createdAt))}
          </p>

          <DesignInfoBox
            stil={design.stil ?? '–'}
            schwierigkeit={design.schwierigkeit ?? '–'}
            zubereitungszeit={design.zubereitungszeit}
            saison={design.saison} />

          {design.techniken.length > 0 && (
            <div className="mt-6 space-y-4">
              {design.techniken.map((t, i) => (
                <div key={i}>
                  <div className="font-heading font-bold text-[11.5px] uppercase tracking-[1.5px]" style={{ color: '#C9A84C' }}>
                    {t.schlagwort}
                  </div>
                  <div className="text-[12px] leading-snug mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {t.kurzsatz}
                  </div>
                  {t.anleitung && (
                    <div className="text-[11px] italic leading-snug mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {t.anleitung}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
