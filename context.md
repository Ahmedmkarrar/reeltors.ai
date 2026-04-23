# ReeltorsAI — Session Context

## Project Overview

Real estate video generation SaaS. Agents upload listing photos → AI generates cinematic
videos via fal.ai (drone shots via Kling v1.6) + Shotstack (timeline-based rendering).
Stripe subscriptions, Supabase auth/DB/storage, hosted on Coolify (DigitalOcean, 2vCPU/4GB RAM).
Fully off Vercel. Express worker on port 4000, Next.js on port 3000, both Docker containers.
Redis for BullMQ and rate limiting.

---

## Previous Session (before this chat)

Updated `docs/DEVELOPER_WIKI.md` — added `/api/health` and `/api/cron/expire-videos` to the
API routes table, fixed a stale "Vercel" reference in the Mac Mini section.

Fixed a series of paid user / upgrade flow bugs:

- `generate/route.ts` — removed stale `isUnlimited` check that skipped limit enforcement for
  pro and team plan users. Switched `??` to `||` so `videos_limit = 0` falls back to
  `PLAN_LIMITS[plan]`.
- `dashboard/page.tsx` — removed the same `isUnlimited` bypass.
- `subscription/page.tsx` — `??` → `||` fix on videoLimit fallback.
- `Sidebar.tsx` — same `??` → `||` fix on the sidebar usage bar.
- `UploadZone.tsx` — AI drone shot bolt disabled until plan loads to prevent free-user paywall
  flash on a paying user.
- `PaywallModal.tsx` — modal now only shows plans strictly above the user's current tier.
  Added `?upgraded=1` handling: success toast + param cleanup after Stripe redirect.
- `tests/usage-limits.test.ts` — replaced tests asserting old buggy behavior with correct
  tests: pro user within cap → 202, pro user at cap → 403.

All committed one at a time to branch `fix/paid-user-plan-gating`, pushed to remote.

---

## This Session — Bug Fixes

### Already Fixed Before This Session
- **C1** — `isUnlimited` was already removed from `dashboard/page.tsx`.
- **H2** — Checkout loading state (`checkoutLoading`) already existed in `account/page.tsx`
  and `subscription/page.tsx`.
- **H1** — `annual` is correctly captured into `checkoutPlan` at click time and passed as a
  prop to `EmbeddedCheckout`. Not actually a bug.
- **M3** — `PaywallModal` already reads `?upgraded=1`, shows success toast, and cleans the param.

---

### CRITICAL fixes — committed directly to `main`

**C2** (`lib/resend/emails.ts`, `app/api/webhooks/stripe/route.ts`)
Added `sendUpgradeSuccessEmail` function. Wired it into `checkout.session.completed` webhook
handler so users receive a confirmation email after a successful upgrade. Email fetched from
the updated profile row; errors caught so a Resend failure doesn't fail the webhook.

**C3** (`app/api/webhooks/stripe/route.ts`)
`invoice.payment_failed` was only sending an email but never updating the DB. Added a
parallel `update({ subscription_status: 'past_due' })` call alongside the email send.

---

### CRITICAL fixes — branch `fix/critical-bugs`

**C4 + C5** (`app/api/webhooks/stripe/route.ts`, `tests/billing.test.ts`)

C4 — Two sequential update paths (`by stripe_customer_id`, then fallback `by user id`) could
leave profiles in partial state on a crash. Refactored: single `select` resolves the profile
ID first, then one atomic `update` by primary key.

C5 — No idempotency guard meant Stripe retries would double-upgrade and send duplicate emails.
Added a check: if `profile.subscription_id === subscriptionId` the event was already processed
— skip with 200. Billing tests updated to use the new select-first flow; added a dedicated
duplicate-skip test.

---

### HIGH fixes — branch `fix/high-bugs`

**H3** (`app/api/checkout/route.ts`)
Two concurrent tabs could both see `stripe_customer_id = null` and each create a separate
Stripe customer. Fixed with a Stripe idempotency key per user (`create_customer_{userId}`) and
a conditional DB write (`WHERE stripe_customer_id IS NULL`). If another request already wrote,
the fresh value is re-fetched instead of overwriting.

**H4** (`app/(dashboard)/account/page.tsx`, `app/(dashboard)/subscription/page.tsx`)
`subscription_status` values `past_due`, `canceled`, and `trialing` were never shown to users.
Added status banners to both pages:
- `past_due` — red banner with a "Fix now →" link directly to the Stripe billing portal.
- `canceled` — neutral banner prompting the user to choose a new plan.
- `trialing` — green informational banner explaining the trial will end.

**H5** (`app/api/billing/portal/route.ts`)
`stripe.customers.create` was called with `profile.email` directly, no validation. A null or
malformed email produced a confusing Stripe error. Added a regex check before the Stripe call;
returns a clear 400 `"Account has no valid email address"` if invalid.

---

### MEDIUM fixes — branch `fix/medium-bugs`

**M2** (`app/api/checkout/route.ts`)
Hardcoded `'https://reeltors.ai'` fallback when `NEXT_PUBLIC_APP_URL` was missing. Replaced
with an explicit error log and 500 response so misconfiguration is immediately visible.

**M4** (`lib/stripe/client.ts`)
No timeout on Stripe API calls. Added `timeout: 10000` (10 seconds) to the Stripe client.

**M5** (`lib/stripe/plans.ts`, `app/api/checkout/route.ts`)
Missing price ID env vars caused obscure errors with no indication of which variable was
missing. Added `validateStripePriceEnvVars()` that logs all missing keys. Called at module
load time in the checkout route so it surfaces on first request.

**M6** (`app/api/checkout/route.ts`)
No success logs after Stripe session creation. Added `console.log` after both embedded and
redirect session paths.

**M7** (`app/api/checkout/route.ts`)
Rate limit was 5 checkout attempts per hour — too low for a user retrying after a failed
payment or switching plans. Raised to 20 per hour.

**M8** (`lib/supabase/middleware.ts`)
`/account` and `/subscription` were missing from `isProtectedRoute`, allowing unauthenticated
access. Both routes added to the protected list.

---

## Pending Work

- `react-beautiful-dnd` is in `package.json` but never imported — needs
  `npm uninstall react-beautiful-dnd @types/react-beautiful-dnd`
- `/api/cron/expire-videos` is not scheduled in Coolify yet — do after full domain migration
- Full domain migration off Vercel still pending
- Known edge cases not yet addressed: upload timeout orphans, realtime disconnect double charge,
  payment webhook delay showing wrong plan, Google OAuth after uploads losing photos, concurrent
  session confusion for paying users, 3DS cancellation hanging Stripe session, stuck "processing"
  video card with no explanation
