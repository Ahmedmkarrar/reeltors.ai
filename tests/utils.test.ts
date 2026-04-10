import { describe, it, expect, beforeEach } from 'vitest';
import { clampAiIndices, MAX_AI_VIDEOS } from '@/lib/fal/client';
import { getPlanFromPriceId, PLAN_LIMITS } from '@/lib/stripe/plans';

// ── clampAiIndices ────────────────────────────────────────────────────────────

describe('clampAiIndices', () => {
  it('returns empty array when no indices provided', () => {
    expect(clampAiIndices([], 5)).toEqual([]);
  });

  it('filters out-of-bounds indices', () => {
    expect(clampAiIndices([0, 5, 10], 5)).toEqual([0]);
  });

  it('filters negative indices', () => {
    expect(clampAiIndices([-1, 0, 1], 5)).toEqual([0, 1]);
  });

  it('deduplicates repeated indices', () => {
    expect(clampAiIndices([0, 0, 1, 1], 5)).toEqual([0, 1]);
  });

  it('caps at MAX_AI_VIDEOS even if more are provided', () => {
    const indices = [0, 1, 2, 3, 4];
    const result = clampAiIndices(indices, 10);
    expect(result.length).toBe(MAX_AI_VIDEOS);
  });

  it('sorts indices in ascending order', () => {
    expect(clampAiIndices([3, 1, 2], 5)).toEqual([1, 2, 3]);
  });

  it('filters non-integer values', () => {
    expect(clampAiIndices([0, 1.5, 2], 5)).toEqual([0, 2]);
  });

  it('returns empty when imageCount is 0', () => {
    expect(clampAiIndices([0, 1], 0)).toEqual([]);
  });
});

// ── getPlanFromPriceId ────────────────────────────────────────────────────────

describe('getPlanFromPriceId', () => {
  beforeEach(() => {
    process.env.STRIPE_PRICE_STARTER        = 'price_starter_monthly';
    process.env.STRIPE_PRICE_STARTER_ANNUAL = 'price_starter_annual';
    process.env.STRIPE_PRICE_PRO            = 'price_growth_monthly';
    process.env.STRIPE_PRICE_GROWTH_ANNUAL  = 'price_growth_annual';
    process.env.STRIPE_PRICE_TEAM           = 'price_pro_monthly';
    process.env.STRIPE_PRICE_PRO_ANNUAL     = 'price_pro_annual';
  });

  it('maps monthly starter price to starter plan', () => {
    expect(getPlanFromPriceId('price_starter_monthly')).toBe('starter');
  });

  it('maps annual starter price to starter plan', () => {
    expect(getPlanFromPriceId('price_starter_annual')).toBe('starter');
  });

  it('maps STRIPE_PRICE_PRO (growth monthly) to growth plan', () => {
    expect(getPlanFromPriceId('price_growth_monthly')).toBe('growth');
  });

  it('maps annual growth price to growth plan', () => {
    expect(getPlanFromPriceId('price_growth_annual')).toBe('growth');
  });

  it('maps STRIPE_PRICE_TEAM (pro monthly) to pro plan', () => {
    expect(getPlanFromPriceId('price_pro_monthly')).toBe('pro');
  });

  it('maps annual pro price to pro plan', () => {
    expect(getPlanFromPriceId('price_pro_annual')).toBe('pro');
  });

  it('returns free for unknown price id', () => {
    expect(getPlanFromPriceId('price_unknown_xyz')).toBe('free');
  });
});

// ── PLAN_LIMITS ───────────────────────────────────────────────────────────────

describe('PLAN_LIMITS', () => {
  it('starter limit is 15', () => {
    expect(PLAN_LIMITS.starter).toBe(15);
  });

  it('growth limit is 50', () => {
    expect(PLAN_LIMITS.growth).toBe(50);
  });

  it('pro limit is 100', () => {
    expect(PLAN_LIMITS.pro).toBe(100);
  });
});
