import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockUser: { id: string } | null = { id: 'user-1' };
let mockProfile: Record<string, unknown> = {
  plan: 'starter', videos_used_this_month: 0, videos_limit: 20,
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

const mockGenerateVideo           = vi.fn().mockResolvedValue({ id: 'render-1', status: 'planned' });
const mockGenerateMixedMediaVideo = vi.fn().mockResolvedValue({ id: 'render-mixed', status: 'planned' });
const mockGenerateDroneShots      = vi.fn().mockResolvedValue(new Map());

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

vi.mock('@/lib/creatomate/client', () => ({
  generateVideo:           mockGenerateVideo,
  generateMixedMediaVideo: mockGenerateMixedMediaVideo,
  CreatomateError: class CreatomateError extends Error {
    constructor(msg: string, public statusCode?: number) { super(msg); }
  },
}));

vi.mock('@/lib/fal/client', () => ({
  generateDroneShotsForIndices: mockGenerateDroneShots,
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
    mockUser    = { id: 'user-1' };
    mockProfile = {
      plan: 'starter', videos_used_this_month: 0, videos_limit: 20,
      full_name: 'Test Agent', email: 'test@example.com', phone: null, brand_name: null,
    };
    profileChain.single.mockImplementation(() =>
      Promise.resolve({ data: mockProfile, error: null })
    );
    adminChain.single.mockResolvedValue({ data: { id: 'vid-1' }, error: null });
    mockGenerateVideo.mockResolvedValue({ id: 'render-1', status: 'planned' });
    mockGenerateDroneShots.mockResolvedValue(new Map());
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
    mockUser = { id: 'user-1' };
    mockProfile = {
      plan: 'starter', videos_used_this_month: 0, videos_limit: 20,
      full_name: 'Test Agent', email: 'test@example.com', phone: null, brand_name: null,
    };
    profileChain.single.mockImplementation(() =>
      Promise.resolve({ data: mockProfile, error: null })
    );
    adminChain.single.mockResolvedValue({ data: { id: 'vid-1' }, error: null });
    mockGenerateVideo.mockResolvedValue({ id: 'render-1', status: 'planned' });
    mockGenerateDroneShots.mockResolvedValue(new Map());
  });

  it('calls generateVideo with correct templateId for standard flow', async () => {
    process.env.NEXT_PUBLIC_APP_URL = '';
    const { POST } = await import('@/app/api/videos/generate/route');
    await POST(makeRequest({ templateId: 'tmpl-abc', images: ['https://a.com/1.jpg'] }));
    expect(mockGenerateVideo).toHaveBeenCalledWith(
      expect.objectContaining({ templateId: 'tmpl-abc' }),
    );
  });

  it('calls generateMixedMediaVideo when fal.ai returns videos', async () => {
    process.env.FAL_KEY = 'test-fal-key';
    process.env.NEXT_PUBLIC_APP_URL = '';
    const falMap = new Map([[0, 'https://cdn.fal.ai/video.mp4']]);
    mockGenerateDroneShots.mockResolvedValue(falMap);

    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeRequest({
      templateId: 'tmpl-1',
      images: ['https://a.com/1.jpg'],
      aiVideoIndices: [0],
    }));
    expect(res.status).toBe(200);
    expect(mockGenerateMixedMediaVideo).toHaveBeenCalled();
    const json = await res.json();
    expect(json.aiVideosGenerated).toBe(1);
  });

  it('falls back to generateVideo when fal.ai fails entirely', async () => {
    process.env.FAL_KEY = 'test-fal-key';
    process.env.NEXT_PUBLIC_APP_URL = '';
    mockGenerateDroneShots.mockRejectedValue(new Error('fal.ai timeout'));

    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeRequest({
      templateId: 'tmpl-1',
      images: ['https://a.com/1.jpg'],
      aiVideoIndices: [0],
    }));
    expect(res.status).toBe(200);
    expect(mockGenerateVideo).toHaveBeenCalled();
    const json = await res.json();
    expect(json.aiVideosFailed).toBe(true);
  });

  it('does not increment usage when all fal.ai shots fail', async () => {
    process.env.FAL_KEY = 'test-fal-key';
    process.env.NEXT_PUBLIC_APP_URL = '';
    mockGenerateDroneShots.mockRejectedValue(new Error('fal timeout'));

    const { POST } = await import('@/app/api/videos/generate/route');
    await POST(makeRequest({
      templateId: 'tmpl-1',
      images: ['https://a.com/1.jpg'],
      aiVideoIndices: [0],
    }));
    expect(mockAdmin.rpc).not.toHaveBeenCalledWith('increment_videos_used', expect.anything());
  });

  it('returns videoId and renderId on success', async () => {
    process.env.NEXT_PUBLIC_APP_URL = '';
    const { POST } = await import('@/app/api/videos/generate/route');
    const res = await POST(makeRequest({ templateId: 'tmpl-1', images: ['https://a.com/1.jpg'] }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('videoId');
    expect(json).toHaveProperty('renderId');
  });
});
