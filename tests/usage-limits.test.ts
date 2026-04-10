import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Shared mock state ─────────────────────────────────────────────────────────

let mockProfile: Record<string, unknown> = {};

const userChain = {
  select: vi.fn().mockReturnThis(),
  eq:     vi.fn().mockReturnThis(),
  single: vi.fn().mockImplementation(() =>
    Promise.resolve({ data: mockProfile, error: null })
  ),
};

const adminChain = {
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq:     vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { id: 'vid-1' }, error: null }),
  then:   (res: Function) =>
    Promise.resolve({ data: [{ id: 'vid-1' }], error: null }).then(res as any),
};

const mockAdmin = {
  from: vi.fn().mockReturnValue(adminChain),
  rpc:  vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockReturnValue(userChain),
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockAdmin,
}));

vi.mock('@/lib/shotstack/client', () => ({
  generateVideo:           vi.fn().mockResolvedValue({ id: 'render-1', status: 'queued' }),
  generateMixedMediaVideo: vi.fn().mockResolvedValue({ id: 'render-1', status: 'queued' }),
  ShotstackError:          class ShotstackError extends Error {},
}));

vi.mock('@/lib/fal/client', () => ({
  generateDroneShotsForIndices: vi.fn().mockResolvedValue(new Map()),
  clampAiIndices: (indices: number[], count: number) =>
    indices.filter((i) => i >= 0 && i < count).slice(0, 3),
  FalError: class FalError extends Error {},
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGenerateRequest(overrides: Record<string, unknown> = {}) {
  const body = {
    templateId: 'tmpl-1',
    images: ['https://example.com/img1.jpg'],
    ...overrides,
  };
  return new NextRequest('http://localhost/api/videos/generate', {
    method:  'POST',
    body:    JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Usage limit enforcement (POST /api/videos/generate)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userChain.single.mockImplementation(() =>
      Promise.resolve({ data: mockProfile, error: null })
    );
    adminChain.single.mockResolvedValue({ data: { id: 'vid-1' }, error: null });
    adminChain.then = (res: Function) =>
      Promise.resolve({ data: [{ id: 'vid-1' }], error: null }).then(res as any);
  });

  it('blocks free user who has reached their 1-video limit', async () => {
    mockProfile = { plan: 'free', videos_used_this_month: 1, videos_limit: 1 };

    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeGenerateRequest());
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('LIMIT_REACHED');
  });

  it('blocks starter user who is at their 15-video limit', async () => {
    mockProfile = { plan: 'starter', videos_used_this_month: 15, videos_limit: 15 };

    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeGenerateRequest());
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('LIMIT_REACHED');
  });

  it('allows free user who has not yet used their video', async () => {
    mockProfile = {
      plan: 'free', videos_used_this_month: 0, videos_limit: 1,
      full_name: 'Test', email: null, phone: null, brand_name: null,
      email_verified: true,
    };

    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeGenerateRequest());
    expect(res.status).toBe(200);
  });

  it('allows pro user regardless of usage count', async () => {
    mockProfile = {
      plan: 'pro', videos_used_this_month: 9999, videos_limit: 100,
      full_name: 'Pro User', email: null, phone: null, brand_name: null,
    };

    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeGenerateRequest());
    expect(res.status).toBe(200);
  });

  it('allows team plan user regardless of usage count', async () => {
    mockProfile = {
      plan: 'team', videos_used_this_month: 500, videos_limit: 100,
      full_name: 'Team User', email: null, phone: null, brand_name: null,
    };

    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeGenerateRequest());
    expect(res.status).toBe(200);
  });

  it('increments usage counter when generation succeeds', async () => {
    mockProfile = {
      plan: 'starter', videos_used_this_month: 5, videos_limit: 15,
      full_name: 'Test', email: null, phone: null, brand_name: null,
    };

    const { POST } = await import('@/app/api/videos/generate/route');
    await POST(makeGenerateRequest());
    expect(mockAdmin.rpc).toHaveBeenCalledWith('increment_videos_used', { p_user_id: 'user-1' });
  });
});
