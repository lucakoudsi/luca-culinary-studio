// Zentrale Enum-Werte fuer das Rezept-Formular (/rezepte/neu) -- an einer
// Stelle gepflegt, damit z.B. der KI-Import (api/rezepte/import-ki) dieselben
// gueltigen Werte kennt wie das Formular selbst und nie einen ungueltigen
// Wert in ein <select> schreiben kann.
export const REZEPT_KATEGORIEN = ['Vorspeise', 'Suppe', 'Hauptgang', 'Dessert', 'Beilage', 'Snack'] as const;
export const REZEPT_SCHWIERIGKEITEN = ['Leicht', 'Mittel', 'Schwer'] as const;
export const REZEPT_SAISONS = ['Frühling', 'Sommer', 'Herbst', 'Winter', 'Ganzjährig'] as const;
