# Reeltors.ai — T-Minus 24 Hours Pre-Production Checklist

> **Owner:** Ahmed  
> **Send to:** Shariq before deploy  
> **Environment:** Mac Mini / Sandbox → Live US Production  
> **Target region:** Vercel US-East (iad1), Supabase US-East  

Mark every item ✅ before flipping to production. Do not skip Medium items.

---

## Zone 1 — API & Environment Variable Audit

| # | Item | Risk | Status |
|---|---|---|---|
| 1.1 | **Shotstack env switched to `v1`** — Set `SHOTSTACK_ENV=v1` in Vercel production env. Dev/staging must remain on `stage`. Confirm via `vercel env ls` that production shows `v1`, preview shows `stage`. | 🔴 High | ☐ |
| 1.2 | **Shotstack production API key set** — Replace the sandbox key (`hw0VH04...`) with the production key in Vercel. The `lib/shotstack/client.ts` reads `SHOTSTACK_API_KEY` — there is only one variable, so the key itself must be the production one when `SHOTSTACK_ENV=v1`. | 🔴 High | ☐ |
| 1.3 | **`MOCK_AI` is NOT set in production** — Confirm `MOCK_AI` env var does not exist in Vercel production environment. If set, all renders return a sample clip silently. Run `vercel env ls` and verify it is absent. | 🔴 High | ☐ |
| 1.4 | **fal.ai API key is production-grade** — Log into fal.ai dashboard, confirm `FAL_KEY` in Vercel is the live key (not a test key). Check the key has no expiry date set. | 🔴 High | ☐ |
| 1.5 | **fal.ai credit balance** — Verify sufficient credits for expected Day 1 volume. At ~$1.05/video (3 Kling clips × $0.35 each), 100 signups = ~$105. Ensure minimum $500 balance at launch. | 🔴 High | ☐ |
| 1.6 | **Stripe live keys active** — `STRIPE_SECRET_KEY` starts with `sk_live_` (not `sk_test_`). All 6 `STRIPE_PRICE_*` env vars point to live mode Price IDs, not test mode. | 🔴 High | ☐ |
| 1.7 | **`NEXT_PUBLIC_APP_URL` set to production domain** — Must be `https://reeltors.ai` (no trailing slash). This is used to build Shotstack callback URLs. If wrong, webhooks fire to the wrong URL and videos never complete. | 🔴 High | ☐ |
| 1.8 | **`SUPABASE_SERVICE_ROLE_KEY` is production project key** — Confirm it matches the production Supabase project, not a dev/staging project. | 🔴 High | ☐ |
| 1.9 | **`WEBHOOK_SECRET` set and registered** — Set a strong random string (32+ chars) as `WEBHOOK_SECRET`. Register it in Shotstack dashboard as the callback auth token. Register it in Stripe webhook settings (`whsec_` is separate — this is for Shotstack). | 🟡 Medium | ☐ |
| 1.10 | **`STRIPE_WEBHOOK_SECRET` registered to live URL** — Go to Stripe Dashboard → Webhooks → Add endpoint → `https://reeltors.ai/api/webhooks/stripe`. Copy the `whsec_...` secret to Vercel. Confirm it is NOT a test-mode webhook. | 🔴 High | ☐ |
| 1.11 | **`RESEND_FROM_EMAIL` domain is verified** — `support@reeltors.ai` must have DNS records (SPF, DKIM) verified in Resend dashboard. Unverified domains silently drop emails. | 🟡 Medium | ☐ |
| 1.12 | **No `.env.local` values leaked into git** — Run `git status` and `git log --all -- .env.local` to confirm `.env.local` was never committed. | 🟡 Medium | ☐ |

---

## Zone 2 — The "Persistence" & Storage Bridge

