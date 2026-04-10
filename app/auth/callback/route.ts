import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const cookieStore = cookies();
  const next = searchParams.get('next') ?? cookieStore.get('auth_next')?.value ?? '/dashboard';

  if (code) {
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
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // OAuth providers (Google) verify email ownership — mark email_verified in profile
      const provider = sessionData?.user?.app_metadata?.provider;
      if (provider && provider !== 'email') {
        const admin = getSupabaseAdmin();
        await admin
          .from('profiles')
          .update({ email_verified: true })
          .eq('id', sessionData.user.id)
          .eq('email_verified', false);
      }

      const redirectResponse = NextResponse.redirect(`${origin}${next}`);
      // clear the one-shot cookie
      redirectResponse.cookies.set('auth_next', '', { path: '/', maxAge: 0 });
      return redirectResponse;
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
