import { getSupabaseAdmin } from '@/lib/supabase/admin';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const disposableDomains: string[] = require('disposable-email-domains');
const DISPOSABLE_DOMAINS = new Set(disposableDomains);

const MAX_SESSIONS_PER_IP = 1;
const MAX_SESSIONS_PER_FINGERPRINT = 1;
const RATE_LIMIT_WINDOW_HOURS = 24;

export interface AbuseCheckResult {
  isBlocked: boolean;
  reason?: string;
}

export async function runAbuseChecks(opts: {
  email: string;
  ipAddress: string;
  deviceFingerprint: string;
}): Promise<AbuseCheckResult> {
  const { email, ipAddress, deviceFingerprint } = opts;
  const admin = getSupabaseAdmin();
  const normalizedEmail = email.trim().toLowerCase();

  const domain = normalizedEmail.split('@')[1];
  if (!domain || DISPOSABLE_DOMAINS.has(domain)) {
    return { isBlocked: true, reason: 'disposable_email' };
  }

  // exclude blocked + failed so a render failure doesn't permanently lock the email
  const { count: emailCount } = await admin
    .from('tunnel_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('email', normalizedEmail)
    .not('status', 'in', '("blocked","failed")');

  if ((emailCount ?? 0) > 0) {
    return { isBlocked: true, reason: 'email_already_used' };
  }

  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();

  // skip IP check when the IP is unknown (avoids false shared-bucket collisions)
  if (ipAddress !== 'unknown' && ipAddress !== '0.0.0.0') {
    const { count: ipCount } = await admin
      .from('tunnel_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .gte('created_at', windowStart)
      .not('status', 'in', '("blocked","failed")');

    if ((ipCount ?? 0) >= MAX_SESSIONS_PER_IP) {
      return { isBlocked: true, reason: 'ip_rate_limit' };
    }
  }

  const { count: fpCount } = await admin
    .from('tunnel_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('device_fingerprint', deviceFingerprint)
    .gte('created_at', windowStart)
    .not('status', 'in', '("blocked","failed")');

  if ((fpCount ?? 0) >= MAX_SESSIONS_PER_FINGERPRINT) {
    return { isBlocked: true, reason: 'device_rate_limit' };
  }

  return { isBlocked: false };
}

export function getAbuseBlockMessage(reason: string): string {
  const messages: Record<string, string> = {
    disposable_email:   'Please use a real email — we\'ll send your video there.',
    email_already_used: 'This email already has a free video. Sign in to create more.',
    ip_rate_limit:      'Too many free videos from your network. Sign up for unlimited access.',
    device_rate_limit:  'Too many free videos from this device. Sign up for unlimited access.',
  };
  return messages[reason] ?? 'Unable to generate video. Please try again later.';
}