| # | Item | Risk | Status |
|---|---|---|---|
| 2.1 | **Shotstack 24h auto-download is live** — The `downloadAndStoreVideo()` function in `lib/storage.ts` fires inside BOTH `/api/webhooks/shotstack` (webhook path) AND `/api/videos/[id]/status` (polling fallback). Confirm both code paths call it before writing `output_url` to DB. **This is the single most common production breakage point.** | 🔴 High | ☐ |
| 2.2 | **`output-videos` Supabase Storage bucket exists in production** — Log into production Supabase → Storage → confirm `output-videos` bucket exists. If missing, all video storage calls throw silently and fall back to the expiring Shotstack CDN URL. | 🔴 High | ☐ |
| 2.3 | **Storage bucket is Public** — The bucket must be public so `getPublicUrl()` returns a usable URL without signed tokens. Go to Supabase → Storage → `output-videos` → Settings → confirm "Public bucket" is checked. | 🔴 High | ☐ |
| 2.4 | **RLS on `output-videos` bucket** — No public write policy. Only service role (server-side) can upload. Users can only read their own path (`{userId}/`). Confirm in Supabase → Storage → Policies. | 🟡 Medium | ☐ |
| 2.5 | **Tunnel storage path isolated** — Tunnel (anonymous) videos are stored under `tunnel/{sessionId}/`. Confirm this prefix does NOT overlap with user paths `{userId}/`. No cross-contamination between free and paid video storage. | 🟡 Medium | ☐ |
| 2.6 | **Supabase Storage size limits** — Check production Supabase plan storage quota. A 90-second vertical MP4 averages 15–25 MB. 1,000 users × 15 videos = ~375 GB. Upgrade plan if needed before launch. | 🟡 Medium | ☐ |
| 2.7 | **Download timeout is sufficient** — `fetchWithTimeout` in `lib/storage.ts` uses 60s for video, 30s for thumbnail. Shotstack renders can be slow to upload to their CDN after completion. Confirm these timeouts haven't been reduced. | 🟡 Medium | ☐ |

---

## Zone 3 — Abuse & Fraud Funnel

| # | Item | Risk | Status |
|---|---|---|---|
| 3.1 | **FingerprintJS `x-device-fingerprint` header wired up** — Confirm the client sends this header on every request to `/api/videos/generate`. Search codebase for `x-device-fingerprint` in client components. If missing, layer 3 abuse check (device block) is silently skipped. | 🔴 High | ☐ |
| 3.2 | **Disposable email filter active** — Test manually: attempt to generate with `test@mailinator.com`, `test@guerrillamail.com`, `test@tempmail.com`. All must return `403 DISPOSABLE_EMAIL`. The `disposable-email-domains` package must be installed (`npm ls disposable-email-domains`). | 🔴 High | ☐ |
| 3.3 | **`tunnel_sessions` abuse checks firing** — The `runAbuseChecks()` in `lib/tunnel/abuse.ts` checks email uniqueness, IP rate limit (1 per 24h), and device fingerprint (1 per 24h). Verify the `tunnel_sessions` table exists in production Supabase (migration from `supabase/tunnel_migration.sql` applied). | 🔴 High | ☐ |
| 3.4 | **`email_verified` gate enforced for free plan** — In `/api/videos/generate`, line ~102: free users with `email_verified = false` are blocked with `EMAIL_NOT_VERIFIED`. Confirm Google OAuth callback correctly sets `email_verified = true` in production (check `app/auth/callback/route.ts`). | 🔴 High | ☐ |
| 3.5 | **Rate limiting on tunnel upload route** — `POST /api/tunnel/upload` accepts unauthenticated file uploads. Without rate limiting, a bot can fill Supabase Storage. Add Vercel's built-in rate limiting or a simple IP-based counter. **Currently not implemented — must be added before launch.** | 🔴 High | ☐ |
| 3.6 | **Rate limiting on `/api/tunnel/generate`** — A bot can drain fal.ai credits by hitting this endpoint repeatedly with different session tokens. The current abuse check requires email uniqueness but a bot with many email addresses bypasses it. Consider adding a Vercel edge rate limit of 5 req/min per IP. | 🔴 High | ☐ |
| 3.7 | **`free_generation_logs` table exists in production** — Migration `001_abuse_protection.sql` must be applied. This table is required for the IP/fingerprint cross-account checks. If missing, those checks silently return empty results (no block). | 🟡 Medium | ☐ |
| 3.8 | **Blocked tunnel sessions are logged** — Confirm that when `runAbuseChecks` blocks a request, a `tunnel_sessions` record with `status: 'blocked'` is inserted. This provides an audit trail for investigating abuse post-launch. | 🟢 Low | ☐ |

---

## Zone 4 — Database & State Management

