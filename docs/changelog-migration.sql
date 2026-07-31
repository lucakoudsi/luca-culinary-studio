-- ═══════════════════════════════════════════════════════════════════════════
-- Changelog ("Was ist neu") -- Tabelle "changelog_entries" + Sichtbarkeits-
-- Zeitstempel auf profiles
-- ═══════════════════════════════════════════════════════════════════════════
-- Ausfuehren im Supabase SQL Editor. Idempotent -- mehrfaches Ausfuehren ist
-- unschaedlich.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.changelog_entries (
  id          uuid primary key default gen_random_uuid(),
  titel       text not null,
  text        text not null,
  kategorie   text not null check (kategorie in ('neu', 'verbessert', 'behoben')),
  sichtbar    boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.changelog_entries is
  'Admin-gepflegte "Was ist neu"-Eintraege. Nur sichtbar=true Eintraege werden Nutzern angezeigt.';

create index if not exists changelog_entries_sichtbar_created_at_idx
  on public.changelog_entries (sichtbar, created_at desc);

alter table public.changelog_entries enable row level security;

-- Eingeloggte Nutzer duerfen nur sichtbare Eintraege lesen. Schreiben/Aendern/
-- Loeschen bewusst OHNE eigene Policy -- laeuft ausschliesslich ueber
-- /api/admin/changelog mit Service-Role-Client + ADMIN_EMAIL-Check (siehe
-- src/config/roles.ts), um den Admin-Begriff nicht zusaetzlich in SQL zu
-- duplizieren (gleiche Ueberlegung wie bei den uebrigen Admin-Routen im
-- Projekt).
drop policy if exists "changelog_entries_select_visible" on public.changelog_entries;
create policy "changelog_entries_select_visible"
  on public.changelog_entries for select
  to authenticated
  using (sichtbar = true);

-- "Gesehen bis"-Zeitstempel fuers Glockensymbol -- Server-Fakt statt
-- localStorage, damit der Status geraete-/browserunabhaengig ist (gleiche
-- Kategorie wie email_updates/profil_oeffentlich/standort auf profiles).
alter table public.profiles
  add column if not exists changelog_seen_at timestamptz;
