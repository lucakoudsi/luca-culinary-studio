-- ═══════════════════════════════════════════════════════════════════════════
-- Monatliches Text-KI-Kontingent -- Tabelle "ai_text_quota"
-- ═══════════════════════════════════════════════════════════════════════════
-- Gleiches Muster wie das bestehende Bild-Kontingent (ai_image_quota +
-- check_and_increment_image_quota), nur mit GEWICHTETEM statt festem
-- Verbrauch: eine Aktion zieht so viele Einheiten, wie sie tatsaechlich an
-- OpenAI-Kosten verursacht, statt jede Aktion pauschal mit 1 zu zaehlen.
--
-- Deckt alle 5 Text-KI-Routen ab, die ueber den zentralen Betreiber-Key
-- laufen (docs/abo-konzept.md.txt Abschnitt 2a): Menuegenerator,
-- KI-Sous-Chef-Chat, Rezept-Sous-Chef, Rezept-Import Text, Rezept-Import
-- Bild. Rate-Limit (20/Min, 200/Tag, ai_rate_limits) bleibt UNVERAENDERT
-- zusaetzlich bestehen -- das Kontingent hier deckelt die Kosten uebers
-- Monat, das Rate-Limit deckelt Missbrauch/Spitzenlast. Zwei verschiedene
-- Schutzebenen, keine ersetzt die andere.
--
-- Gewichtung (1 Einheit ≈ 0,7 ct, der Chat-Basiswert -- siehe
-- src/config/textQuota.ts TEXT_QUOTA_WEIGHTS):
--   Chat-Nachricht                              1 Einheit
--   Rezept-Sous-Chef (ohne Bilder)               2 Einheiten
--   Rezept-Import Text                           2 Einheiten
--   Menuegenerator                               3 Einheiten
--   Rezept-Import Bild / Sous-Chef mit Bildern   7 Einheiten (ab 2026-07-23,
--                                                 vorher 5 -- detail:"high"
--                                                 statt "auto", siehe
--                                                 import-bild/route.ts)
--
-- Monatslimits pro Abo-Stufe (kalibriert auf ~10,5 % des jeweiligen
-- Netto-Abopreises als Worst-Case-Kostenanteil, siehe Diskussion in der
-- Session vom 2026-07-19): Free 0, Basic 150, Pro 375, Team 900.
--
-- Ausfuehren im Supabase SQL Editor. Idempotent -- mehrfaches Ausfuehren ist
-- unschaedlich.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.ai_text_quota (
  -- EIN Zeile pro Nutzer (nicht pro Monat) -- Rollover wird beim Lesen/
  -- Schreiben anhand von month_start erkannt, exakt wie bei ai_image_quota.
  user_id     uuid primary key references auth.users(id) on delete cascade,
  month_start date not null default date_trunc('month', now())::date,
  used_count  integer not null default 0,
  updated_at  timestamptz not null default now()
);

comment on table public.ai_text_quota is
  'Monatliches, gewichtetes Text-KI-Kontingent pro Nutzer (Menuegenerator, KI-Sous-Chef, Rezept-Sous-Chef, Rezept-Import Text/Bild). Ein Zeile pro Nutzer, Rollover ueber month_start-Vergleich beim Lesen bzw. in der RPC beim Schreiben.';

-- RLS aktiviert, bewusst OHNE Policies -- gleiches Muster wie tellerdesigns/
-- user_api_keys: Zugriff ausschliesslich ueber den Service-Role-Client in
-- den API-Routen, kein direkter Client-Zugriff.
alter table public.ai_text_quota enable row level security;

-- ── RPC: atomar pruefen + hochzaehlen ────────────────────────────────────────
-- Analog check_and_increment_image_quota, aber mit p_weight statt fixem +1.
-- "FOR UPDATE" sperrt die Zeile des Nutzers fuer die Dauer des Aufrufs --
-- verhindert, dass zwei parallele Anfragen desselben Nutzers das Kontingent
-- gemeinsam ueberziehen (klassische Race Condition bei read-then-write ohne
-- Sperre). Gibt 'ok' oder 'quota_exceeded' zurueck (kein Boolean, damit der
-- Aufrufer wie beim Bild-Kontingent zwischen "abgelehnt" und "RPC-Fehler"
-- unterscheiden kann).
create or replace function public.check_and_increment_text_quota(
  p_user_id uuid,
  p_monthly_limit integer,
  p_weight integer
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_month date := date_trunc('month', now())::date;
  v_used integer;
  v_stored_month date;
begin
  -- Erste Anfrage dieses Nutzers ueberhaupt -- Zeile anlegen.
  insert into ai_text_quota (user_id, month_start, used_count)
  values (p_user_id, v_current_month, 0)
  on conflict (user_id) do nothing;

  select used_count, month_start into v_used, v_stored_month
  from ai_text_quota
  where user_id = p_user_id
  for update;

  -- Rollover: gespeicherter Monat ist nicht der aktuelle -> Zaehler faengt
  -- fuer diesen Monat bei 0 an (der alte Wert wird erst beim naechsten
  -- erfolgreichen Schreiben ueberschrieben, siehe unten).
  if v_stored_month <> v_current_month then
    v_used := 0;
  end if;

  if v_used + p_weight > p_monthly_limit then
    return 'quota_exceeded';
  end if;

  update ai_text_quota
  set used_count = v_used + p_weight,
      month_start = v_current_month,
      updated_at = now()
  where user_id = p_user_id;

  return 'ok';
end;
$$;

-- ── Rechte einschraenken ─────────────────────────────────────────────────────
-- SECURITY DEFINER-Funktionen sind in Postgres per Default fuer PUBLIC
-- ausfuehrbar -- ohne dieses Revoke koennte jeder eingeloggte (oder sogar
-- anonyme) Client die RPC direkt ueber PostgREST aufrufen, mit BELIEBIGER
-- p_user_id, und so fremde Kontingente leerraeumen oder das eigene mit einem
-- negativen/riesigen p_weight manipulieren -- die App-seitige Tier-/Owner-
-- Pruefung in den API-Routen wuerde dabei komplett umgangen. Gleiche Luecke
-- wie bei check_and_increment_image_quota und der Rate-Limit-RPC, hier gleich
-- mit behoben: nur der Service-Role-Client (den ausschliesslich unsere
-- API-Routen nutzen) darf die Funktion aufrufen.
revoke all on function public.check_and_increment_text_quota(uuid, integer, integer) from public;
revoke all on function public.check_and_increment_text_quota(uuid, integer, integer) from anon;
revoke all on function public.check_and_increment_text_quota(uuid, integer, integer) from authenticated;
grant execute on function public.check_and_increment_text_quota(uuid, integer, integer) to service_role;
