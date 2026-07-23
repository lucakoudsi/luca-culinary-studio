import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/get-request-user';
import { createAdminClient } from '@/lib/supabase-admin';
import { createStripeClient, tierToPriceId } from '@/lib/stripe';
import { FEATURES } from '@/config/features';

export const dynamic = 'force-dynamic';

// Erstellt eine Stripe Checkout Session fuer ein Abo-Upgrade und gibt die
// Session-URL zum Redirect zurueck. client_reference_id = Supabase-User-ID
// ist der Schluessel, ueber den der Webhook (checkout.session.completed)
// spaeter die richtige profiles-Zeile findet.
export async function POST(req: NextRequest) {
  // Kaufsperre: solange kein Gewerbe/keine Rechtstexte stehen, hart
  // blockieren -- unabhaengig vom Frontend-Zustand (siehe
  // docs/master-aufgabenliste.md, Warnhinweis ganz oben).
  if (!FEATURES.PAYMENTS_ENABLED) {
    return NextResponse.json({ error: 'Käufe sind derzeit nicht möglich.' }, { status: 403 });
  }

  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const tier = Number(body.tier);
  if (![2, 3, 4].includes(tier)) {
    return NextResponse.json({ error: 'Ungültige Stufe.' }, { status: 400 });
  }

  const priceId = tierToPriceId(tier);
  if (!priceId) {
    return NextResponse.json(
      { error: 'Diese Stufe ist aktuell nicht buchbar (Price-ID fehlt in der Konfiguration).' },
      { status: 500 },
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  const stripe = createStripeClient();
  const origin = req.nextUrl.origin;

  // Bestehenden Stripe-Kunden wiederverwenden, falls schon einmal ein Abo
  // lief -- sonst legt Checkout beim ersten Kauf automatisch einen neuen an.
  const customerParams = profile?.stripe_customer_id
    ? { customer: profile.stripe_customer_id }
    : { customer_email: user.email ?? undefined };

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    ...customerParams,
    success_url: `${origin}/profil?upgrade=success`,
    cancel_url: `${origin}/profil?upgrade=cancelled`,
    // TODO (docs/stripe-plan.md Abschnitt 6): consent_collection.terms_of_service
    // + custom_text.terms_of_service_acceptance.message scharf schalten, sobald
    // der Rechtstext (AGB-Zustimmung + Widerrufsverzicht) und die verlinkte
    // AGB-/Widerrufsbelehrungs-Seite stehen. Blockiert nicht den Testmodus.
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Checkout-Session konnte nicht erstellt werden.' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
