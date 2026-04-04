import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/resend/emails';

export async function POST(_req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const email = profile?.email || user.email;
    if (!email) {
      return NextResponse.json({ error: 'No email on account' }, { status: 400 });
    }

    await sendWelcomeEmail(email, profile?.full_name || 'there');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to send welcome email for user:', user.id, err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
