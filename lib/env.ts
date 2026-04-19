// Server-side environment variable validation.
// Called once at startup via instrumentation.ts — bad deploys fail immediately
// with a clear message instead of silently erroring on the first user request.

const REQUIRED: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL:      'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anon key',
  SUPABASE_SERVICE_ROLE_KEY:     'Supabase service role key (admin operations)',
  WEBHOOK_SECRET:                'Shared secret between generate → process routes',
  SHOTSTACK_API_KEY:             'Shotstack API key (video rendering)',
  BACKEND_URL:                   'Internal URL used by generate route to call process route',
  STRIPE_SECRET_KEY:             'Stripe secret key',
  STRIPE_WEBHOOK_SECRET:         'Stripe webhook signing secret',
  RESEND_API_KEY:                'Resend API key (transactional email)',
  RESEND_FROM_EMAIL:             'From address for outbound emails',
};

const OPTIONAL: Record<string, string> = {
  FAL_KEY:                'fal.ai key — AI drone shots skipped when absent',
  REDIS_URL:              'Redis URL — rate limiting falls back to in-memory when absent',
  SHOTSTACK_PROD_API_KEY: 'Shotstack production API key — falls back to stage key when absent',
  SHOTSTACK_PROD_ENV:     'Shotstack production env — falls back to stage when absent',
  SHOTSTACK_ENV:          'Shotstack env override (defaults to stage)',
  CRON_SECRET:            'Cron job auth secret',
  ADMIN_EMAIL:            'Admin notification email',
};

export function validateEnv(): void {
  const missing = Object.entries(REQUIRED)
    .filter(([key]) => !process.env[key]?.trim())
    .map(([key, description]) => `  ${key} — ${description}`);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      'Copy .env.local.example to .env.local and fill in the missing values.',
    );
  }

  const absentOptional = Object.keys(OPTIONAL).filter((key) => !process.env[key]?.trim());
  if (absentOptional.length > 0) {
    console.info(
      `[env] Optional vars not set (features will degrade gracefully): ${absentOptional.join(', ')}`,
    );
  }
}
