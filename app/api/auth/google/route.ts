import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error || !data.url) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message ?? 'OAuth failed')}`);
  }

  return NextResponse.redirect(data.url);
}
