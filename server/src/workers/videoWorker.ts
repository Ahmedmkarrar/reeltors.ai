import '../config/env.js';
import { Worker, type Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { VIDEO_QUEUE_NAME } from '../queues/videoQueue.js';
import { cleanJobTempDir } from '../utils/temp.js';
import { generateDroneShotsForIndices, FalError } from '../lib/fal.js';
import { generateVideo, generateMixedMediaVideo, ShotstackError, type MediaItem } from '../lib/shotstack.js';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { VideoJobPayload } from '../types/index.js';

// matches available vCPUs on the 2-core host
const CONCURRENCY = 2;

async function processVideo(job: Job<VideoJobPayload>): Promise<void> {
  const {
    videoId, userId, images, aiIndices, templateId,
    listingAddress, listingPrice, agentName,
    format, audioUrl, logoUrl, videoPrompt,
    isPaidPlan, isFree, clientIp, fingerprintId,
  } = job.data;

  const admin     = getSupabaseAdmin();
  const markFailed = () => admin.from('videos').update({ status: 'failed' }).eq('id', videoId);

  try {
    // ── 1. fal.ai: generate AI drone shots (parallel, max 3) ─────────────────
    await job.updateProgress(5);

    let falVideoMap = new Map<number, string>();
    let falFailed   = false;

    if (aiIndices.length > 0 && process.env.FAL_KEY) {
      try {
        falVideoMap = await generateDroneShotsForIndices(images, aiIndices, videoPrompt, format ?? 'vertical');
        if (falVideoMap.size === 0) {
          console.warn(`[worker] job ${job.id} — all fal.ai generations failed, falling back to images`);
          falFailed = true;
        }
      } catch (err) {
        console.error(`[worker] job ${job.id} — fal.ai error, falling back to images:`, err);
        falFailed = true;
      }
    } else if (aiIndices.length > 0) {
      console.warn(`[worker] job ${job.id} — FAL_KEY not set, skipping AI drone shots`);
    }

    await job.updateProgress(45);

    // ── 2. Build final media array (AI videos slot in where generated) ────────
    const mediaItems: MediaItem[] = images.map((url, idx) => {
      const videoUrl = falVideoMap.get(idx);
      return videoUrl ? { type: 'video' as const, url: videoUrl } : { type: 'image' as const, url };
    });

    const hasAiVideos = falVideoMap.size > 0;

    // ── 3. Build Shotstack callback URL ───────────────────────────────────────
    const appUrl   = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim();
    const isPublic = appUrl.startsWith('https://');

    const callbackUrl = (() => {
      if (!isPublic) return undefined;
      const url = new URL(`${appUrl}/api/webhooks/shotstack`);
      if (process.env.WEBHOOK_SECRET) url.searchParams.set('token', process.env.WEBHOOK_SECRET.replace(/[^\x20-\x7E]/g, ''));
      url.searchParams.set('video_id', videoId);
      url.searchParams.set('user_id', userId);
      return url.toString();
    })();

    const shotstackApiKey = isPaidPlan && process.env.SHOTSTACK_PROD_API_KEY
      ? process.env.SHOTSTACK_PROD_API_KEY.trim()
      : process.env.SHOTSTACK_API_KEY?.trim();

    const shotstackEnv = isPaidPlan && process.env.SHOTSTACK_PROD_ENV
      ? (process.env.SHOTSTACK_PROD_ENV.trim() as 'v1' | 'stage')
      : undefined;

    const sharedParams = {
      templateKey:    templateId,
      listingAddress,
      listingPrice,
      agentName:      agentName  || undefined,
      audioUrl:       typeof audioUrl === 'string' && audioUrl.startsWith('https://') ? audioUrl : undefined,
      logoUrl:        typeof logoUrl  === 'string' && logoUrl.startsWith('https://')  ? logoUrl  : undefined,
      format:         (format ?? 'vertical') as 'vertical' | 'square' | 'horizontal',
      callbackUrl,
      apiKey:         shotstackApiKey,
      env:            shotstackEnv,
    };

    // ── 4. Submit to Shotstack ────────────────────────────────────────────────
    let render;
    try {
      if (hasAiVideos) {
        try {
          render = await generateMixedMediaVideo({ mediaItems, ...sharedParams });
        } catch (mixedErr) {
          console.error(`[worker] job ${job.id} — mixed-media render failed, falling back to images:`, mixedErr);
          render = await generateVideo({ images, ...sharedParams });
        }
      } else {
        render = await generateVideo({ images, ...sharedParams });
      }
    } catch (err) {
      await markFailed();
      if (err instanceof ShotstackError) console.error(`[worker] job ${job.id} — Shotstack error:`, err.message);
      else if (err instanceof FalError)  console.error(`[worker] job ${job.id} — fal.ai error:`, err.message);
      else                               console.error(`[worker] job ${job.id} — unexpected error:`, err);
      return;
    }

    await job.updateProgress(85);

    // ── 5. Update Supabase — render ID, usage counter, abuse logs ─────────────
    const aiFullyFailed = falFailed && aiIndices.length > 0;

    const ops: Promise<unknown>[] = [
      Promise.resolve(admin.from('videos').update({ status: 'processing', render_id: render.id }).eq('id', videoId)),
    ];

    if (!aiFullyFailed) {
      ops.push(Promise.resolve(admin.rpc('increment_videos_used', { p_user_id: userId })));
    } else {
      console.info(`[worker] job ${job.id} — AI shots fully failed, usage counter not incremented`);
    }

    if (isFree) {
      ops.push(Promise.resolve(admin.from('free_generation_logs').insert({
        user_id:        userId,
        ip_address:     clientIp && clientIp !== '0.0.0.0' ? clientIp : null,
        fingerprint_id: fingerprintId ?? null,
      })));
    }

    if (fingerprintId) {
      ops.push(Promise.resolve(admin.from('profiles').update({
        session_fingerprint:            fingerprintId,
        session_fingerprint_updated_at: new Date().toISOString(),
      }).eq('id', userId)));
    }

    await Promise.allSettled(ops);
    await job.updateProgress(100);

    console.log(`[worker] job ${job.id} — submitted to Shotstack, render_id=${render.id}`);
  } finally {
    await cleanJobTempDir(job.id ?? videoId);
  }
}

const worker = new Worker<VideoJobPayload>(VIDEO_QUEUE_NAME, processVideo, {
  connection: redis,
  concurrency: CONCURRENCY,
  limiter: { max: CONCURRENCY, duration: 1000 },
});

worker.on('completed', (job) => console.log(`[worker] job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`[worker] job ${job?.id} failed:`, err.message));
worker.on('error', (err) => console.error('[worker] error:', err.message));

process.on('SIGTERM', async () => { await worker.close(); process.exit(0); });
process.on('SIGINT',  async () => { await worker.close(); process.exit(0); });
