import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { PLAN_LIMITS, getPlanFromPriceId } from '@/lib/stripe/plans';
import { sendUpgradeSuccessEmail, sendPaymentFailedEmail } from '@/lib/resend/emails';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session        = event.data.object as Stripe.Checkout.Session;
        const customerId     = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!subscriptionId) break; // one-time payment, not subscription

        // C4+C5: resolve profile ID with one select, check idempotency before touching the DB
        let profileId:    string | null = null;
        let profileEmail: string | null = null;
        let profileName:  string | null = null;

        const { data: existing } = await admin
          .from('profiles')
          .select('id, email, full_name, subscription_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (existing) {
          // C5: already processed — Stripe is retrying, nothing to do
          if (existing.subscription_id === subscriptionId) {
            console.log(`[STRIPE] duplicate checkout event for subscription ${subscriptionId} — skipping`);
            break;
          }
          profileId    = existing.id;
          profileEmail = existing.email   ?? null;
          profileName  = existing.full_name ?? null;
        } else {
          // customer_id not yet stored — fall back to Stripe customer metadata
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          profileId = customer.metadata?.supabase_user_id ?? null;
        }

        if (!profileId) {
          console.error(`[STRIPE] checkout.session.completed — no profile found for customer ${customerId}`);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const plan    = getPlanFromPriceId(priceId);
        if (!PLAN_LIMITS[plan]) {
          console.error(`[STRIPE] Unknown priceId ${priceId} — defaulting to free plan`);
        }

        // C4: single atomic update by primary key
        const { data: updated } = await admin
          .from('profiles')
          .update({
            stripe_customer_id:  customerId,
            subscription_id:     subscriptionId,
            subscription_status: 'active',
            plan,
            videos_limit: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? 1,
          })
          .eq('id', profileId)
          .select('email, full_name');

        profileEmail ??= updated?.[0]?.email   ?? null;
        profileName  ??= updated?.[0]?.full_name ?? null;

        if (profileEmail) {
          await sendUpgradeSuccessEmail(profileEmail, profileName || 'there', plan).catch((err) =>
            console.error('[STRIPE] upgrade email failed:', err)
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub      = event.data.object as Stripe.Subscription;
        const priceId  = sub.items.data[0]?.price.id;
        const plan     = getPlanFromPriceId(priceId);
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        if (isActive && !PLAN_LIMITS[plan]) {
          console.error(`[STRIPE] Unknown priceId ${priceId} on subscription update — defaulting to free`);
        }

        const updateQuery = admin
          .from('profiles')
          .update({
            subscription_status: sub.status,
            plan:         isActive ? plan : 'free',
            videos_limit: isActive ? (PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? 1) : 1,
          })
          .eq('stripe_customer_id', sub.customer as string);

        // R3: only apply if the event is newer than what we last stored to protect
        // against Stripe retries delivering an older event after a newer one
        if (event.created) {
          const eventTs = new Date(event.created * 1000).toISOString();
          await updateQuery.lt('updated_at', eventTs);
        } else {
          await updateQuery;
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await admin
          .from('profiles')
          .update({
            subscription_id:     null,
            subscription_status: 'free',
            plan:                'free',
            videos_limit:        1,
          })
          .eq('stripe_customer_id', sub.customer as string);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        const [{ data: profile }] = await Promise.all([
          admin
            .from('profiles')
            .select('email, full_name')
            .eq('stripe_customer_id', invoice.customer as string)
            .single(),
          admin
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', invoice.customer as string),
        ]);

        if (!profile?.email) {
          console.warn(`[STRIPE] invoice.payment_failed — no profile found for customer ${invoice.customer}`);
          break;
        }

        // let this throw — Stripe will retry the webhook if Resend is down
        await sendPaymentFailedEmail(profile.email, profile.full_name || 'there');
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
