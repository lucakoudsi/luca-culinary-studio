import type { RecipeIngredient, RecipeKomponente } from '@/types';

// Reiner Aenderungs-Detektor fuer die "veraltet"-Anzeige der Kalorien-Schaetzung
// -- KEINE Sicherheitsfunktion, daher bewusst kein Crypto-Hash, sondern ein
// einfacher, synchroner String-Hash (laeuft identisch im Browser wie im
// Server-Code, ohne Web-Crypto-Async-Umweg). Server (kalorien/route.ts)
// stempelt ihn beim Berechnen in "zutaten_hash", die Bearbeiten-Seite
// vergleicht live den Hash des AKTUELLEN Formular-Stands dagegen -- egal ob
// die Aenderung durch manuelles Tippen, Sous-Chef-Patch oder Import kam,
// ohne dass irgendwo ein eigenes "stale"-Flag gesetzt werden muss.
//
// Bewusst NUR ueber zutaten+komponenten, nicht ueber portionen -- "kcal pro
// Portion" wird live aus gesamt.kcal / aktuelle Portionen angezeigt, ein
// reines Portionen-Aendern macht die Schaetzung nicht "veraltet".
export function hashZutatenKomponenten(zutaten: RecipeIngredient[], komponenten: RecipeKomponente[]): string {
  const input = JSON.stringify({ zutaten, komponenten });
  // djb2 -- kurz, deterministisch, kollisionsarm genug fuer einen reinen
  // Aenderungs-Vergleich (keine kryptografischen Anforderungen).
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16);
}
