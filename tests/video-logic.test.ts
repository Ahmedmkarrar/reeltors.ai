import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockUser: { id: string } | null = { id: 'user-1' };
let mockProfile: Record<string, unknown> = {
  plan: 'starter', videos_used_this_month: 0, videos_limit: 15,
  full_name: 'Test Agent', email: 'test@example.com', phone: null, brand_name: null,
};

const profileChain = {
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

vi.mock('@vercel/functions', () => ({ waitUntil: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockImplementation(() =>
        Promise.resolve({ data: { user: mockUser }, error: mockUser ? null : new Error('Not authenticated') })
      ),
    },
    from: vi.fn().mockReturnValue(profileChain),
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockAdmin,
}));

vi.mock('@/lib/shotstack/client', () => ({
  generateVideo:           vi.fn().mockResolvedValue({ id: 'render-1', status: 'planned' }),
  generateMixedMediaVideo: vi.fn().mockResolvedValue({ id: 'render-mixed', status: 'planned' }),
  ShotstackError: class ShotstackError extends Error {
    constructor(msg: string, public statusCode?: number) { super(msg); }
  },
}));

vi.mock('@/lib/fal/client', () => ({
  generateDroneShotsForIndices: vi.fn().mockResolvedValue(new Map()),
  clampAiIndices: (indices: number[], count: number) =>
    [...new Set(indices)].filter((i) => Number.isInteger(i) && i >= 0 && i < count).slice(0, 3),
  FalError: class FalError extends Error {},
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/videos/generate', {
    method:  'POST',
    body:    JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/videos/generate — auth & validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    mockUser    = { id: 'user-1' };
    mockProfile = {
      plan: 'starter', videos_used_this_month: 0, videos_limit: 15,
      full_name: 'Test Agent', email: 'test@example.com', phone: null, brand_name: null,
    };
    profileChain.single.mockImplementation(() =>
      Promise.resolve({ data: mockProfile, error: null })
    );
    adminChain.single.mockResolvedValue({ data: { id: 'vid-1' }, error: null });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockUser = null;
    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeRequest({ templateId: 'tmpl-1', images: ['https://a.com/1.jpg'] }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when templateId is missing', async () => {
    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeRequest({ images: ['https://a.com/1.jpg'] }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('templateId');
  });

  it('returns 400 when images array is empty', async () => {
    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeRequest({ templateId: 'tmpl-1', images: [] }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('images');
  });

  it('returns 400 when images array exceeds 15 items', async () => {
    const { POST } = await import('@/app/api/videos/generate/route');
    const images = Array.from({ length: 16 }, (_, i) => `https://a.com/${i}.jpg`);
    const res = await POST(makeRequest({ templateId: 'tmpl-1', images }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when an image URL does not start with http', async () => {
    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeRequest({
      templateId: 'tmpl-1',
      images: ['ftp://bad-url.com/img.jpg'],
    }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('valid HTTP');
  });

  it('returns 400 on malformed JSON body', async () => {
    const { POST } = await import('@/app/api/videos/generate/route');
    const req = new NextRequest('http://localhost/api/videos/generate', {
      method:  'POST',
      body:    'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/videos/generate — generation flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stable fetch mock so fire-and-forget doesn't throw
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    mockUser = { id: 'user-1' };
    mockProfile = {
      plan: 'starter', videos_used_this_month: 0, videos_limit: 15,
      full_name: 'Test Agent', email: 'test@example.com', phone: null, brand_name: null,
    };
    profileChain.single.mockImplementation(() =>
      Promise.resolve({ data: mockProfile, error: null })
    );
    adminChain.single.mockResolvedValue({ data: { id: 'vid-1' }, error: null });
  });

  it('dispatches correct templateId to the process route', async () => {
    // generateVideo/generateMixedMediaVideo now run inside /api/videos/process.
    // The generate route's responsibility is to pass the right payload to that route.
    const { POST } = await import('@/app/api/videos/generate/route');
    await POST(makeRequest({ templateId: 'tmpl-abc', images: ['https://a.com/1.jpg'] }));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ templateId: 'tmpl-abc', userId: 'user-1' });
  });

  it('includes aiIndices in the process route payload when ai shots are requested', async () => {
    const { POST } = await import('@/app/api/videos/generate/route');
    await POST(makeRequest({
      templateId: 'tmpl-1',
      images: ['https://a.com/1.jpg'],
      aiVideoIndices: [0],
    }));

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.aiIndices).toEqual([0]);
  });

  it('sets aiIndices to empty array when no ai shots are requested', async () => {
    const { POST } = await import('@/app/api/videos/generate/route');
    await POST(makeRequest({ templateId: 'tmpl-1', images: ['https://a.com/1.jpg'] }));

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.aiIndices).toEqual([]);
  });

  it('does not trigger the process route when the video record insert fails', async () => {
    adminChain.single.mockResolvedValue({ data: null, error: new Error('db error') });

    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeRequest({ templateId: 'tmpl-1', images: ['https://a.com/1.jpg'] }));

    expect(res.status).toBe(500);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 202 with videoId on success', async () => {
    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeRequest({ templateId: 'tmpl-1', images: ['https://a.com/1.jpg'] }));
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json).toHaveProperty('videoId');
  });
});
