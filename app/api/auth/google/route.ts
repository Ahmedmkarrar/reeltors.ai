import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const next = searchParams.get('next') ?? '/dashboard';

  // redirect_to must exactly match an entry in Supabase → Auth → URL Configuration.
  // Pass `next` via a short-lived cookie instead of a query param so the base URL stays clean.
  const redirectTo = `${origin}/auth/callback`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const params = new URLSearchParams({
    provider: 'google',
    redirect_to: redirectTo,
  });

  const oauthUrl = `${supabaseUrl}/auth/v1/authorize?${params.toString()}`;
  const response = NextResponse.redirect(oauthUrl);

  // 10-minute cookie — callback reads this to know where to send the user
  response.cookies.set('auth_next', next, {
    path: '/',
    maxAge: 600,
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}
