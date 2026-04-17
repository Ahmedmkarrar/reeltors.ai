import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { rateLimit } from '@/lib/rate-limit';
import { PLANS } from '@/lib/stripe/plans';
import type { PlanKey } from '@/lib/stripe/plans';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { allowed } = rateLimit(`checkout:${user.id}`, 5, 60 * 60 * 1000);
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
    const appUrl = rawUrl.startsWith('http') ? rawUrl : 'https://reeltors.ai';
    const returnUrl = `${appUrl}/dashboard?upgraded=1`;
    console.log('[CHECKOUT] appUrl:', appUrl, '| returnUrl:', returnUrl, '| plan:', plan, '| priceId:', priceId);

    if (embedded) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = await (stripe.checkout.sessions.create as any)({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        ui_mode: 'embedded',
        return_url: returnUrl,
        allow_promotion_codes: true,
      }) as { client_secret: string };
      return NextResponse.json({ clientSecret: session.client_secret });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: returnUrl,
      cancel_url: `${appUrl}/subscription`,
      allow_promotion_codes: true,
    });

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
