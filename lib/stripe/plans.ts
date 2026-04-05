export const PLANS = {
  starter: {
    name:          'Starter',
    tagline:       'For agents just getting started with content',
    price:         49,
    videosPerMonth: 20,
    features: [
      'Up to 20 videos/month',
      'AI captions',
      'TikTok / Reels optimized',
      '60-sec export',
      'Fast generation',
    ],
    stripePriceId:       process.env.STRIPE_PRICE_STARTER,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
    limit: 20,
  },
  growth: {
    name:          'Growth',
    tagline:       'For agents posting consistently',
    price:         99,
    videosPerMonth: 75,
    features: [
      'Up to 75 videos/month',
      'Everything in Starter',
      'Premium templates',
      'Branding (logo + colors)',
      'Faster rendering',
    ],
    stripePriceId:       process.env.STRIPE_PRICE_PRO,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_GROWTH_ANNUAL,
    limit: 75,
    popular: true,
  },
  pro: {
    name:          'Pro',
    tagline:       'For serious agents scaling listings',
    price:         199,
    videosPerMonth: 200,
    features: [
      'Up to 200 videos/month',
      'Everything in Growth',
      'Priority rendering',
      'Advanced styles',
      'Multi-platform export',
    ],
    stripePriceId:       process.env.STRIPE_PRICE_TEAM,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL,
    limit: 200,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const PLAN_LIMITS: Record<string, number> = {
  starter: 20,
  growth:  75,
  pro:     200,
};
