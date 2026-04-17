import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { CreateVideoPayload } from '@/types';
import { isDisposableEmail, getClientIp } from '@/lib/abuse/email';
import { clampAiIndices } from '@/lib/fal/client';

// Needs enough headroom to wait for the process route to acknowledge (202).
// The process route itself has maxDuration=300 and uses waitUntil internally.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

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

  const {
    templateId, images, aiVideoIndices: rawAiIndices,
    listingAddress, listingPrice, agentName, brandName,
    email, phone, format, title, videoPrompt, audioUrl, logoUrl,
  } = body;

  if (!templateId || typeof templateId !== 'string') {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
  }
  if (!Array.isArray(images) || images.length < 1 || images.length > 15) {
    return NextResponse.json({ error: 'images must be an array of 1–15 URLs' }, { status: 400 });
  }
  if (images.some((url) => typeof url !== 'string' || !url.startsWith('http'))) {
    return NextResponse.json({ error: 'All images must be valid HTTP URLs' }, { status: 400 });
  }

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
    const { data: upserted } = await admin
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? '',
          full_name: (user.user_metadata?.full_name as string) ?? null,
          email_verified: true,
        },
        { onConflict: 'id' },
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
      { status: 403 },
    );
  }

  const clientIp = getClientIp(req);
  const fingerprintId = req.headers.get('x-device-fingerprint') ?? null;
  const isFree = profile.plan === 'free' || !profile.plan;

  if (isFree) {
    if (!profile.email_verified) {
      return NextResponse.json(
        { error: 'Please verify your email before generating a video.', code: 'EMAIL_NOT_VERIFIED' },
        { status: 403 },
      );
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

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

    if (fpCheck.data && fpCheck.data.length > 0) {
      return NextResponse.json(
        { error: 'Your free video has already been used. Upgrade to create more.', code: 'DEVICE_LIMIT_REACHED' },
        { status: 403 },
      );
    }

    if (ipCheck.data && ipCheck.data.length > 0) {
      return NextResponse.json(
        { error: 'A free video was already generated from your network. Upgrade to create more.', code: 'IP_LIMIT_REACHED' },
        { status: 403 },
      );
    }
  } else {
    const storedFingerprint = profile.session_fingerprint;
    const storedUpdatedAt = profile.session_fingerprint_updated_at;

    if (fingerprintId && storedFingerprint && storedFingerprint !== fingerprintId && storedUpdatedAt) {
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
      listing_price:   listingPrice?.slice(0, 50)    ?? null,
      agent_name:      agentName?.slice(0, 200)       ?? null,
      source_images:   images,
      format:          format ?? 'vertical',
    })
    .select('id')
    .single();

  if (insertError || !video) {
    console.error('Failed to create video record:', insertError);
    return NextResponse.json({ error: 'Failed to create video record' }, { status: 500 });
  }

  // ── 5. Fire-and-forget the heavy processing (fal.ai + Shotstack) ──────────
  // The process route runs as its own independent Vercel Function invocation
  // with its own maxDuration=300, so the client gets an immediate 202.
  //
  // VERCEL_URL is the deployment-specific URL which has Vercel team auth
  // protection enabled — external HTTP calls to it return 401 before reaching
  // our code. Use the production domain (NEXT_PUBLIC_APP_URL) instead, which
  // has no protection. Fall back to localhost in local development.
  // In local dev, always use localhost for internal server-to-server calls
  // (the NEXT_PUBLIC_APP_URL may be a localtunnel URL that's unreliable).
  // On Vercel, use the public URL to bypass deployment auth protection.
  const processUrl = `${process.env.BACKEND_URL}/api/generate`;

  const isPaidPlan = profile.plan === 'starter' || profile.plan === 'growth' || profile.plan === 'pro' || profile.plan === 'team';

  // The process route now responds 202 immediately and runs heavy work via its
  // own waitUntil, so this fetch resolves fast (no multi-minute wait).
  const processPromise = fetch(processUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': (process.env.WEBHOOK_SECRET ?? '').replace(/[^\x20-\x7E]/g, ''),
    },
    body: JSON.stringify({
      videoId:       video.id,
      userId:        user.id,
      images,
      aiIndices,
      templateId,
      listingAddress,
      listingPrice,
      agentName:     agentName     || profile.full_name  || undefined,
      brandName:     brandName     || profile.brand_name || undefined,
      email:         email         || profile.email      || undefined,
      phone:         phone         || profile.phone      || undefined,
      format:        format ?? 'vertical',
      audioUrl,
      logoUrl,
      videoPrompt,
      isPaidPlan,
      isFree,
      clientIp,
      fingerprintId,
    }),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, string>;
      console.error(`Process route returned ${res.status}:`, body.error ?? '(no message)');
      await admin.from('videos').update({ status: 'failed' }).eq('id', video.id);
    }
  }).catch((err) => {
    console.error('Failed to reach process route:', err);
    void Promise.resolve(admin.from('videos').update({ status: 'failed' }).eq('id', video.id));
  });

  waitUntil(processPromise);

  return NextResponse.json({ videoId: video.id }, { status: 202 });
}
