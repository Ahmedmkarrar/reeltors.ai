export const PLANS = {
  starter: {
    name:           'Starter',
    tagline:        'For agents just getting started with content',
    price:          49.99,
    priceAnnual:    408.99,
    videosPerMonth: 15,
    features: [
      'Up to 15 videos/month',
      'AI captions',
      'TikTok / Reels optimized',
      '60-sec export',
      'Fast generation',
    ],
    stripePriceId:       process.env.STRIPE_PRICE_STARTER,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
  },
  growth: {
    name:           'Growth',
    tagline:        'For agents posting consistently',
    price:          99.99,
    priceAnnual:    828.99,
    videosPerMonth: 50,
    features: [
      'Up to 50 videos/month',
      'Everything in Starter',
      'Premium templates',
      'Branding (logo + colors)',
      'Faster rendering',
    ],
    stripePriceId:       process.env.STRIPE_PRICE_PRO,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_GROWTH_ANNUAL,
    popular: true,
  },
  pro: {
    name:           'Pro',
    tagline:        'For serious agents scaling listings',
    price:          199.99,
    priceAnnual:    1668.99,
    videosPerMonth: 100,
    features: [
      'Up to 100 videos/month',
      'Everything in Growth',
      'Priority rendering',
      'Advanced styles',
      'Multi-platform export',
    ],
    stripePriceId:       process.env.STRIPE_PRICE_TEAM,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// Derived from PLANS — update videosPerMonth above, not here
export const PLAN_LIMITS: Record<string, number> = {
  starter: PLANS.starter.videosPerMonth,
  growth:  PLANS.growth.videosPerMonth,
  pro:     PLANS.pro.videosPerMonth,
};

export function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_STARTER)        return 'starter';
  if (priceId === process.env.STRIPE_PRICE_STARTER_ANNUAL) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_PRO)            return 'growth';
  if (priceId === process.env.STRIPE_PRICE_GROWTH_ANNUAL)  return 'growth';
  if (priceId === process.env.STRIPE_PRICE_TEAM)           return 'pro';
  if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL)     return 'pro';
  return 'free';
}
