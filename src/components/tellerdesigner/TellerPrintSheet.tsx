import type { TellerTechnik, TellerDesignRow } from '@/types';

// ─── Tellerdesign-Druckblatt ────────────────────────────────────────────────
// Bedient ZWEI Quellen mit unterschiedlicher Form (gespeicherte Galerie-Zeile
// TellerDesignRow vs. frisch generierte, noch nicht gespeicherte TellerVariante
// auf /tellerdesigner) -- beide werden auf DIESEN einen, bereits Anzeige-
// fertigen Typ gemappt (Labels statt Enum-Codes), damit es nur EINEN
// Render-Pfad gibt, kein Doppelrendering pro Quelle. Analog zu
// toMenuekarteDaten() in Menuekarte.tsx: der "primäre" Mapper (fuer die
// bereits normalisierte DB-Zeile) lebt hier, die TellerVariante-Zuordnung
// bleibt lokal in tellerdesigner/page.tsx (andere Eingangsform, siehe dort).
export type TellerPrintDesign = {
  id: string;
  bildUrl: string;
  titel: string;
  stilrichtung: string;
  aufwand: string;
  anrichteFokus: string;
  techniken: TellerTechnik[];
};

export function tellerDesignRowToPrintDesign(d: TellerDesignRow): TellerPrintDesign {
  return {
    id: d.id,
    bildUrl: d.bildUrl,
    titel: d.titel || 'Ohne Titel',
    stilrichtung: d.stil ?? '–',
    aufwand: d.schwierigkeit ?? '–',
    anrichteFokus: d.anrichteFokus ?? '–',
    techniken: d.techniken,
  };
}

/**
 * Druckansicht -- KEIN neues Layout-System, nur eine zweite, auf dem
 * Bildschirm unsichtbare Instanz (.print-only, siehe globals.css), die erst
 * bei window.print() erscheint (ausgeloest ueber usePrintOnDemand). Nimmt
 * bewusst ein Array entgegen (jetzt immer nur 1 Element) -- eine spaetere
 * Mappe braucht dafuer nur mehr Eintraege, keinen Umbau der Druck-Mechanik.
 */
export function TellerPrintSheet({ designs }: { designs: TellerPrintDesign[] }) {
  return (
    <div className="print-only teller-print">
      {designs.map((d, i) => (
        <section key={d.id} className="teller-print-sheet" style={i > 0 ? { breakBefore: 'page' } : undefined}>
          <img src={d.bildUrl} alt={d.titel} className="teller-print-image" />
          <h1 className="teller-print-title">{d.titel}</h1>
          <p className="teller-print-meta">{d.stilrichtung} · {d.aufwand} · {d.anrichteFokus}</p>

          {d.techniken.length > 0 && (
            <div>
              {d.techniken.map((t, ti) => (
                <div key={ti} className="teller-print-technik">
                  <div className="teller-print-schlagwort">{t.schlagwort}</div>
                  <div className="teller-print-kurzsatz">{t.kurzsatz}</div>
                  {t.anleitung && <div className="teller-print-anleitung">{t.anleitung}</div>}
                </div>
              ))}
            </div>
          )}

          <p className="print-footer">✦ Culinary Studio ✦</p>
        </section>
      ))}
    </div>
  );
}
