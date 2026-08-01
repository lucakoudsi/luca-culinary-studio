-- ═══════════════════════════════════════════════════════════════════════════
-- Menügenerator -- Galerie-Tabelle "menus" ("Meine Menüs")
-- ═══════════════════════════════════════════════════════════════════════════
-- Persistiert ein generiertes Menü erst, wenn der Nutzer aktiv auf "Menü
-- speichern" klickt (siehe POST /api/menus) -- verworfene Vorschläge landen
-- nie hier. Analog zu docs/tellerdesigns.sql (gleiches Muster: RLS aktiviert,
-- aber bewusst ohne Policies -- Zugriffskontrolle laeuft ausschliesslich ueber
-- den Service-Role-Client + manuellen user_id-Filter in den API-Routen unter
-- src/app/api/menus/, siehe CLAUDE.md).
--
-- "menu" speichert die komplette generierte Menü-Struktur als jsonb, exakt
-- die Antwort-Form von /api/menuegenerator:
--   {
--     "titel": string,
--     "dramaturgie_begruendung": string,
--     "gaenge": [
--       { "nummer": number, "titel": string, "beschreibung": string,
--         "hauptzutaten": string[],
--         "geschmacksprofil": {acidity,sweetness,bitterness,umami,spiciness,saltiness},
--         "zubereitungsidee": string, "technik"?: string,
--         "wein_empfehlung"?: {"id": number, "name": string} | null }
--     ]
--   }
-- Snapshot-Prinzip wie bei tellerdesigns: das gespeicherte Menü aendert sich
-- nicht mehr nachtraeglich (auch wenn sich z.B. verlinkte Weine spaeter
-- aendern) -- einzig "name" ist ueber PUT /api/menus/[id] umbenennbar.
--
-- Ausfuehren im Supabase SQL Editor. Idempotent -- mehrfaches Ausfuehren ist
-- unschaedlich.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.menus (
  id          uuid primary key default gen_random_uuid(),

  -- FK auf auth.users, NICHT auf eine eigene public.users-Tabelle (Konvention
  -- des Projekts, siehe CLAUDE.md).
  user_id     uuid not null references auth.users(id) on delete cascade,

  -- Anzeigename in der Galerie -- Vorschlag beim Speichern ist menu.titel,
  -- vom Nutzer editierbar, danach jederzeit per PUT umbenennbar.
  name        text not null,

  menu        jsonb not null,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.menus is
  'Gespeicherte Menügenerator-Ergebnisse ("Meine Menüs"-Galerie) -- nur explizit per "Menü speichern" persistierte Menüs, kein Auto-Save.';

-- Gallerie-Abfragemuster: "alle Menüs eines Users, neueste zuerst".
create index if not exists menus_user_id_created_at_idx
  on public.menus (user_id, created_at desc);

-- RLS aktiviert, aber bewusst OHNE Policies -- gleiches Muster wie
-- tellerdesigns/projekte: jeglicher Zugriff (lesen wie schreiben) laeuft
-- ausschliesslich ueber die API-Routen mit dem Service-Role-Client, der RLS
-- umgeht; direkter Zugriff ueber den anonymen/authentifizierten Client-Key
-- wird durch RLS ohne Policies vollstaendig blockiert.
alter table public.menus enable row level security;
