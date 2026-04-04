export const PLANS = {
  starter: {
    name: 'Starter',
    price: 19.99,
    videosPerMonth: 5,
    templates: 3,
    formats: ['vertical', 'square'],
    features: ['5 videos/month', '3 templates', 'No watermark', '1080p export', 'Email support'],
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
    limit: 5,
  },
  pro: {
    name: 'Pro',
    price: 49.99,
    videosPerMonth: -1,
    templates: 10,
    formats: ['vertical', 'square', 'horizontal'],
    features: [
      'Unlimited videos',
      'All 10+ templates',
      'No watermark',
      '4K export',
      'All 3 formats',
      'AI captions',
      'Priority support',
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    limit: 999,
    popular: true,
  },
  team: {
    name: 'Team',
    price: 99.99,
    videosPerMonth: -1,
    templates: 10,
    formats: ['vertical', 'square', 'horizontal'],
    features: [
      'Everything in Pro',
      'Up to 5 agents',
      'Shared brand kit',
      'Team analytics',
      'Custom templates',
      'Priority support',
    ],
    stripePriceId: process.env.STRIPE_PRICE_TEAM,
    limit: 999,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const PLAN_LIMITS: Record<string, number> = {
  starter: 5,
  pro: 999,
  team: 999,
};
