import { describe, it, expect } from 'vitest';
import { validateExternalUrl, validateExternalUrlHttp } from '@/lib/validate-url';
import { getAbuseBlockMessage } from '@/lib/tunnel/abuse';

describe('validateExternalUrl', () => {
  it('accepts a valid https URL', () => {
    expect(validateExternalUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
  });

  it('rejects http — https only', () => {
    expect(validateExternalUrl('http://example.com/photo.jpg')).toBeUndefined();
  });

  it('rejects file:// protocol', () => {
    expect(validateExternalUrl('file:///etc/passwd')).toBeUndefined();
  });

  it('rejects ftp:// protocol', () => {
    expect(validateExternalUrl('ftp://files.example.com/data')).toBeUndefined();
  });

  it('rejects localhost', () => {
    expect(validateExternalUrl('https://localhost/internal')).toBeUndefined();
  });

  it('rejects 127.0.0.1 loopback', () => {
    expect(validateExternalUrl('https://127.0.0.1/secret')).toBeUndefined();
  });

  it('rejects 0.0.0.0', () => {
    expect(validateExternalUrl('https://0.0.0.0/')).toBeUndefined();
  });

  it('rejects 10.x private network', () => {
    expect(validateExternalUrl('https://10.0.0.1/internal')).toBeUndefined();
  });

  it('rejects 192.168.x private network', () => {
    expect(validateExternalUrl('https://192.168.1.100/')).toBeUndefined();
  });

  it('rejects AWS metadata endpoint 169.254.169.254', () => {
    expect(validateExternalUrl('https://169.254.169.254/latest/meta-data/')).toBeUndefined();
  });

  it('rejects 172.16.x–172.31.x private range', () => {
    expect(validateExternalUrl('https://172.16.0.1/')).toBeUndefined();
    expect(validateExternalUrl('https://172.31.255.255/')).toBeUndefined();
  });

  it('allows 172.15.x which is not in the private range', () => {
    expect(validateExternalUrl('https://172.15.0.1/public')).toBe('https://172.15.0.1/public');
  });

  it('rejects URLs longer than 2048 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2048);
    expect(validateExternalUrl(longUrl)).toBeUndefined();
  });

  it('rejects non-string input', () => {
    expect(validateExternalUrl(null)).toBeUndefined();
    expect(validateExternalUrl(42)).toBeUndefined();
    expect(validateExternalUrl(undefined)).toBeUndefined();
    expect(validateExternalUrl({ url: 'https://example.com' })).toBeUndefined();
  });

  it('rejects malformed URL strings', () => {
    expect(validateExternalUrl('not-a-url')).toBeUndefined();
    expect(validateExternalUrl('://broken')).toBeUndefined();
    expect(validateExternalUrl('')).toBeUndefined();
  });
});

describe('validateExternalUrlHttp', () => {
  it('accepts https URL', () => {
    expect(validateExternalUrlHttp('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
  });

  it('accepts http URL', () => {
    expect(validateExternalUrlHttp('http://example.com/img.jpg')).toBe('http://example.com/img.jpg');
  });

  it('still blocks private IPs over http', () => {
    expect(validateExternalUrlHttp('http://192.168.1.1/')).toBeUndefined();
    expect(validateExternalUrlHttp('http://127.0.0.1/')).toBeUndefined();
    expect(validateExternalUrlHttp('http://10.0.0.1/')).toBeUndefined();
  });

  it('rejects ftp:// even though http is allowed', () => {
    expect(validateExternalUrlHttp('ftp://example.com/file')).toBeUndefined();
  });

  it('rejects non-string input', () => {
    expect(validateExternalUrlHttp(null)).toBeUndefined();
  });
});

describe('getAbuseBlockMessage', () => {
  it('returns message for disposable_email', () => {
    expect(getAbuseBlockMessage('disposable_email')).toContain('real email');
  });

  it('returns message for email_already_used', () => {
    expect(getAbuseBlockMessage('email_already_used')).toContain('already has a free video');
  });

  it('returns message for ip_rate_limit', () => {
    expect(getAbuseBlockMessage('ip_rate_limit')).toContain('network');
  });

  it('returns message for device_rate_limit', () => {
    expect(getAbuseBlockMessage('device_rate_limit')).toContain('device');
  });

  it('returns a generic fallback for unknown reasons', () => {
    const msg = getAbuseBlockMessage('some_unknown_reason');
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});

describe('session token validation regex', () => {
  const SESSION_TOKEN_REGEX = /^[a-zA-Z0-9_-]{8,128}$/;

  it('accepts a valid token', () => {
    expect(SESSION_TOKEN_REGEX.test('abcd1234')).toBe(true);
  });

  it('accepts tokens with underscores and hyphens', () => {
    expect(SESSION_TOKEN_REGEX.test('abc_def-xyz_123')).toBe(true);
  });

  it('accepts token at exactly 8 chars (lower boundary)', () => {
    expect(SESSION_TOKEN_REGEX.test('abcd1234')).toBe(true);
  });

  it('rejects token at 7 chars (below lower boundary)', () => {
    expect(SESSION_TOKEN_REGEX.test('abcd123')).toBe(false);
  });

  it('accepts token at exactly 128 chars (upper boundary)', () => {
    expect(SESSION_TOKEN_REGEX.test('a'.repeat(128))).toBe(true);
  });

  it('rejects token at 129 chars (above upper boundary)', () => {
    expect(SESSION_TOKEN_REGEX.test('a'.repeat(129))).toBe(false);
  });

  it('rejects tokens with special characters', () => {
    expect(SESSION_TOKEN_REGEX.test('abc!@#1234')).toBe(false);
    expect(SESSION_TOKEN_REGEX.test('abc 1234')).toBe(false);
    expect(SESSION_TOKEN_REGEX.test('abc/1234')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(SESSION_TOKEN_REGEX.test('')).toBe(false);
  });
});

describe('UUID validation regex', () => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  it('accepts a valid lowercase UUID', () => {
    expect(UUID_REGEX.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts a valid uppercase UUID', () => {
    expect(UUID_REGEX.test('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects plain text', () => {
    expect(UUID_REGEX.test('not-a-uuid')).toBe(false);
  });

  it('rejects UUID without hyphens', () => {
    expect(UUID_REGEX.test('550e8400e29b41d4a716446655440000')).toBe(false);
  });

  it('rejects UUID with wrong segment lengths', () => {
    expect(UUID_REGEX.test('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(UUID_REGEX.test('')).toBe(false);
  });
});
