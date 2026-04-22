import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const REQUIRED_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

export async function GET() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return NextResponse.json({ ok: false, error: `Missing env vars: ${missing.join(', ')}` }, { status: 500 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
      httpClient: Stripe.createFetchHttpClient(),
    });
    await stripe.balance.retrieve();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe connectivity check failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
