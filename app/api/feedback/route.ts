import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendFeedbackEmail } from '@/lib/resend/emails';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { category, message } = body as { category: string; message: string };

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const fromName  = profile?.full_name || 'Anonymous';
  const fromEmail = profile?.email || user.email || 'unknown';

  try {
    await sendFeedbackEmail({ fromName, fromEmail, category: category || 'General', message: message.trim() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[feedback]', err);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
