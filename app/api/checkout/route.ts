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

    const { plan, annual, embedded } = await req.json() as { plan: PlanKey; annual?: boolean; embedded?: boolean };
    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planData = PLANS[plan];
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

    let customerId = profile?.stripe_customer_id ?? null;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        customerId = null;
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const rawUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
    if (!rawUrl.startsWith('http')) {
      console.error('[CHECKOUT] NEXT_PUBLIC_APP_URL is missing or invalid:', process.env.NEXT_PUBLIC_APP_URL);
      return NextResponse.json({ error: 'Server misconfiguration — contact support' }, { status: 500 });
    }
    const returnUrl = `${rawUrl}/dashboard?upgraded=1`;

    if (embedded) {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ui_mode: 'embedded' as any,
        return_url: returnUrl,
        allow_promotion_codes: true,
      });
      console.log('[CHECKOUT] embedded session created | plan:', plan, '| customer:', customerId);
      return NextResponse.json({ clientSecret: session.client_secret });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: returnUrl,
      cancel_url: `${rawUrl}/subscription`,
      allow_promotion_codes: true,
    });

    console.log('[CHECKOUT] redirect session created | plan:', plan, '| customer:', customerId);
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
