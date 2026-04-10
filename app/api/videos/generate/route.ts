import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateVideo, generateMixedMediaVideo, ShotstackError } from '@/lib/shotstack/client';
import type { MediaItem } from '@/lib/shotstack/client';
import { generateDroneShotsForIndices, clampAiIndices, FalError } from '@/lib/fal/client';
import type { CreateVideoPayload } from '@/types';
import { isDisposableEmail, getClientIp } from '@/lib/abuse/email';

// Allow up to 5 minutes — fal.ai video generation takes ~1–2 min per clip.
// Up to 3 clips run in parallel, so worst-case ~3 min before Creatomate starts.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.email && isDisposableEmail(user.email)) {
    return NextResponse.json(
      { error: 'Disposable email addresses are not allowed.', code: 'DISPOSABLE_EMAIL' },
      { status: 403 },
    );
  }

  // ── 2. Parse + validate input ──────────────────────────────────────────────
  let body: CreateVideoPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { templateId, images, aiVideoIndices: rawAiIndices, listingAddress, listingPrice, agentName, brandName, email, phone, format, title, videoPrompt } = body;

  if (!templateId || typeof templateId !== 'string') {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
  }
  if (!Array.isArray(images) || images.length < 1 || images.length > 15) {
    return NextResponse.json({ error: 'images must be an array of 1–15 URLs' }, { status: 400 });
  }
  if (images.some((url) => typeof url !== 'string' || !url.startsWith('http'))) {
    return NextResponse.json({ error: 'All images must be valid HTTP URLs' }, { status: 400 });
  }

  // AI drone shots: only run if user explicitly selected indices (empty = no AI).
  const aiIndices = clampAiIndices(
    Array.isArray(rawAiIndices) ? rawAiIndices : [],
    images.length,
  );

  // ── 3. Load profile + check plan limits ────────────────────────────────────
  const admin = getSupabaseAdmin();

  let { data: profile } = await supabase
    .from('profiles')
    .select('plan, videos_used_this_month, videos_limit, full_name, email, phone, brand_name, email_verified, session_fingerprint, session_fingerprint_updated_at')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // DB trigger may have failed — upsert to recover
    const { data: upserted } = await admin
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? '',
          full_name: (user.user_metadata?.full_name as string) ?? null,
          email_verified: user.app_metadata?.provider !== 'email',
        },
        { onConflict: 'id' }
      )
      .select('plan, videos_used_this_month, videos_limit, full_name, email, phone, brand_name, email_verified, session_fingerprint, session_fingerprint_updated_at')
      .single();

    if (!upserted) {
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }
    profile = upserted;
  }

  const isUnlimited = profile.plan === 'pro' || profile.plan === 'team';
  if (!isUnlimited && (profile.videos_used_this_month ?? 0) >= (profile.videos_limit ?? 1)) {
    return NextResponse.json(
      { error: 'Monthly video limit reached. Upgrade your plan to create more videos.', code: 'LIMIT_REACHED' },
      { status: 403 }
    );
  }

  const clientIp = getClientIp(req);
  // x-device-fingerprint is set by the FingerprintJS client script
  const fingerprintId = req.headers.get('x-device-fingerprint') ?? null;
  const isFree = !isUnlimited && profile.plan !== 'starter';

  if (isFree) {
    // layer 1: require email OTP verification before first free render
    if (!profile.email_verified) {
      return NextResponse.json(
        { error: 'Please verify your email before generating a video.', code: 'EMAIL_NOT_VERIFIED' },
        { status: 403 },
      );
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // layer 3 + 4: check if this IP or fingerprint has already been used for a free generation
    // by a different account in the last 30 days (signals abuse, not the same user returning)
    const [ipCheck, fpCheck] = await Promise.all([
      clientIp !== '0.0.0.0'
        ? admin
            .from('free_generation_logs')
            .select('user_id', { count: 'exact', head: false })
            .eq('ip_address', clientIp)
            .neq('user_id', user.id)
            .gte('created_at', thirtyDaysAgo)
            .limit(1)
        : Promise.resolve({ data: [], error: null }),
      fingerprintId
        ? admin
            .from('free_generation_logs')
            .select('user_id', { count: 'exact', head: false })
            .eq('fingerprint_id', fingerprintId)
            .neq('user_id', user.id)
            .gte('created_at', thirtyDaysAgo)
            .limit(1)
        : Promise.resolve({ data: [], error: null }),
    ]);

    // fingerprint match = hard block (strongest signal)
    if (fpCheck.data && fpCheck.data.length > 0) {
      return NextResponse.json(
        { error: 'Your free video has already been used. Upgrade to create more.', code: 'DEVICE_LIMIT_REACHED' },
        { status: 403 },
      );
    }

    // IP match alone = soft block with upgrade prompt (shared IPs can be false positives)
    if (ipCheck.data && ipCheck.data.length > 0) {
      return NextResponse.json(
        { error: 'A free video was already generated from your network. Upgrade to create more.', code: 'IP_LIMIT_REACHED' },
        { status: 403 },
      );
    }
  } else {
    // layer 5: concurrent session check for paid plans
    // if the stored fingerprint differs and was updated very recently, another device is actively using this account
    const storedFingerprint = profile.session_fingerprint;
    const storedUpdatedAt = profile.session_fingerprint_updated_at;

    if (
      fingerprintId &&
      storedFingerprint &&
      storedFingerprint !== fingerprintId &&
      storedUpdatedAt
    ) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      if (storedUpdatedAt > fiveMinutesAgo) {
        return NextResponse.json(
          { error: 'This account is currently active on another device.', code: 'CONCURRENT_SESSION' },
          { status: 403 },
        );
      }
    }
  }

  // ── 4. Create pending video record ─────────────────────────────────────────
  const videoTitle = (title || listingAddress || 'My Listing Video').slice(0, 255);

  const { data: video, error: insertError } = await admin
    .from('videos')
    .insert({
      user_id:         user.id,
      title:           videoTitle,
      status:          'pending',
      template_id:     templateId,
      listing_address: listingAddress?.slice(0, 500) ?? null,
      listing_price:   listingPrice?.slice(0, 50)   ?? null,
      agent_name:      agentName?.slice(0, 200)      ?? null,
      source_images:   images,
      format:          format ?? 'vertical',
    })
    .select('id')
    .single();

  if (insertError || !video) {
    console.error('Failed to create video record:', insertError);
    return NextResponse.json({ error: 'Failed to create video record' }, { status: 500 });
  }

  // ── 5. Generate AI drone shots via fal.ai (parallel, max 3) ───────────────
  // aiIndices are already clamped to MAX_AI_VIDEOS (3) by clampAiIndices.
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
    console.warn('FAL_KEY not set — skipping AI drone shot generation, using images as-is');
  }

  // ── 6. Build the final media array (videos + images) ──────────────────────
  const mediaItems: MediaItem[] = images.map((url, idx) => {
    const videoUrl = falVideoMap.get(idx);
    return videoUrl
      ? { type: 'video' as const, url: videoUrl }
      : { type: 'image' as const, url };
  });

  const hasAiVideos = falVideoMap.size > 0;

  // ── 7. Call Creatomate ─────────────────────────────────────────────────────
  // Only send a webhook if we have a publicly reachable URL (not localhost)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const isPublic = appUrl.startsWith('https://');
  const buildCallbackUrl = (extra: Record<string, string>) => {
    if (!isPublic) return undefined;
    const url = new URL(`${appUrl}/api/webhooks/shotstack`);
    if (process.env.WEBHOOK_SECRET) url.searchParams.set('token', process.env.WEBHOOK_SECRET);
    Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  };
  const callbackUrl = buildCallbackUrl({ video_id: video.id, user_id: user.id });

  const sharedParams = {
    listingAddress,
    listingPrice,
    agentName:  agentName  || profile.full_name  || undefined,
    brandName:  brandName  || profile.brand_name || undefined,
    email:      email      || profile.email       || undefined,
    phone:      phone      || profile.phone       || undefined,
    format: (format ?? 'vertical') as 'vertical' | 'square' | 'horizontal',
    callbackUrl,
  };

  let render;
  try {
    if (hasAiVideos) {
      // Custom timeline: fal.ai videos + static images stitched together
      try {
        render = await generateMixedMediaVideo({ mediaItems, ...sharedParams });
      } catch (mixedErr) {
        // Mixed-media failed — log it and fall back to the standard template
        console.error('Mixed-media render failed, falling back to template:', mixedErr);
        render = await generateVideo({ templateKey: templateId, images, ...sharedParams });
      }
    } else {
      // No AI videos (fal.ai skipped/failed) — use existing template approach
      render = await generateVideo({ templateKey: templateId, images, ...sharedParams });
    }
  } catch (err) {
    await admin
      .from('videos')
      .update({ status: 'failed' })
      .eq('id', video.id);

    if (err instanceof ShotstackError) {
      console.error('Shotstack API error:', err.message);
      return NextResponse.json({ error: `Shotstack: ${err.message}` }, { status: 502 });
    }
    if (err instanceof FalError) {
      console.error('fal.ai error during Creatomate fallback path:', err.message);
      return NextResponse.json({ error: 'AI video generation failed. Please try again.' }, { status: 502 });
    }
    console.error('Unexpected error calling video services:', err);
    return NextResponse.json({ error: 'Failed to start video generation' }, { status: 500 });
  }

  // ── 8. Update record with render ID + conditionally increment usage ──────
  // If the user requested AI shots but every single one failed, we fall back
  // to a plain static video — don't penalise them by counting it against their
  // monthly limit. Only skip when ALL AI shots failed (falFailed=true); partial
  // success (some shots generated) still counts normally.
  const aiRequestedButFullyFailed = falFailed && aiIndices.length > 0;

  const ops: Promise<unknown>[] = [
    Promise.resolve(
      admin
        .from('videos')
        .update({
          status:               'processing',
          creatomate_render_id: render.id,
        })
        .eq('id', video.id)
    ),
  ];

  if (!aiRequestedButFullyFailed) {
    ops.push(Promise.resolve(admin.rpc('increment_videos_used', { p_user_id: user.id })));
  } else {
    console.info(`AI shots fully failed for video ${video.id} — usage counter not incremented.`);
  }

  // layer 3 + 4: log free-tier generation for future IP/fingerprint checks
  if (isFree) {
    ops.push(
      Promise.resolve(
        admin.from('free_generation_logs').insert({
          user_id: user.id,
          ip_address: clientIp !== '0.0.0.0' ? clientIp : null,
          fingerprint_id: fingerprintId,
        }),
      ),
    );
  }

  // layer 5: update session fingerprint so concurrent-session detection stays current
  if (fingerprintId) {
    ops.push(
      Promise.resolve(
        admin
          .from('profiles')
          .update({
            session_fingerprint: fingerprintId,
            session_fingerprint_updated_at: new Date().toISOString(),
          })
          .eq('id', user.id),
      ),
    );
  }

  const [updateResult] = await Promise.allSettled(ops);

  if (updateResult.status === 'rejected') {
    console.error('Failed to update video record after render start:', updateResult.reason);
    // Non-fatal — video is processing
  }

  return NextResponse.json({
    videoId:           video.id,
    renderId:          render.id,
    aiVideosGenerated: falVideoMap.size,
    aiVideosFailed:    aiRequestedButFullyFailed,
  });
}
