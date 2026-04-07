import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';

export async function POST() {
  const results: Record<string, unknown> = {};

  // Test 1: direct fetch to Stripe API (bypasses SDK)
  try {
    const key = process.env.STRIPE_SECRET_KEY!;
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    results.fetch_status = res.status;
    results.fetch_ok = res.ok;
    if (res.ok) {
      const body = await res.json() as { available?: { currency: string }[] };
      results.fetch_currency = body.available?.[0]?.currency;
    } else {
      results.fetch_body = await res.text();
    }
  } catch (e) { results.fetch_error = e instanceof Error ? e.message : String(e); }

  // Test 2: Stripe SDK balance
  try {
    const stripe = getStripe();
    const balance = await stripe.balance.retrieve();
    results.sdk_balance = balance.available[0]?.currency;
  } catch (e) { results.sdk_error = e instanceof Error ? e.message : String(e); }

  // Test 3: key present
  results.key_prefix = process.env.STRIPE_SECRET_KEY?.slice(0, 12) ?? 'missing';

  return NextResponse.json(results);
}

export async function GET() {
  return POST();
}