| # | Item | Risk | Status |
|---|---|---|---|
| 4.1 | **All 3 migrations applied in production Supabase** — Run in Supabase SQL editor in this order: `tunnel_migration.sql` → `001_abuse_protection.sql` → `002_rename_render_id.sql`. Confirm `render_id` column exists (not `creatomate_render_id`) in both `videos` and `tunnel_sessions` tables. | 🔴 High | ☐ |
| 4.2 | **`handle_new_user` trigger exists** — This DB trigger auto-creates a `profiles` row when a user signs up via Supabase Auth. Without it, the `/api/videos/generate` profile upsert fallback fires on every request, adding latency. Check: `SELECT * FROM pg_trigger WHERE tgname = 'handle_new_user';` | 🔴 High | ☐ |
| 4.3 | **Index on `email` in `tunnel_sessions`** — Exists in `tunnel_migration.sql` as `idx_tunnel_sessions_email`. Confirm it exists in production: `SELECT indexname FROM pg_indexes WHERE tablename = 'tunnel_sessions';` | 🟡 Medium | ☐ |
| 4.4 | **Index on `device_fingerprint` in `tunnel_sessions`** — Same as above (`idx_tunnel_sessions_fingerprint`). Without this, every free trial check does a full table scan. | 🟡 Medium | ☐ |
| 4.5 | **Index on `ip_address` in `tunnel_sessions`** — Same (`idx_tunnel_sessions_ip`). | 🟡 Medium | ☐ |
| 4.6 | **Index on `fingerprint_id` in `free_generation_logs`** — Exists in `001_abuse_protection.sql`. Confirm production. | 🟡 Medium | ☐ |
| 4.7 | **RLS enabled on all sensitive tables** — Confirm RLS is ON for: `profiles`, `videos`, `tunnel_sessions`, `email_verifications`, `free_generation_logs`. Run: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` | 🔴 High | ☐ |
| 4.8 | **Cron job registered in Vercel** — `/api/cron/reset-usage` must be registered as a Vercel Cron job (in `vercel.json` or project settings) to fire on the 1st of each month. Without it, `videos_used_this_month` never resets and all paid users hit their limit permanently after month 1. | 🔴 High | ☐ |
| 4.9 | **Supabase Realtime enabled on `videos` table** — Go to Supabase → Database → Replication → confirm `videos` table is in the publication. Required for the dashboard's live status updates. | 🟡 Medium | ☐ |

---

## Zone 5 — User Experience & Mobile Optimization

| # | Item | Risk | Status |
|---|---|---|---|
| 5.1 | **iPhone Safari autoplay** — The result video uses `muted` + `playsInline` + `autoPlay`. Test on iPhone 14/15 Safari. iOS blocks autoplay without `muted`. Confirm `StepResult.tsx` video element has all three attributes. | 🔴 High | ☐ |
| 5.2 | **Android Chrome video playback** — Test MP4 H.264 playback on Chrome Android. Shotstack outputs H.264 MP4 by default — confirm this hasn't changed in Shotstack settings. | 🟡 Medium | ☐ |
| 5.3 | **9:16 vertical video displays correctly on mobile** — The video player in `StepResult.tsx` uses `maxHeight: '70vh'`. On a 390px wide iPhone, a 9:16 video at full width is 693px tall — confirm it doesn't overflow the viewport before the download button. | 🟡 Medium | ☐ |
| 5.4 | **Loading state messaging is clear** — `StepGenerating.tsx` cycles through 7 messages over 80 seconds and shows a percentage bar. Confirm the copy reads naturally and doesn't show "0% complete" for more than 2 seconds. | 🟢 Low | ☐ |
| 5.5 | **Polling hard timeout is 10 minutes** — `MAX_POLL_DURATION_MS = 10 * 60 * 1000` is set in `StepGenerating.tsx`. Confirm this exists so a stuck render doesn't loop forever. | 🟡 Medium | ☐ |
| 5.6 | **6 consecutive poll errors trigger failure screen** — `MAX_CONSECUTIVE_ERRORS = 6` in `StepGenerating.tsx`. The failure screen shows a "Try Again" button that reloads the flow. Confirm this doesn't reset `tunnelPending` prematurely. | 🟡 Medium | ☐ |
| 5.7 | **Upsell card slides up after 5 seconds on result screen** — `StepResult.tsx` uses a `setTimeout(5000)`. Test on a real device that the animation fires and the "Get 15 Videos/Month — $49" CTA is visible without scrolling. | 🟢 Low | ☐ |
| 5.8 | **Download works on iOS Safari** — The `handleDownload` function uses `<a download>`. iOS Safari does not honour the `download` attribute for cross-origin URLs. Since the video URL is a Supabase CDN URL (different domain), it will open in a new tab instead of downloading. This is a known iOS limitation — add a note to the UI: "Tap and hold → Save Video" as a fallback. | 🟡 Medium | ☐ |

---

## Zone 6 — Financial & Quota Monitoring

| # | Item | Risk | Status |
|---|---|---|---|
| 6.1 | **fal.ai balance alert set** — Log into fal.ai dashboard → Billing → set an email alert at $100 remaining balance. At $0.35/clip × 3 clips = $1.05/video, $100 buys ~95 videos. | 🔴 High | ☐ |
| 6.2 | **fal.ai auto-top-up enabled** — Enable auto-top-up at $50 remaining, top up by $500. This prevents the AI generation from going dark during a traffic spike. | 🔴 High | ☐ |
| 6.3 | **Shotstack credit/balance alert** — Set a Shotstack billing alert at 20% remaining credits. Production renders cost more than sandbox — recalculate expected cost per render on `v1`. | 🔴 High | ☐ |
| 6.4 | **Vercel spending limit set** — Go to Vercel → Billing → set a spend cap to prevent runaway function invocations from bots draining the account. Recommended: 2× expected monthly cost as the cap. | 🟡 Medium | ☐ |
| 6.5 | **Supabase plan can handle launch traffic** — Free Supabase plan has 500 MB DB and 1 GB storage. On paid plan, confirm database and storage limits are well above Day 1 projections. | 🟡 Medium | ☐ |
| 6.6 | **Stripe test mode is OFF** — Confirm Stripe dashboard is in Live mode (orange "Test" badge should not be visible). Make a real $1 test purchase to confirm checkout flow end-to-end. | 🔴 High | ☐ |
| 6.7 | **Admin dashboard monitoring** — `/admin` shows real-time counts of users, videos generated, and revenue. Confirm the admin account (you) can access `/admin` on production. Set a bookmark. | 🟢 Low | ☐ |
| 6.8 | **Vercel function logs accessible** — Confirm you can run `vercel logs https://reeltors.ai --follow` and see live function invocations. This is your primary debug tool on Day 1. | 🟢 Low | ☐ |

