import type { Recipe } from '@/types';

// Einzige Stelle, die eine DB-Zeile aus "recipes" auf den Recipe-Typ mappt --
// bisher als toRecipe() in api/rezepte/route.ts UND api/rezepte/[id]/route.ts
// dupliziert, dabei auseinandergelaufen (naehrwerte fehlte in einer der
// beiden Kopien, siehe Bugfix 2026-07-31). Beide Routen nutzen jetzt diese
// Funktion, damit ein neues Rezeptfeld nicht mehr an einer von zwei Stellen
// vergessen werden kann.
export function toRecipe(row: Record<string, unknown>): Recipe {
  return {
    id:          row.id as number,
    title:       row.name as string,
    category:    row.kategorie as Recipe['category'],
    tags:        (row.tags as string[]) ?? [],
    difficulty:  row.schwierigkeit as Recipe['difficulty'],
    time:        row.zubereitungszeit as number,
    season:      (row.saison as Recipe['season']) ?? 'Ganzjährig',
    status:      row.status as Recipe['status'],
    rating:      row.bewertung as number,
    image:       (row.bild as string) ?? null,
    description: (row.beschreibung as string) ?? '',
    lastEdited:  (row.zuletzt_bearbeitet as string) ?? '',
    views:       row.aufrufe as number,
    portionen:   (row.portionen as number) ?? 4,
    zutaten:     (row.zutaten as Recipe['zutaten']) ?? [],
    komponenten: (row.komponenten as Recipe['komponenten']) ?? [],
    schritte:    (row.schritte as string[]) ?? [],
    getraenke:   (row.getraenke as string) ?? '',
    chefTipps:   (row.chef_tipps as string) ?? '',
    geschmack:   (row.geschmack as Recipe['geschmack']) ?? null,
    naehrwerte:  (row.naehrwerte as Recipe['naehrwerte']) ?? null,
  };
}
