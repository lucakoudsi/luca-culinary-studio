import Stripe from 'stripe';

// apiVersion bewusst nicht gepinnt -- die installierte SDK-Version bringt
// ihren eigenen, zueinander passenden Default mit (stripe@22.x). Erst
// pinnen, wenn ein SDK-Update auf eine neuere API-Version ansteht und
// Breaking Changes (siehe z.B. die current_period_end-Verschiebung auf
// Subscription-Items seit "basil") kontrolliert nachgezogen werden sollen.
export function createStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

// Ordnet Stripe-Price-IDs (aus Env-Variablen, unterscheiden sich zwischen
// Test- und Live-Modus) den bestehenden Abo-Stufen zu (STUFEN in
// src/config/roles.ts). Einzige Quelle fuer dieses Mapping -- Checkout- und
// Webhook-Route nutzen beide dieselben zwei Funktionen, damit nie eine
// Stufe falsch zugeordnet wird. Stufe 1 (Free) hat bewusst keinen Price --
// dafuer gibt es keinen Checkout.
const TIER_PRICE_ENV: Record<number, string | undefined> = {
  2: process.env.STRIPE_PRICE_BASIC,
  3: process.env.STRIPE_PRICE_PRO,
  4: process.env.STRIPE_PRICE_TEAM,
};

export function tierToPriceId(tier: number): string | null {
  return TIER_PRICE_ENV[tier] ?? null;
}

export function priceIdToTier(priceId: string): number | null {
  for (const [tier, id] of Object.entries(TIER_PRICE_ENV)) {
    if (id === priceId) return Number(tier);
  }
  return null;
}
