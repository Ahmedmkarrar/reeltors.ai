import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { PLAN_LIMITS } from '@/lib/stripe/plans';
import { sendPaymentFailedEmail } from '@/lib/resend/emails';
import type Stripe from 'stripe';

function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_TEAM) return 'team';
  return 'free';
}

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

        // Look up by stripe_customer_id (set during checkout session creation)
        // Fall back to customer metadata.supabase_user_id if not yet saved
        let updateQuery = admin
          .from('profiles')
          .update({
            stripe_customer_id:   customerId,
            subscription_id:      subscriptionId,
            subscription_status:  'active',
            plan,
            videos_limit: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? 1,
          })
          .eq('stripe_customer_id', customerId);

        const { count } = await (updateQuery as any).select('id', { count: 'exact' });

        // If no row matched (customer_id not yet written), fall back to user metadata
        if (!count) {
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          const supabaseUserId = customer.metadata?.supabase_user_id;
          if (supabaseUserId) {
            await admin
              .from('profiles')
              .update({
                stripe_customer_id:  customerId,
                subscription_id:     subscriptionId,
                subscription_status: 'active',
                plan,
                videos_limit: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? 1,
              })
              .eq('id', supabaseUserId);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub     = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id;
        const plan    = getPlanFromPriceId(priceId);
        const isActive = sub.status === 'active' || sub.status === 'trialing';

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
        const { data: profile } = await admin
          .from('profiles')
          .select('email, full_name')
          .eq('stripe_customer_id', invoice.customer as string)
          .single();

        if (profile?.email) {
          await sendPaymentFailedEmail(profile.email, profile.full_name || 'there').catch(console.error);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
