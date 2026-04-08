import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Supabase admin mock ───────────────────────────────────────────────────────

const mockChain = () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then: Function } = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    // make the chain itself awaitable
    then: (res: Function, rej?: Function) =>
      Promise.resolve({ data: [], error: null }).then(res as any, rej as any),
  };
  return chain;
};

const adminChain = mockChain();
const mockAdmin = {
  from: vi.fn().mockReturnValue(adminChain),
};

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockAdmin,
}));

// ── Stripe mock ───────────────────────────────────────────────────────────────

const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();
const mockCustomersRetrieve = vi.fn();

vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockSubscriptionsRetrieve },
    customers: { retrieve: mockCustomersRetrieve },
  }),
}));

// ── Email mock ────────────────────────────────────────────────────────────────

vi.mock('@/lib/resend/emails', () => ({
  sendPaymentFailedEmail: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: string, signature = 'valid-sig') {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': signature },
  });
}

function makeSubscription(priceId: string, status = 'active') {
  return {
    id:     'sub_test',
    status,
    customer: 'cus_test',
    items: { data: [{ price: { id: priceId } }] },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET    = 'whsec_test';
    process.env.STRIPE_PRICE_STARTER     = 'price_starter';
    process.env.STRIPE_PRICE_PRO         = 'price_growth';
    process.env.STRIPE_PRICE_TEAM        = 'price_pro';
    process.env.STRIPE_PRICE_PRO_ANNUAL  = 'price_pro_annual';
    process.env.STRIPE_PRICE_STARTER_ANNUAL  = 'price_starter_annual';
    process.env.STRIPE_PRICE_GROWTH_ANNUAL   = 'price_growth_annual';
    adminChain.eq.mockReturnThis();
    adminChain.select.mockReturnThis();
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing signature');
  });

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Signature mismatch');
    });
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid signature');
  });

  it('checkout.session.completed: upgrades plan and sets video limit', async () => {
    const sub = makeSubscription('price_starter');
    mockSubscriptionsRetrieve.mockResolvedValue(sub);
    // first eq().select() call returns a matched row (no fallback needed)
    adminChain.then = (res: Function) =>
      Promise.resolve({ data: [{ id: 'user-1' }], error: null }).then(res as any);

    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test',
          subscription: 'sub_test',
        },
      },
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    expect(adminChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'starter', videos_limit: 20 }),
    );
  });

  it('checkout.session.completed: falls back to customer metadata when no profile matched', async () => {
    const sub = makeSubscription('price_growth');
    mockSubscriptionsRetrieve.mockResolvedValue(sub);
    mockCustomersRetrieve.mockResolvedValue({
      id: 'cus_test',
      metadata: { supabase_user_id: 'user-fallback' },
    });
    // first update returns empty (no match on stripe_customer_id)
    adminChain.then = (res: Function) =>
      Promise.resolve({ data: [], error: null }).then(res as any);

    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { customer: 'cus_test', subscription: 'sub_test' } },
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockCustomersRetrieve).toHaveBeenCalledWith('cus_test');
  });

  it('customer.subscription.updated: sets plan to growth with correct limit', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: makeSubscription('price_growth', 'active') },
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    expect(adminChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'growth', videos_limit: 75 }),
    );
  });

  it('customer.subscription.updated: downgrades to free when status is past_due', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: makeSubscription('price_pro', 'past_due') },
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    expect(adminChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'free', videos_limit: 1 }),
    );
  });

  it('customer.subscription.deleted: resets user to free plan', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_test' } },
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    expect(adminChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        plan:                'free',
        subscription_status: 'free',
        videos_limit:        1,
      }),
    );
  });

  it('invoice.payment_failed: sends payment failed email', async () => {
    adminChain.single.mockResolvedValue({
      data: { email: 'agent@example.com', full_name: 'Jane Agent' },
      error: null,
    });

    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_test' } },
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const { sendPaymentFailedEmail } = await import('@/lib/resend/emails');
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(sendPaymentFailedEmail).toHaveBeenCalledWith('agent@example.com', 'Jane Agent');
  });

  it('returns 200 with received:true for unknown event types', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'some.unknown.event',
      data: { object: {} },
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });
});
