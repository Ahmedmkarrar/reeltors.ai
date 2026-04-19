import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateVideo, generateMixedMediaVideo, ShotstackError } from '@/lib/shotstack/client';
import type { MediaItem } from '@/lib/shotstack/client';
import { validateExternalUrl } from '@/lib/validate-url';
import { generateDroneShotsForIndices, FalError } from '@/lib/fal/client';

// Up to 5 minutes — fal.ai takes ~1-2 min per clip, max 3 clips in parallel
export const maxDuration = 300;

interface ProcessVideoPayload {
  videoId: string;
  userId: string;
  images: string[];
  aiIndices: number[];
  templateId: string;
  listingAddress?: string;
  listingPrice?: string;
  agentName?: string;
  brandName?: string;
  email?: string;
  phone?: string;
  format?: 'vertical' | 'square' | 'horizontal';
  audioUrl?: string;
  logoUrl?: string;
  videoPrompt?: string;
  isPaidPlan: boolean;
  isFree: boolean;
  clientIp?: string;
  fingerprintId?: string;
}

export async function POST(req: NextRequest) {
  // Internal-only — verify the shared secret
  const authHeader = req.headers.get('x-internal-secret');
  const expectedToken = process.env.WEBHOOK_SECRET?.replace(/[^\x20-\x7E]/g, '');
  if (!expectedToken) {
    console.error('WEBHOOK_SECRET not configured — rejecting process route call');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let payload: ProcessVideoPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Respond immediately so the generate route's waitUntil resolves fast.
  // The heavy work (fal.ai + Shotstack) runs in the background via waitUntil
  // under this route's own maxDuration=300 budget.
  waitUntil(runProcess(payload));
  return NextResponse.json({ accepted: true }, { status: 202 });
}

async function runProcess(payload: ProcessVideoPayload) {
  const {
    videoId, userId, images, aiIndices, templateId,
    listingAddress, listingPrice, agentName, brandName,
    email, phone, format, audioUrl, logoUrl, videoPrompt,
    isPaidPlan, isFree, clientIp, fingerprintId,
  } = payload;

  const admin = getSupabaseAdmin();
  const markFailed = () =>
    admin.from('videos').update({ status: 'failed' }).eq('id', videoId);

  // ── 1. Generate AI drone shots via fal.ai (parallel, max 3) ───────────────
  let falVideoMap = new Map<number, string>();
  let falFailed = false;

  if (aiIndices.length > 0 && process.env.FAL_KEY) {
    try {
      falVideoMap = await generateDroneShotsForIndices(images, aiIndices, videoPrompt, format ?? 'vertical');
      if (falVideoMap.size === 0) {
        console.warn(`fal.ai: all ${aiIndices.length} generation(s) failed — falling back to images`);
        falFailed = true;
      }
    } catch (err) {
      console.error('fal.ai generation error, falling back to images:', err);
      falFailed = true;
    }
  } else if (aiIndices.length > 0 && !process.env.FAL_KEY) {
    console.warn('FAL_KEY not set — skipping AI drone shot generation');
  }

  // ── 2. Build the final media array (videos + images) ──────────────────────
  const mediaItems: MediaItem[] = images.map((url, idx) => {
    const videoUrl = falVideoMap.get(idx);
    return videoUrl
      ? { type: 'video' as const, url: videoUrl }
      : { type: 'image' as const, url };
  });

  const hasAiVideos = falVideoMap.size > 0;

  // ── 3. Build Shotstack callback URL ───────────────────────────────────────
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim();
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

  if (isPaidPlan && !process.env.SHOTSTACK_PROD_API_KEY) {
    console.info(`[PROCESS] SHOTSTACK_PROD_API_KEY not set — paid plan falling back to stage key for video ${videoId}`);
  }

  const sharedParams = {
    templateKey: templateId,
    listingAddress,
    listingPrice,
    agentName:  agentName  || undefined,
    brandName:  brandName  || undefined,
    email:      email      || undefined,
    phone:      phone      || undefined,
    audioUrl:   validateExternalUrl(audioUrl),
    logoUrl:    validateExternalUrl(logoUrl),
    format:     (format ?? 'vertical') as 'vertical' | 'square' | 'horizontal',
    callbackUrl,
    apiKey: shotstackApiKey,
    env:    shotstackEnv,
  };

  // ── 4. Submit to Shotstack ─────────────────────────────────────────────────
  let render;
  try {
    if (hasAiVideos) {
      try {
        render = await generateMixedMediaVideo({ mediaItems, ...sharedParams });
      } catch (mixedErr) {
        console.error('Mixed-media render failed, falling back to template:', mixedErr);
        render = await generateVideo({ images, ...sharedParams });
      }
    } else {
      render = await generateVideo({ images, ...sharedParams });
    }
  } catch (err) {
    await markFailed();
    if (err instanceof ShotstackError) {
      console.error('Shotstack API error:', err.message);
    } else if (err instanceof FalError) {
      console.error('fal.ai error during Shotstack fallback path:', err.message);
    } else {
      console.error('Unexpected error calling video services:', err);
    }
    return;
  }

  // ── 5. Update record with render ID + conditionally increment usage ──────
  const aiRequestedButFullyFailed = falFailed && aiIndices.length > 0;

  // Critical: update the video record with render_id so the webhook can find it.
  // If this fails the video is orphaned — catch and mark failed.
  const { data: updatedRows, error: updateError } = await admin
    .from('videos')
    .update({ status: 'processing', render_id: render.id })
    .eq('id', videoId)
    .select('id');

  if (updateError || !updatedRows?.length) {
    const reason = updateError
      ? updateError.message
      : `no matching row for videoId ${videoId}`;
    console.error(`[PROCESS] Failed to store render_id for video ${videoId}: ${reason}`);
    const { error: failError } = await admin
      .from('videos')
      .update({ status: 'failed' })
      .eq('id', videoId);
    if (failError) {
      console.error(`[PROCESS] Recovery failed — video ${videoId} is orphaned:`, failError);
    }
    return;
  }

  // Non-critical side-effects — log failures but don't fail the job
  const sideEffects: Promise<unknown>[] = [];

  if (!aiRequestedButFullyFailed) {
    sideEffects.push(admin.rpc('increment_videos_used', { p_user_id: userId }));
  } else {
    console.info(`AI shots fully failed for video ${videoId} — usage counter not incremented.`);
  }

  if (isFree) {
    sideEffects.push(
      admin.from('free_generation_logs').insert({
        user_id:        userId,
        ip_address:     clientIp && clientIp !== '0.0.0.0' ? clientIp : null,
        fingerprint_id: fingerprintId ?? null,
      }),
    );
  }

  if (fingerprintId) {
    sideEffects.push(
      admin
        .from('profiles')
        .update({
          session_fingerprint:            fingerprintId,
          session_fingerprint_updated_at: new Date().toISOString(),
        })
        .eq('id', userId),
    );
  }

  const results = await Promise.allSettled(sideEffects);
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[PROCESS] Side-effect ${i} failed for video ${videoId}:`, result.reason);
    }
  });
}
