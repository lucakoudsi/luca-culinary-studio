// Visuelle Anrichte-Stilrichtung fuer den Tellerdesigner -- unabhaengig von
// Aufwandsstufe (src/config/techniken.ts, Komplexitaet der Zubereitung).
// Stilrichtung beeinflusst NUR die Optik/Anrichteweise, nicht die Technik-
// Erlaubnis. Gleiches Muster wie src/config/rezeptFelder.ts.
export const STILRICHTUNGEN = [
  'modern_fine_dining',
  'nordic',
  'michelin',
  'rustikal_edel',
  'minimalistisch',
  'klassisch',
] as const;

export type Stilrichtung = typeof STILRICHTUNGEN[number];

export const STILRICHTUNG_LABEL: Record<Stilrichtung, string> = {
  modern_fine_dining: 'Modern Fine Dining',
  nordic: 'Nordic',
  michelin: 'Michelin',
  rustikal_edel: 'Rustikal Edel',
  minimalistisch: 'Minimalistisch',
  klassisch: 'Klassisch',
};

// Fliesst direkt in den Bild-Prompt UND den Techniken-System-Prompt --
// Ton bewusst wie AUFWAND_STIL im bestehenden Tellerdesigner-Route-File.
export const STILRICHTUNG_PROMPT: Record<Stilrichtung, string> = {
  modern_fine_dining: 'Klare geometrische Anordnung, viel bewusster Weißraum, präzise Punkte und Wischer, zeitgenössische Sterneküche.',
  nordic: 'Naturbelassen und reduziert: unregelmäßige Formen, essbare Blüten/Kräuter, erdige Töne, an skandinavisches Foraging angelehnt.',
  michelin: 'Höchste Präzision und Symmetrie, makellose Sauciertechnik, aufwendige Mikro-Garnituren, Ausstellungscharakter.',
  rustikal_edel: 'Bodenständige Zutaten großzügig, aber bewusst inszeniert -- Steingut/dunkles Holz, natürliche Texturen, gehobene Wirtshausküche.',
  minimalistisch: 'Auf das Wesentliche reduziert, ein bis zwei Komponenten klar abgesetzt, viel Teller sichtbar, skulptural.',
  klassisch: 'Traditionelle französische Anrichteweise, symmetrisch, Sauce als Spiegel unter der Komponente, zeitlos.',
};

export const DEFAULT_STILRICHTUNG: Stilrichtung = 'modern_fine_dining';
