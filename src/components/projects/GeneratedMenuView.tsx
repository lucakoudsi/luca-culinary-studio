'use client';
import type { ProjectMenu } from '@/types';
import Menuekarte, { type MenuekarteDaten, MenuekartePrintSheet } from '@/components/Menuekarte';
import { X, Pencil, Printer } from 'lucide-react';
import { usePrintOnDemand } from '@/lib/usePrintOnDemand';

// Ein Projekt-Menü gilt als "aus dem Menuegenerator" (KI-generiert), sobald
// mindestens ein Gang eines der KI-only-Felder gesetzt hat. Manuell angelegte
// Menues (ueber "Neues Menü" / addGang) setzen diese Felder nie.
export function isGeneratedMenu(menu: ProjectMenu): boolean {
  return menu.gaenge.some(g =>
    !!g.geschmacksprofil || !!g.zubereitungsidee || (g.hauptzutaten && g.hauptzutaten.length > 0)
  );
}

function toMenuekarteDaten(menu: ProjectMenu): MenuekarteDaten {
  return {
    titel: menu.name,
    dramaturgieBegruendung: menu.beschreibung,
    gaenge: menu.gaenge.map((g, i) => ({
      nummer: i + 1,
      titel: g.bezeichnung,
      beschreibung: g.beschreibung,
      hauptzutaten: g.hauptzutaten,
      geschmacksprofil: g.geschmacksprofil,
      zubereitungsidee: g.zubereitungsidee,
      weinId: g.weinId,
      weinName: g.weinName,
    })),
  };
}

export default function GeneratedMenuView({ menu, onClose, onEdit }: {
  menu: ProjectMenu; onClose: () => void; onEdit: () => void;
}) {
  // Gleicher Hook wie GalerieDetailOverlay/Tellerdesigner/Menuegenerator-
  // Galerie (usePrintOnDemand) -- alle Druckwege im Projekt funktionieren
  // jetzt identisch, statt direktem window.print() als Sonderfall hier.
  const { printing, triggerPrint } = usePrintOnDemand<MenuekarteDaten>();

  return (
    <>
      {/* Als Geschwister ausserhalb des fixed-Wrappers -- siehe Warnhinweis an
       * .print-only in globals.css. Gleicher Bug wie GalerieDetailOverlay:
       * als Kind des fixed-Modal-Wrappers verankerte sich der Inhalt bei
       * mehrseitigem Druck auf jeder Seite neu. */}
      {printing && <MenuekartePrintSheet data={printing} />}

      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2 mb-3">
            <button onClick={() => triggerPrint(toMenuekarteDaten(menu))} type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors"
              style={{ background: 'rgba(255,255,255,0.95)', color: '#562E3C' }}>
              <Printer size={13} /> Als PDF exportieren
            </button>
            <button onClick={onEdit} type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors"
              style={{ background: 'rgba(255,255,255,0.95)', color: '#562E3C' }}>
              <Pencil size={13} /> Bearbeiten
            </button>
            <button onClick={onClose} type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }}>
              <X size={16} />
            </button>
          </div>
          <Menuekarte data={toMenuekarteDaten(menu)} />
        </div>
      </div>
    </>
  );
}
