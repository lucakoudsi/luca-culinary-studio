-- ═══════════════════════════════════════════════════════════════════════════
-- Feedback-System -- Tabelle "feedback"
-- ═══════════════════════════════════════════════════════════════════════════
-- Ausfuehren im Supabase SQL Editor. Idempotent -- mehrfaches Ausfuehren ist
-- unschaedlich.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),

  -- FK auf auth.users, NICHT auf eine eigene public.users-Tabelle (Konvention
  -- des Projekts, siehe CLAUDE.md).
  user_id     uuid not null references auth.users(id) on delete cascade,

  kategorie   text not null check (kategorie in ('idee', 'problem', 'sonstiges')),
  text        text not null check (char_length(text) <= 2000),
  status      text not null default 'neu' check (status in ('neu', 'gesehen', 'erledigt')),
  created_at  timestamptz not null default now()
);

comment on table public.feedback is
  'Nutzer-Feedback (Idee/Problem/Sonstiges). Nutzer koennen nur eigenes Feedback anlegen, Lesen/Status-Aendern ist Admin-exklusiv ueber /api/admin/feedback. Rate-Limit (5/Stunde) wird serverseitig in /api/feedback geprueft, nicht hier.';

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

-- Fuer die serverseitige Rate-Limit-Pruefung ("wie viele Eintraege hat dieser
-- Nutzer in der letzten Stunde angelegt").
create index if not exists feedback_user_id_created_at_idx
  on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

-- Nutzer duerfen ausschliesslich eigenes Feedback anlegen. Lesen (auch das
-- eigene) und Status-Aendern laufen ausschliesslich ueber /api/admin/feedback
-- mit Service-Role-Client + ADMIN_EMAIL-Check -- der Nutzer selbst bekommt
-- nach dem Absenden nur die lokale Erfolgsmeldung, keine eigene Leseansicht.
drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own"
  on public.feedback for insert
  to authenticated
  with check (user_id = auth.uid());
