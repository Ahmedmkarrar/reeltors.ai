import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const adminChain = {
  update:   vi.fn().mockReturnThis(),
  select:   vi.fn().mockReturnThis(),
  eq:       vi.fn().mockReturnThis(),
  single:   vi.fn().mockResolvedValue({ data: { email: 'a@b.com', full_name: 'Agent' }, error: null }),
  then:     (res: (v: { data: null; error: null }) => unknown) =>
    Promise.resolve({ data: null, error: null }).then(res),
};

const mockAdmin = { from: vi.fn().mockReturnValue(adminChain) };

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockAdmin,
}));

vi.mock('@/lib/storage', () => ({
  downloadAndStoreVideo:     vi.fn().mockResolvedValue('https://storage.example.com/video.mp4'),
  downloadAndStoreThumbnail: vi.fn().mockResolvedValue('https://storage.example.com/thumb.jpg'),
}));

vi.mock('@/lib/resend/emails', () => ({
  sendFirstVideoEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/resend/tunnel-emails', () => ({
  startTunnelEmailSequence: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>, params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/webhooks/shotstack');
  // include the test secret by default so auth doesn't block every test
  url.searchParams.set('token', 'secret-token');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), {
    method:  'POST',
    body:    JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const validPayload = {
  id:        'render-1',
  status:    'done',
  url:       'https://cdn.shotstack.io/render-1.mp4',
  thumbnail: 'https://cdn.shotstack.io/render-1.jpg',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/shotstack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WEBHOOK_SECRET = 'secret-token';
    adminChain.eq.mockReturnThis();
    adminChain.update.mockReturnThis();
    adminChain.then = (res: (v: { data: null; error: null }) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(res);
    adminChain.single.mockResolvedValue({
      data: { email: 'a@b.com', full_name: 'Agent' }, error: null,
    });
  });

  it('returns 403 when WEBHOOK_SECRET is set but token is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/shotstack/route');
    const url = new URL('http://localhost/api/webhooks/shotstack');
    url.searchParams.set('video_id', 'vid-1');
    url.searchParams.set('user_id', 'user-1');
    const req = new NextRequest(url.toString(), {
      method: 'POST',
      body: JSON.stringify(validPayload),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 403 when WEBHOOK_SECRET is set but token is wrong', async () => {
    process.env.WEBHOOK_SECRET = 'secret-token';
    const { POST } = await import('@/app/api/webhooks/shotstack/route');
    const res = await POST(makeRequest(validPayload, { video_id: 'vid-1', user_id: 'user-1', token: 'wrong' }));
    expect(res.status).toBe(403);
  });

  it('returns 403 when WEBHOOK_SECRET is not configured', async () => {
    delete process.env.WEBHOOK_SECRET;
    const { POST } = await import('@/app/api/webhooks/shotstack/route');
    const res = await POST(makeRequest(validPayload, { video_id: 'vid-1', user_id: 'user-1' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 on invalid JSON', async () => {
    const { POST } = await import('@/app/api/webhooks/shotstack/route');
    const req = new NextRequest('http://localhost/api/webhooks/shotstack?token=secret-token', {
      method: 'POST', body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when renderId or status is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/shotstack/route');
    const res = await POST(makeRequest({ url: 'https://cdn.shotstack.io/v.mp4' }));
    expect(res.status).toBe(400);
  });

  it('acknowledges pings without video_id/user_id in query params', async () => {
    const { POST } = await import('@/app/api/webhooks/shotstack/route');
    const res = await POST(makeRequest({ id: 'render-ping', status: 'done', url: 'https://x.com/v.mp4' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(adminChain.update).not.toHaveBeenCalled();
  });

  it('sets video status to failed on failed render', async () => {
    const { POST } = await import('@/app/api/webhooks/shotstack/route');
    const res = await POST(makeRequest(
      { id: 'render-1', status: 'failed' },
      { video_id: 'vid-1', user_id: 'user-1' },
    ));
    expect(res.status).toBe(200);
    expect(adminChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    );
  });

  it('sets video status to complete with output_url on done render', async () => {
    const { POST } = await import('@/app/api/webhooks/shotstack/route');
    const res = await POST(makeRequest(validPayload, { video_id: 'vid-1', user_id: 'user-1' }));
    expect(res.status).toBe(200);
    expect(adminChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status:     'complete',
        output_url: expect.any(String),
      }),
    );
  });

  it('sends first video email after done render', async () => {
    const { POST } = await import('@/app/api/webhooks/shotstack/route');
    const { sendFirstVideoEmail } = await import('@/lib/resend/emails');
    await POST(makeRequest(validPayload, { video_id: 'vid-1', user_id: 'user-1' }));
    expect(sendFirstVideoEmail).toHaveBeenCalledWith(
      'a@b.com',
      'Agent',
      expect.any(String),
    );
  });

  it('ignores in-progress status updates (returns 200 without DB write)', async () => {
    const { POST } = await import('@/app/api/webhooks/shotstack/route');
    const res = await POST(makeRequest(
      { id: 'render-1', status: 'rendering' },
      { video_id: 'vid-1', user_id: 'user-1' },
    ));
    expect(res.status).toBe(200);
    expect(adminChain.update).not.toHaveBeenCalled();
  });
});