---

## Zone 7 — Creatomate Deletion (Legacy Cleanup)

| # | Item | Risk | Status |
|---|---|---|---|
| 7.1 | **`lib/creatomate/` directory deleted** — Both `client.ts` and `templates.ts` are deleted. Confirm: `ls lib/creatomate/` returns "No such file." If present, they add dead bundle weight and confuse future devs. | 🟡 Medium | ☐ |
| 7.2 | **`app/api/webhooks/creatomate/route.ts` deleted** — Confirm this file does not exist. An active route at this path would accept unauthenticated POST requests from anyone, a security surface with no upside. | 🟡 Medium | ☐ |
| 7.3 | **No `CREATOMATE_*` env vars in Vercel** — Run `vercel env ls` and confirm zero variables starting with `CREATOMATE_`. Remove any found. | 🟡 Medium | ☐ |
| 7.4 | **`creatomate` not in `package.json` dependencies** — Run `grep -i creatomate package.json`. Should return nothing. If the npm package is still listed, run `npm uninstall @creatomate/creatomate` and commit. | 🟡 Medium | ☐ |
| 7.5 | **No `creatomate_render_id` column references in code** — Run `grep -r "creatomate_render_id" --include="*.ts" --include="*.tsx" .` (excluding `node_modules`). Should return zero results. Migration `002_rename_render_id.sql` must be applied in production Supabase. | 🔴 High | ☐ |
| 7.6 | **`CREATOMATE_TEMPLATE_CINEMATIC` Vercel env var removed** — This was added as a placeholder. It is not used by any code. Remove to prevent confusion. | 🟢 Low | ☐ |
| 7.7 | **No Creatomate references in `app/privacy/page.tsx`** — The privacy page vendor list should reference "Shotstack" not "Creatomate." Run `grep -i creatomate app/privacy/page.tsx`. | 🟢 Low | ☐ |

---

## Pre-Launch Final Verification (Run These Commands)

```bash
# 1. Confirm no Creatomate remnants
grep -r "creatomate" . --include="*.ts" --include="*.tsx" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=.next -i

# 2. Confirm MOCK_AI is not set in production
vercel env ls | grep MOCK_AI  # should return nothing

# 3. Confirm Shotstack env is v1 in production
vercel env ls | grep SHOTSTACK

# 4. Run full test suite — all 54 must pass
npm test

# 5. Production build must compile clean
npm run build

# 6. Confirm render_id column exists (run in Supabase SQL editor)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'videos' AND column_name = 'render_id';

# 7. Confirm all indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename IN ('tunnel_sessions', 'free_generation_logs');
```

---

## Sign-Off

| Role | Name | Confirmed | Date |
|---|---|---|---|
| Founder | Ahmed | ☐ | |
| Technical Lead | Shariq | ☐ | |

> **Do not deploy to production until both boxes are checked.**
