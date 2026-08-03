'use client';
import { useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import type { TellerDesignRow } from '@/types';
import DesignInfoBox from './DesignInfoBox';
import { TellerPrintSheet, tellerDesignRowToPrintDesign, type TellerPrintDesign } from './TellerPrintSheet';
import { usePrintOnDemand } from '@/lib/usePrintOnDemand';

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

  // Gleicher Hook wie der Menuegenerator-Export (usePrintOnDemand) -- kein
  // eigener Klick-Handler dupliziert.
  const { printing, triggerPrint } = usePrintOnDemand<TellerPrintDesign[]>();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: 'rgba(8,6,7,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      {printing && <TellerPrintSheet designs={printing} />}

      <div
        className="relative flex flex-col w-full max-w-[1100px] max-h-[90vh] rounded-2xl overflow-hidden"
        style={{ background: '#1C1512', border: '1px solid rgba(201,168,76,0.25)' }}
        onClick={e => e.stopPropagation()}>
        {/* Eigene Kopfzeile ueber der Bild-/Text-Reihe, bleibt beim Scrollen der
         * Textspalte stehen -- Buttons duerfen nicht ueber scrollendem Inhalt
         * schweben, sonst laeuft Text unter ihnen durch. */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); triggerPrint([tellerDesignRowToPrintDesign(design)]); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors">
            <Printer size={14} /> Als PDF exportieren
          </button>
          <button onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col min-[900px]:flex-row gap-8 px-6 pb-6 flex-1 min-h-0 overflow-y-auto min-[900px]:overflow-hidden">
          <img
            src={design.bildUrl}
            alt={design.titel}
            className="min-[900px]:flex-1 min-[900px]:h-full rounded-xl object-contain w-full max-h-[60vh] min-[900px]:max-h-full"
            style={{ boxShadow: '0 24px 70px rgba(0,0,0,0.55)', border: '1px solid rgba(201,168,76,0.25)' }} />

          <div className="w-full min-[900px]:w-[400px] flex-shrink-0 min-h-0 min-[900px]:overflow-y-auto min-[900px]:pr-1">
            <h2 className="font-heading font-bold text-[22px] leading-snug text-white">{design.titel}</h2>
            <p className="text-[12px] mt-1 mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {DATE_FORMAT.format(new Date(design.createdAt))}
            </p>

            <DesignInfoBox
              variant="dark"
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
                    {/* anleitung ist der informative Kern (Annotation, nicht
                     * Dekoration) -- aufrecht, hellste Koerperschrift.
                     * kurzsatz ist das nachgeordnete Beiwerk -- klein, kursiv,
                     * gedaempft, aber bei 12px/0.55 noch klar lesbar. */}
                    {t.anleitung && (
                      <div className="text-[14px] leading-[1.6] mt-1.5" style={{ color: 'rgba(255,255,255,0.92)' }}>
                        {t.anleitung}
                      </div>
                    )}
                    {t.kurzsatz && (
                      <div className="text-[12px] italic leading-snug mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {t.kurzsatz}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
