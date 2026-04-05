# Reeltors.ai

> Turn listing photos into viral videos in 60 seconds.

A SaaS product for real estate agents that converts listing photos into cinematic short-form videos (TikTok, Instagram Reels, YouTube Shorts) automatically.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database + Auth + Storage**: Supabase
- **Payments**: Stripe (subscriptions)
- **Video Generation**: Creatomate REST API
- **Email**: Resend
- **Analytics**: PostHog
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account
- A [Creatomate](https://creatomate.com) account
- A [Resend](https://resend.com) account
- A [PostHog](https://posthog.com) account (optional)

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd reeltors-ai
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. In **Storage**, confirm the `listing-images` bucket was created (it's in the SQL)
4. Copy your **Project URL** and **anon key** from Settings → API

### 3. Set up Stripe products

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create three products with monthly recurring prices:
   - **Starter** — $19/month
   - **Pro** — $47/month
   - **Team** — $97/month
3. Copy each price ID (starts with `price_...`)

### 4. Set up Creatomate

1. Sign up at [creatomate.com](https://creatomate.com)
2. Create three video templates in the dashboard:
   - **Cinematic Listing** — template with `Photo-1` through `Photo-10` elements, `Address.text`, `Price.text`, `Agent-Name.text`
   - **Quick Reel** — same element naming, faster transitions
   - **Luxury Showcase** — same element naming, elegant style
3. Note the template IDs and update `lib/creatomate/client.ts` with your real IDs
4. Copy your API key from Settings

### 5. Set up Resend

1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain (or use the sandbox for testing)
3. Copy your API key

### 6. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_TEAM=price_...

CREATOMATE_API_KEY=...

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@reeltors.ai

NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local` in the Vercel dashboard
4. Update `NEXT_PUBLIC_APP_URL` to your production domain
5. Deploy

### Setting up Stripe webhooks in production

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` in Vercel env vars

### Local webhook testing

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Pricing Plans

| Plan    | Price   | Videos/month |
|---------|---------|--------------|
| Free    | $0      | 1            |
| Starter | $19/mo  | 5            |
| Pro     | $47/mo  | Unlimited    |
| Team    | $97/mo  | Unlimited    |

---

## Project Structure

```
app/
├── (auth)/login + signup     ← Auth pages
├── (dashboard)/              ← Protected dashboard
│   ├── dashboard/            ← Home with stats
│   ├── create/               ← Multi-step video wizard
│   ├── videos/               ← Video library
│   └── account/              ← Profile + billing
├── api/
│   ├── videos/generate       ← Start Creatomate render
│   ├── videos/status/[id]    ← Poll render status
│   ├── videos/[id]           ← Delete video
│   ├── webhooks/stripe       ← Stripe events
│   ├── billing/portal        ← Stripe billing portal
│   ├── checkout              ← Stripe checkout session
│   └── users/welcome         ← Welcome email
└── page.tsx                  ← Landing page
```

---

## Creating Creatomate Templates

Each template needs these named elements:
- `Photo-1` through `Photo-10` — image sources
- `Address.text` — listing address overlay
- `Price.text` — price overlay
- `Agent-Name.text` — agent name overlay

After creating templates, update the `id` fields in `lib/creatomate/client.ts` with your real Creatomate template IDs.
