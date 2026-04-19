import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateOtp, hashOtp } from '@/lib/abuse/otp';
import { isDisposableEmail } from '@/lib/abuse/email';
import { sendOtpEmail } from '@/lib/resend/emails';
import { rateLimit, getIp } from '@/lib/rate-limit';

const OTP_EXPIRY_MINUTES = 10;
const MAX_SENDS_PER_HOUR = 3;

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(`send-otp:${getIp(req)}`, 5, 15 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = user.email;
  if (!email) {
    return NextResponse.json({ error: 'No email on account' }, { status: 400 });
  }

  if (isDisposableEmail(email)) {
    return NextResponse.json(
      { error: 'Disposable email addresses are not allowed.', code: 'DISPOSABLE_EMAIL' },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await admin
    .from('email_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', oneHourAgo);

  if ((count ?? 0) >= MAX_SENDS_PER_HOUR) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in an hour.', code: 'RATE_LIMITED' },
      { status: 429 },
    );
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const { error: insertError } = await admin
    .from('email_verifications')
    .insert({ email, code_hash: hashOtp(otp), expires_at: expiresAt });

  if (insertError) {
    console.error('Failed to store OTP:', insertError);
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }

  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
