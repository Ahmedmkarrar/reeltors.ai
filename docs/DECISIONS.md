# Architecture Decisions

Major calls made during the project — what changed, why, and what to never undo.

---

| Date | Decision | Reason |
|---|---|---|
| 2026-04-20 | Redis: Upstash → self-hosted on Coolify | Upstash free tier (500K commands/month) burned through in 2 days. Rate limiting is write-heavy by design (2 Redis commands per request). Self-hosted Redis on the same Coolify droplet has no command limits and costs nothing extra. |
| 2026-04 | Hosting: Vercel → Coolify (self-hosted Docker) | Full move off Vercel. Both Next.js (port 3000) and Express worker (port 4000) run as Docker containers on Coolify. All env vars managed in Coolify dashboard. |
| 2026-04 | Video renderer: Creatomate → Shotstack | Creatomate charged per render at a fixed rate with poor margins at scale. Also required maintaining template UUIDs in an external dashboard. Shotstack uses a JSON timeline spec at render time — no external state to maintain. **Do not go back to Creatomate or any template-UUID-based renderer.** |
| 2026-04 | AI video generation: fal.ai (Kling v1.6 Standard) | Generates 5-second cinematic drone-shot clips from static listing photos. Up to 3 clips per video, run in parallel via fal.ai queue REST API (no SDK). Falls back to static images if fal.ai fails. |
| 2026-04 | Background jobs: BullMQ + Redis (Express worker) | Video pipeline work runs in a dedicated Express server on port 4000. BullMQ uses the same self-hosted Redis instance as rate limiting. Keeps long-running work off the Next.js process. |
| 2026-04 | Free trial tunnel: unauthenticated `/generate` route | Lets realtors try the product before signing up. Enforces a strict 1-video-per-person limit via a 6-layer abuse stack (disposable email → email_verified → fingerprint → IP → quota → concurrent session). |
| 2026-04 | Auth: Google OAuth + email magic link (Supabase Auth) | Google OAuth auto-sets `email_verified = true` — no OTP needed. Magic link users must complete OTP verification before generating. Keeps the free-tier abuse funnel tight. |
| 2026-04 | 24-hour rule: always download Shotstack CDN to Supabase Storage immediately | Shotstack deletes rendered files from their CDN after 24 hours. `downloadAndStoreVideo()` fires in both the webhook path and the polling fallback. The `output_url` in the DB is always a permanent Supabase URL, never a Shotstack CDN URL. |
