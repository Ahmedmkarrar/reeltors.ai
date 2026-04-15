import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';
import type { VideoJobPayload } from '../types/index.js';

export const VIDEO_QUEUE_NAME = 'video-generation';

export const videoQueue = new Queue<VideoJobPayload>(VIDEO_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});
