-- ═══════════════════════════════════════════════════════════════════════════
-- Kalorien-/Nährwertschätzung (Stufe 1: reine KI-Schätzung) -- neue Spalte
-- "naehrwerte" auf "recipes"
-- ═══════════════════════════════════════════════════════════════════════════
-- Ausfuehren im Supabase SQL Editor. Idempotent -- mehrfaches Ausfuehren ist
-- unschaedlich.
--
-- Struktur des JSON-Werts (keine eigene Tabelle -- "recipes" hat schon
-- mehrere jsonb-Spalten fuer zutaten/komponenten/schritte/tags/geschmack,
-- gleiches Muster):
--   {
--     "gesamt":         { "kcal": number, "protein": number, "fett": number, "kh": number },
--     "pro_komponente": [ { "name": string, "kcal": number, "protein": number, "fett": number, "kh": number } ],
--     "berechnet_am":   ISO-Zeitstempel (string),
--     "zutaten_hash":   string -- Hash ueber zutaten+komponenten zum Zeitpunkt der Berechnung,
--                                 siehe src/lib/naehrwertHash.ts. Portionen bewusst NICHT im Hash --
--                                 "kcal pro Portion" wird live aus gesamt.kcal / aktuelle Portionen
--                                 angezeigt, ein reines Portionen-Aendern macht die Werte nicht "veraltet".
--     "pro_portion":    boolean -- ob eine Portionsangabe > 0 vorlag, als die Werte berechnet wurden
--   }
--
-- Absichtlich flexibel/erweiterbar gehalten fuer eine spaetere Stufe 2
-- (Hybrid aus USDA-Nährwert-DB + KI-Schaetzung, siehe docs/feature-backlog.md
-- Abschnitt 1c) -- dort koennten pro Wert exakt/geschaetzt-Flags dazukommen,
-- ohne die Spalte an sich neu migrieren zu muessen.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.recipes
  add column if not exists naehrwerte jsonb;

comment on column public.recipes.naehrwerte is
  'KI-geschaetzte Naehrwerte (Stufe 1, siehe docs/kalorien-migration.sql Kopf fuer die Struktur). NULL bis zur ersten Berechnung ueber /api/rezepte/kalorien.';
