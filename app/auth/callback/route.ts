import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // OAuth provider sent back an error (e.g. user denied consent)
  if (errorParam) {
    const message = errorDescription ?? errorParam;
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(message)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=missing_code`);
  }

  const cookieStore = cookies();
  const next = searchParams.get('next') ?? cookieStore.get('auth_next')?.value ?? '/dashboard';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('PKCE code exchange failed:', error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Both OAuth (Google) and magic link verify email ownership — mark email_verified in profile
  const admin = getSupabaseAdmin();
  await admin
    .from('profiles')
    .update({ email_verified: true })
    .eq('id', sessionData.user.id)
    .eq('email_verified', false);

  const redirectResponse = NextResponse.redirect(`${siteUrl}${next}`);
  redirectResponse.cookies.set('auth_next', '', { path: '/', maxAge: 0 });
  return redirectResponse;
}
