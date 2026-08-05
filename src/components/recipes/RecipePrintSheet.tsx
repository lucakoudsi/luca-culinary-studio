import type { RecipeIngredient, RecipeKomponente } from '@/types';

// ─── Rezept-Druckblatt ──────────────────────────────────────────────────────
// Nimmt bewusst ein Array entgegen (aktuell immer nur 1 Element), gleiches
// Muster wie TellerPrintSheet -- eine spaetere Mehrfachauswahl braucht dafuer
// nur mehr Eintraege, keinen Umbau der Druck-Mechanik.
//
// Die Portionen-Skalierung (scaleMenge) passiert NICHT hier, sondern beim
// Aufrufer (rezepte/[id]/page.tsx) -- die Seite haelt ohnehin schon
// scaledZutaten/scaledKomponenten fuer die Bildschirmansicht vor, dasselbe
// Ergebnis geht 1:1 in die Druckdaten. Dieses Blatt ist reine Anzeige.
export type RecipePrintData = {
  id: number;
  image: string | null;
  title: string;
  description: string;
  difficulty: string;
  time: number;
  season: string;
  portionen: number;
  zutaten: RecipeIngredient[];
  komponenten: RecipeKomponente[];
  schritte: string[];
  chefTipps: string;
};

/**
 * Druckansicht -- KEIN neues Layout-System, nur eine zweite, auf dem
 * Bildschirm unsichtbare Instanz (.print-only, siehe globals.css), die erst
 * bei window.print() erscheint (ausgeloest ueber usePrintOnDemand).
 *
 * WICHTIG: als Geschwister/Top-Level rendern, niemals als Kind eines
 * Elements mit position:fixed/absolute/relative/sticky oder transform (siehe
 * Warnhinweis an .print-only in globals.css) -- rezepte/[id]/page.tsx nutzt
 * kein PageTransition und hat auch sonst keinen solchen Vorfahren, das Blatt
 * kann daher direkt als Geschwister im Seiten-Root sitzen.
 */
export function RecipePrintSheet({ recipes }: { recipes: RecipePrintData[] }) {
  return (
    <div className="print-only rezept-print">
      {recipes.map((r, i) => (
        <section key={r.id} className="rezept-print-sheet" style={i > 0 ? { breakBefore: 'page' } : undefined}>
          {r.image && <img src={r.image} alt={r.title} className="rezept-print-image" />}
          <h1 className="rezept-print-title">{r.title}</h1>
          {r.description && <p className="rezept-print-description">{r.description}</p>}

          <p className="rezept-print-meta">
            {r.difficulty} · {r.time} Min · {r.season} · {r.portionen} {r.portionen === 1 ? 'Portion' : 'Portionen'}
          </p>

          {r.zutaten.length > 0 && (
            <div className="rezept-print-group">
              <h2 className="rezept-print-heading">Zutaten</h2>
              {r.zutaten.map((z, zi) => (
                <div key={zi} className="rezept-print-zutat">
                  <span>{z.name}</span><span>{z.menge}</span>
                </div>
              ))}
            </div>
          )}

          {r.komponenten.map((k, ki) => (
            <div key={ki} className="rezept-print-group">
              <h2 className="rezept-print-heading">{k.name}</h2>
              {k.zutaten.map((z, zi) => (
                <div key={zi} className="rezept-print-zutat">
                  <span>{z.name}</span><span>{z.menge}</span>
                </div>
              ))}
              {k.zubereitung && <p className="rezept-print-komponente-zubereitung">{k.zubereitung}</p>}
            </div>
          ))}

          {r.schritte.length > 0 && (
            <div>
              <h2 className="rezept-print-heading">Zubereitung</h2>
              <ol className="rezept-print-schritte">
                {r.schritte.map((s, si) => (
                  <li key={si} className="rezept-print-schritt">{s}</li>
                ))}
              </ol>
            </div>
          )}

          {r.chefTipps && (
            <div className="rezept-print-group">
              <h2 className="rezept-print-heading">Chef-Tipps</h2>
              <p className="rezept-print-chef-tipps">{r.chefTipps}</p>
            </div>
          )}

          <p className="print-footer">✦ Culinary Studio ✦</p>
        </section>
      ))}
    </div>
  );
}
