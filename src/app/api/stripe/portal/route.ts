import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/get-request-user';
import { createAdminClient } from '@/lib/supabase-admin';
import { createStripeClient } from '@/lib/stripe';
import { FEATURES } from '@/config/features';

export const dynamic = 'force-dynamic';

// Erstellt eine Stripe Billing-Portal-Session fuer Kuendigung, Zahlungsmethode
// aendern, Rechnungen einsehen. Aenderungen von dort kommen ueber dieselben
// Webhook-Events zurueck wie Checkout (siehe /api/stripe/webhook) -- diese
// Route selbst schreibt nichts auf profiles.
export async function POST(req: NextRequest) {
  // Kaufsperre: Portal setzt einen bestehenden zahlenden Kunden voraus, den
  // es unter der aktuellen Rechtslage nicht geben duerfte -- ausserdem ist
  // unklar, ob die Stripe-Dashboard-Portal-Konfiguration Plan-Wechsel
  // erlaubt. Aus Vorsicht gleiche Sperre wie Checkout.
  if (!FEATURES.PAYMENTS_ENABLED) {
    return NextResponse.json({ error: 'Die Abo-Verwaltung ist derzeit nicht verfügbar.' }, { status: 403 });
  }

  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'Kein aktives Abo gefunden.' }, { status: 400 });
  }

  const stripe = createStripeClient();
  const origin = req.nextUrl.origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/profil`,
  });

  return NextResponse.json({ url: session.url });
}
