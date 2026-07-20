// Monatspreise pro Abo-Stufe, brutto inkl. 19% MwSt (siehe docs/abo-konzept.md.txt
// Abschnitt 4). Es gibt noch keine Stripe-Anbindung -- Stufen werden aktuell
// manuell vom Admin vergeben (/profil, Tab "Verwaltung"). Diese Zahlen sind
// trotzdem schon die verbindliche Zielpreisliste, u.a. fuer den
// Stufenvergleich im Tab "Mein Plan".
export const STUFE_PREIS_BRUTTO: Record<number, number> = {
  1: 0,
  2: 9.99,
  3: 24.99,
  4: 59.99,
};

export function formatPreis(brutto: number): string {
  if (brutto <= 0) return 'Kostenlos';
  return `${brutto.toFixed(2).replace('.', ',')} € / Monat`;
}
