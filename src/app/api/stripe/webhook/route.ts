import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createStripeClient, priceIdToTier } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// Einzige Stelle im gesamten Projekt, die profiles.stufe im Rahmen der
// Stripe-Anbindung schreibt -- egal ob die Aenderung ueber Checkout, das
// Customer Portal oder das Stripe-Dashboard ausgeloest wurde, sie kommt
// immer als Webhook-Event hier an (siehe docs/stripe-plan.md Abschnitt 2).
//
// Schreibt bewusst NUR auf profiles (stufe, stripe_*, subscription_status,
// current_period_end) -- nie auf tellerdesigns oder Storage. Ein Downgrade
// sperrt Zugriff ueber die bestehende Middleware/requireTier-Pruefung, loescht
// aber nichts (siehe docs/stripe-plan.md Abschnitt 5).
async function syncSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient();

  const priceId = sub.items.data[0]?.price.id ?? null;
  const tier = priceId ? priceIdToTier(priceId) : null;
  const isActive = sub.status === 'active' || sub.status === 'trialing';

  // current_period_end sitzt seit der Stripe-API-Version "basil" (2025-03-31)
  // nicht mehr auf der Subscription selbst, sondern auf dem Subscription-Item.
  const periodEndUnix = sub.items.data[0]?.current_period_end ?? null;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  const { error } = await admin
    .from('profiles')
    .update({
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      current_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
      // Faellt die Subscription weg oder die Price-ID ist unbekannt (z.B. ein
      // manuell im Dashboard angelegter Price ohne Env-Mapping): sicherheitshalber
      // auf Free zurueckfallen statt auf der letzten bekannten Stufe zu bleiben.
      stufe: isActive && tier ? tier : 1,
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[stripe/webhook] Profil-Update fehlgeschlagen:', customerId, error.message);
  }
}

export async function POST(req: NextRequest) {
  const stripe = createStripeClient();
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Fehlende Signatur.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[stripe/webhook] Signaturprüfung fehlgeschlagen:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

      if (!userId || !customerId || !subscriptionId) {
        console.error('[stripe/webhook] checkout.session.completed ohne user/customer/subscription:', session.id);
        break;
      }

      // stripe_customer_id zuerst auf die User-Zeile schreiben (ueber die
      // User-ID, die einzige Stelle, an der wir user_id <-> customer_id
      // ueberhaupt verknuepfen koennen) -- syncSubscription() danach findet
      // die Zeile nur noch ueber stripe_customer_id.
      const { error } = await admin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

      if (error) {
        console.error('[stripe/webhook] stripe_customer_id-Zuordnung fehlgeschlagen:', userId, error.message);
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription);
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        await admin.from('profiles').update({ subscription_status: 'past_due' }).eq('stripe_customer_id', customerId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
