const PRIVATE_IP_REGEX =
  /^(localhost|127\.|0\.0\.0\.0|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.|::1|fc00:|fd)/i;

const MAX_URL_LENGTH = 2048;

/**
 * Validates a URL is safe to use as an external resource.
 * Blocks private/loopback IPs (SSRF), enforces HTTPS, and caps length.
 * Returns the URL string if valid, undefined if not.
 */
export function validateExternalUrl(url: unknown): string | undefined {
  if (typeof url !== 'string' || url.length > MAX_URL_LENGTH) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  if (parsed.protocol !== 'https:') return undefined;
  if (PRIVATE_IP_REGEX.test(parsed.hostname)) return undefined;

  return url;
}

/**
 * Same as validateExternalUrl but also allows http: (for image URLs that may be http).
 */
export function validateExternalUrlHttp(url: unknown): string | undefined {
  if (typeof url !== 'string' || url.length > MAX_URL_LENGTH) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined;
  if (PRIVATE_IP_REGEX.test(parsed.hostname)) return undefined;

  return url;
}
