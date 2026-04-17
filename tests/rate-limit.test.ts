import { describe, it, expect, vi } from 'vitest';
import { rateLimit, getIp } from '@/lib/rate-limit';

// Each test uses a unique key so the shared in-memory store doesn't bleed between tests.
const key = () => `test-${Math.random().toString(36).slice(2)}`;

describe('rateLimit', () => {
  it('allows first request and sets remaining to limit - 1', () => {
    const result = rateLimit(key(), 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('decrements remaining on each call', () => {
    const k = key();
    rateLimit(k, 3, 60_000);
    const second = rateLimit(k, 3, 60_000);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it('blocks once limit is reached', () => {
    const k = key();
    rateLimit(k, 2, 60_000);
    rateLimit(k, 2, 60_000);
    const blocked = rateLimit(k, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('continues blocking on subsequent calls after limit', () => {
    const k = key();
    rateLimit(k, 1, 60_000);
    rateLimit(k, 1, 60_000); // blocked
    const stillBlocked = rateLimit(k, 1, 60_000);
    expect(stillBlocked.allowed).toBe(false);
  });

  it('resets after the window expires', () => {
    vi.useFakeTimers();
    const k = key();
    rateLimit(k, 1, 1_000);
    expect(rateLimit(k, 1, 1_000).allowed).toBe(false);

    vi.advanceTimersByTime(1_001);
    expect(rateLimit(k, 1, 1_000).allowed).toBe(true);
    vi.useRealTimers();
  });

  it('different keys are isolated from each other', () => {
    const k1 = key();
    const k2 = key();
    rateLimit(k1, 1, 60_000);
    rateLimit(k1, 1, 60_000); // exhaust k1
    expect(rateLimit(k2, 1, 60_000).allowed).toBe(true);
  });

  it('a limit of 1 allows exactly one request', () => {
    const k = key();
    expect(rateLimit(k, 1, 60_000).allowed).toBe(true);
    expect(rateLimit(k, 1, 60_000).allowed).toBe(false);
  });
});

describe('getIp', () => {
  it('returns first IP from x-forwarded-for header', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getIp(req)).toBe('1.2.3.4');
  });

  it('trims whitespace from x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '  9.9.9.9  , 1.1.1.1' },
    });
    expect(getIp(req)).toBe('9.9.9.9');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '8.8.8.8' },
    });
    expect(getIp(req)).toBe('8.8.8.8');
  });

  it('returns unknown when no IP headers are present', () => {
    const req = new Request('http://localhost');
    expect(getIp(req)).toBe('unknown');
  });

  it('prefers x-forwarded-for over x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
      },
    });
    expect(getIp(req)).toBe('1.1.1.1');
  });
});
