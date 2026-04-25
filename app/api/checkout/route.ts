import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { rateLimit } from '@/lib/rate-limit';
import { PLANS, validateStripePriceEnvVars } from '@/lib/stripe/plans';
import type { PlanKey } from '@/lib/stripe/plans';

validateStripePriceEnvVars();

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { allowed } = await rateLimit(`checkout:${user.id}`, 20, 60 * 60 * 1000);
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await req.json() as { plan: unknown; annual?: unknown; embedded?: unknown };
    const { plan } = body;
    const annual   = body.annual   === true;
    const embedded = body.embedded === true;

    if (!plan || typeof plan !== 'string' || !(plan in PLANS)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    const planData = PLANS[plan as PlanKey];
    const priceId = annual ? planData.stripePriceIdAnnual : planData.stripePriceId;
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured for this plan' }, { status: 400 });
    }

    // Initialize Stripe early, before any more Supabase calls
    const stripe = getStripe();

    // Use admin client for profile lookup to avoid cookie-client connection interference
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id ?? null;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        customerId = null;
      }
    }

    if (!customerId) {
      // H3: use Stripe idempotency key so concurrent tabs can't create two customers
      const customer = await stripe.customers.create(
        { email: profile.email || user.email || undefined, metadata: { supabase_user_id: user.id } },
        { idempotencyKey: `create_customer_${user.id}` },
      );
      customerId = customer.id;

      // only write if stripe_customer_id is still null — handles the concurrent-write race
      const { data: written } = await admin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
        .is('stripe_customer_id', null)
        .select('stripe_customer_id');

      if (!written?.length) {
        // another request already wrote a customer_id; use that one instead
        const { data: fresh } = await admin
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single();
        customerId = fresh?.stripe_customer_id ?? customerId;
      }
    }

    const rawUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
    if (!rawUrl.startsWith('http')) {
      console.error('[CHECKOUT] NEXT_PUBLIC_APP_URL is missing or invalid:', process.env.NEXT_PUBLIC_APP_URL);
      return NextResponse.json({ error: 'Server misconfiguration — contact support' }, { status: 500 });
    }
    const returnUrl = `${rawUrl}/dashboard?upgraded=1`;

    // R1: idempotency key scoped to user+plan+billing-cycle (5-minute window) to prevent
    // double-click from creating multiple sessions while still allowing retries after failures
    const idempotencyWindow = Math.floor(Date.now() / 300_000);
    const sessionIdempotencyKey = `checkout_session_${user.id}_${plan}_${annual}_${idempotencyWindow}`;

    if (embedded) {
      const session = await stripe.checkout.sessions.create(
        {
          customer: customerId,
          mode: 'subscription',
          line_items: [{ price: priceId, quantity: 1 }],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ui_mode: 'embedded' as any,
          return_url: returnUrl,
          allow_promotion_codes: true,
        },
        { idempotencyKey: `${sessionIdempotencyKey}_embedded` },
      );
      console.log('[CHECKOUT] embedded session created');
      return NextResponse.json({ clientSecret: session.client_secret });
    }

    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: returnUrl,
        cancel_url: `${rawUrl}/subscription?checkout_cancelled=1`, // rawUrl is validated against NEXT_PUBLIC_APP_URL above — not user-supplied
        allow_promotion_codes: true,
      },
      { idempotencyKey: `${sessionIdempotencyKey}_redirect` },
    );

    console.log('[CHECKOUT] redirect session created');
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[CHECKOUT_ERROR]', err);
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: `[${err.type}] ${err.message}` }, { status: err.statusCode ?? 500 });
    }
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
