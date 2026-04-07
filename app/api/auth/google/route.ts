import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/auth/callback`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // Build the Supabase OAuth URL directly — no server client needed
  const params = new URLSearchParams({
    provider: 'google',
    redirect_to: redirectTo,
  });

  const oauthUrl = `${supabaseUrl}/auth/v1/authorize?${params.toString()}`;
  return NextResponse.redirect(oauthUrl);
}
