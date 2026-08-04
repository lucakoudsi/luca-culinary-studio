-- ═══════════════════════════════════════════════════════════════════════════
-- Tellerdesigner -- Zutaten-Positionen (Etappe 1 von 4)
-- ═══════════════════════════════════════════════════════════════════════════
-- Erweitert public.tellerdesigns um strukturierte Zutaten MIT Positionen,
-- vom Textmodell im selben Call wie die Anrichte-Techniken geplant (siehe
-- POST /api/tellerdesigner). In dieser Etappe entstehen und speichern sich
-- die Daten nur -- es gibt noch KEINE Hotspot-Anzeige auf der Buehne
-- (TellerStage), das folgt erst in Etappe 2.
--
-- Alle drei Spalten mit Default -- bestehende Zeilen bleiben ohne Nachtrag
-- gueltig, laufen einfach mit zutaten='[]' weiter (siehe Abwaertskompatibi-
-- litaets-Fallback in der urspruenglichen Etappen-Analyse).
--
-- Ausfuehren im Supabase SQL Editor. Idempotent -- mehrfaches Ausfuehren ist
-- unschaedlich.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.tellerdesigns
  -- Strukturierte Zutaten-Positionen: [{ name, position: {x, y}, rolle,
  -- kurzsatz }], x/y normalisiert 0..1, BILDBEZOGEN (nicht tellerbezogen) --
  -- wichtig fuer die spaetere Overlay-Umrechnung bei object-contain. Vom
  -- Textmodell im selben Call wie "techniken" geplant, siehe
  -- buildTechnikSystemPrompt in src/app/api/tellerdesigner/route.ts.
  add column if not exists zutaten jsonb not null default '[]'::jsonb,

  -- Versions-Marker fuer die Positions-Generierungslogik -- falls sich der
  -- Algorithmus spaeter aendert (z.B. anderes Rasterschema, mehr Kontext),
  -- laesst sich daran unterscheiden, mit welcher Logik ein Design entstand.
  add column if not exists layout_version integer not null default 1,

  -- Fuer Etappe 3 (Nutzer korrigiert Positionen manuell auf der Buehne) --
  -- hier schon angelegt, aber in dieser Etappe von keinem Code gelesen oder
  -- gesetzt.
  add column if not exists positionen_korrigiert boolean not null default false;

comment on column public.tellerdesigns.zutaten is
  'Strukturierte Zutaten-Positionen [{name, position:{x,y}, rolle, kurzsatz}], x/y bildbezogen 0..1. Leer bei Designs vor Etappe 1.';
comment on column public.tellerdesigns.layout_version is
  'Version der Positions-Generierungslogik, die dieses Design erzeugt hat.';
comment on column public.tellerdesigns.positionen_korrigiert is
  'True, sobald der Nutzer eine generierte Position manuell verschoben hat (Etappe 3, noch ungenutzt).';
