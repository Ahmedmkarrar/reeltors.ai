import { getRedis } from './redis';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// in-memory fallback for local dev (single instance only)
const store = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key);
  });
}, 10 * 60 * 1000);

async function rateLimitRedis(
  redis: NonNullable<ReturnType<typeof getRedis>>,
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const redisKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
  const windowSecs = Math.ceil(windowMs / 1000) + 1;

  const pipeline = redis.pipeline();
  pipeline.incr(redisKey);
  pipeline.expire(redisKey, windowSecs);
  const results = await pipeline.exec();

  const count = (results?.[0]?.[1] as number) ?? 1;
  const allowed = count <= limit;
  return { allowed, remaining: Math.max(0, limit - count) };
}

function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  if (redis) {
    try {
      return await rateLimitRedis(redis, key, limit, windowMs);
    } catch (err) {
      console.error('[rate-limit] Redis error, falling back to in-memory:', err);
    }
  }
  return rateLimitMemory(key, limit, windowMs);
}

export function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
