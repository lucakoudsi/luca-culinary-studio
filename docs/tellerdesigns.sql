-- ═══════════════════════════════════════════════════════════════════════════
-- Tellerdesigner -- Galerie-Tabelle "tellerdesigns"
-- ═══════════════════════════════════════════════════════════════════════════
-- Persistiert ein Design erst, wenn der Nutzer aktiv auf "Speichern" klickt
-- (siehe POST /api/tellerdesigner/save) -- verworfene Vorschlaege landen nie
-- hier. Das generierte Bild selbst liegt bereits im Storage-Bucket
-- "teller-bilder" (siehe save/route.ts); diese Tabelle speichert nur die
-- Metadaten + die oeffentliche Bild-URL fuer die "Meine Designs"-Galerie
-- (/tellerdesigner/galerie).
--
-- Snapshot-Prinzip: Stilrichtung/Aufwand/Fokus/Zubereitungszeit/Saison/Titel
-- werden zum Speicherzeitpunkt eingefroren, nicht live aus dem verknuepften
-- Rezept nachgeladen (siehe TellerDesignRow-Kommentar in src/types/index.ts)
-- -- aendert sich das Rezept spaeter oder wird geloescht, bleibt die
-- Galerie-Karte unveraendert bestehen.
--
-- Ausfuehren im Supabase SQL Editor. Idempotent -- mehrfaches Ausfuehren ist
-- unschaedlich.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.tellerdesigns (
  id               uuid primary key default gen_random_uuid(),

  -- FK auf auth.users, NICHT auf eine eigene public.users-Tabelle (Konvention
  -- des Projekts, siehe CLAUDE.md) -- Zugriffskontrolle passiert im
  -- API-Route-Code (Service-Role-Client + manueller user_id-Filter), nicht
  -- ueber Postgres-RLS-Policies.
  user_id          uuid not null references auth.users(id) on delete cascade,

  created_at       timestamptz not null default now(),

  -- Oeffentliche Storage-URL aus dem Bucket "teller-bilder" (POST
  -- /api/tellerdesigner/save laedt dort hoch, BEVOR die Zeile hier
  -- eingefuegt wird).
  bild_url         text not null,

  -- Generierter oder aus dem Rezepttitel uebernommener Anzeigename.
  titel            text not null,

  -- Optionaler Link zum Ursprungsrezept -- NULL im "frei"-Modus. Beim Loeschen
  -- des Rezepts bleibt die Galerie-Zeile erhalten (Snapshot-Prinzip oben),
  -- nur die Verknuepfung selbst wird entfernt.
  rezept_id        bigint references public.recipes(id) on delete set null,

  modus            text not null check (modus in ('rezept', 'frei')),

  -- Snapshot der drei Gestaltungsdimensionen zum Generierungszeitpunkt --
  -- Rohwerte (nicht die Anzeige-Labels), damit die Galerie STILRICHTUNG_LABEL
  -- / AUFWAND_LABEL / ANRICHTE_FOKUS_LABEL genauso mappen kann wie die
  -- Haupt-Seite (siehe DesignInfoBox-Aufruf in src/app/tellerdesigner/page.tsx).
  stilrichtung     text not null check (stilrichtung in (
                     'modern_fine_dining', 'nordic', 'michelin',
                     'rustikal_edel', 'minimalistisch', 'klassisch'
                   )),
  aufwand          text not null check (aufwand in ('bistro', 'gehoben', 'fine_dining')),
  anrichte_fokus   text not null check (anrichte_fokus in (
                     'zutat_im_fokus', 'symmetrie', 'kreativ', 'farbe_kontrast'
                   )),

  -- Nur im "rezept"-Modus gefuellt (Snapshot aus dem Rezept zum
  -- Speicherzeitpunkt) -- im "frei"-Modus beide NULL.
  zubereitungszeit integer,
  saison           text,

  -- Die generierten Anrichte-Technik-Labels ({schlagwort, kurzsatz,
  -- anleitung}[], siehe TellerTechnik in src/types/index.ts) fuer die
  -- Annotationen in der Galerie-Detailansicht.
  techniken        jsonb not null default '[]'::jsonb,

  -- modus/rezept_id muessen konsistent sein: "rezept" ohne Verknuepfung oder
  -- "frei" MIT Verknuepfung waeren Dateninkonsistenzen.
  constraint tellerdesigns_modus_rezept_id_check check (
    (modus = 'rezept' and rezept_id is not null) or
    (modus = 'frei' and rezept_id is null)
  )
);

comment on table public.tellerdesigns is
  'Gespeicherte Tellerdesigner-Ergebnisse ("Meine Designs"-Galerie) -- nur explizit per "Speichern" persistierte Varianten, Snapshot der Design-Parameter zum Speicherzeitpunkt.';

-- Gallerie-Abfragemuster: "alle Designs eines Users, neueste zuerst".
create index if not exists tellerdesigns_user_id_created_at_idx
  on public.tellerdesigns (user_id, created_at desc);

-- RLS aktiviert, aber bewusst OHNE Policies -- gleiches Muster wie die
-- uebrigen Tabellen im Projekt (siehe CLAUDE.md, "RLS-Umstellung"): jeglicher
-- Zugriff (lesen wie schreiben) laeuft ausschliesslich ueber die API-Routen
-- mit dem Service-Role-Client, der RLS umgeht; direkter Zugriff ueber den
-- anonymen/authentifizierten Client-Key wird durch RLS ohne Policies
-- vollstaendig blockiert.
alter table public.tellerdesigns enable row level security;
