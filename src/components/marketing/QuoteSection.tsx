import { MARKETING_SURFACE_2, MARKETING_CREAM, MARKETING_GOLD } from '@/config/marketingTheme';

// Erstes Zitat im Projekt -- kein Vorbild anderswo. Bewusst OHNE
// Namensnennung: der im Entwurf mitgeschickte Text war vermutlich frei
// erfunden und faelschlich einer realen Person zugeschrieben. Generischer
// Platzhaltertext bis eine echte Entscheidung ueber Inhalt/Zuschreibung
// getroffen ist -- der sichtbare Text selbst sagt NICHT "Platzhalter",
// damit ein versehentliches Live-Gehen nicht wie ein kaputter Baustein wirkt.
export default function QuoteSection() {
  return (
    <section className="px-5 sm:px-8 py-20 sm:py-28" style={{ background: MARKETING_SURFACE_2 }}>
      <div className="max-w-3xl mx-auto text-center">
        <span className="font-heading" style={{ color: MARKETING_GOLD, fontSize: 40, lineHeight: 1 }}>„</span>
        <p className="font-heading" style={{ fontSize: 'clamp(20px, 3vw, 28px)', color: MARKETING_CREAM, lineHeight: 1.5, fontStyle: 'italic', marginTop: 8 }}>
          Großartige Küche beginnt nicht am Herd. Sie beginnt mit dem Willen, jeden Tag ein bisschen mehr zu wagen.
        </p>
      </div>
    </section>
  );
}
