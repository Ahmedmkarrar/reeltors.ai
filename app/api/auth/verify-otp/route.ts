import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hashOtp } from '@/lib/abuse/otp';
import { rateLimit, getIp } from '@/lib/rate-limit';

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(`verify-otp:${getIp(req)}`, 10, 10 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let code: string;
  try {
    ({ code } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Code must be a 6-digit number' }, { status: 400 });
  }

  const email = user.email!;
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: verification } = await admin
    .from('email_verifications')
    .select('id, code_hash, attempts')
    .eq('email', email)
    .is('used_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!verification) {
    return NextResponse.json(
      { error: 'No active code found. Request a new one.', code: 'NOT_FOUND' },
      { status: 400 },
    );
  }

  if ((verification.attempts ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many incorrect attempts. Request a new code.', code: 'MAX_ATTEMPTS' },
      { status: 400 },
    );
  }

  const storedHash = Buffer.from(verification.code_hash);
  const inputHash  = Buffer.from(hashOtp(code));
  const isMatch    = storedHash.length === inputHash.length && timingSafeEqual(storedHash, inputHash);

  if (!isMatch) {
    await admin
      .from('email_verifications')
      .update({ attempts: (verification.attempts ?? 0) + 1 })
      .eq('id', verification.id);

    return NextResponse.json({ error: 'Incorrect code', code: 'INVALID_CODE' }, { status: 400 });
  }

  await Promise.all([
    admin
      .from('email_verifications')
      .update({ used_at: now })
      .eq('id', verification.id),
    admin
      .from('profiles')
      .update({ email_verified: true, updated_at: now })
      .eq('id', user.id),
  ]);

  return NextResponse.json({ success: true });
}
