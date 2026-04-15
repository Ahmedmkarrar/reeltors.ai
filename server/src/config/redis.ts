import { Redis } from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is required');
}

// maxRetriesPerRequest: null is required by BullMQ
export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on('error', (err: Error) => console.error('[redis] connection error:', err.message));
redis.on('connect', () => console.log('[redis] connected'));
