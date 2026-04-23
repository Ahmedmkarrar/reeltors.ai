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
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId     = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!subscriptionId) break; // one-time payment, not subscription

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const plan    = getPlanFromPriceId(priceId);
        if (!PLAN_LIMITS[plan]) {
          console.error(`[STRIPE] Unknown priceId ${priceId} — defaulting to free plan`);
        }

        const payload = {
          stripe_customer_id:  customerId,
          subscription_id:     subscriptionId,
          subscription_status: 'active',
          plan,
          videos_limit: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? 1,
        };

        // look up by stripe_customer_id first; fall back to Stripe customer metadata
        const { data: updated } = await admin
          .from('profiles')
          .update(payload)
          .eq('stripe_customer_id', customerId)
          .select('id, email, full_name');

        let profileEmail: string | null = null;
        let profileName:  string | null = null;

        if (updated?.length) {
          profileEmail = updated[0].email ?? null;
          profileName  = updated[0].full_name ?? null;
        } else {
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          const supabaseUserId = customer.metadata?.supabase_user_id;
          if (supabaseUserId) {
            const { data: fallback } = await admin
              .from('profiles')
              .update(payload)
              .eq('id', supabaseUserId)
              .select('email, full_name');
            profileEmail = fallback?.[0]?.email ?? null;
            profileName  = fallback?.[0]?.full_name ?? null;
          }
        }

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

        await admin
          .from('profiles')
          .update({
            subscription_status: sub.status,
            plan:         isActive ? plan : 'free',
            videos_limit: isActive ? (PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? 1) : 1,
          })
          .eq('stripe_customer_id', sub.customer as string);
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
