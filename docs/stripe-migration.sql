-- Stripe-Integration: neue Spalten auf profiles fuer den Abo-Zustand.
-- Vor der ersten Nutzung von /api/stripe/checkout und /api/stripe/webhook
-- im Supabase SQL Editor ausfuehren (zuerst im Testmodus-/Dev-Projekt,
-- vor Live-Gang dann im Produktions-Projekt).
--
-- Siehe docs/stripe-plan.md fuer den vollen Kontext.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- Der Webhook-Handler sucht Profile bei Subscription-Events (Update/Delete,
-- Zahlungsausfall) ausschliesslich ueber stripe_customer_id, nicht ueber
-- die User-ID -- diese Events tragen keine client_reference_id.
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON profiles (stripe_customer_id);
