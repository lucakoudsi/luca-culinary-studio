-- Offene Registrierung: Nachweis der AGB-/Datenschutz-Zustimmung.
-- Im Supabase SQL Editor ausfuehren, vor dem ersten Test von /register.
--
-- Siehe docs/registrierung-plan.md fuer den vollen Kontext.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text;
