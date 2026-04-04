import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateVideo, CreatomateError } from '@/lib/creatomate/client';
import type { CreateVideoPayload } from '@/types';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Parse + validate input ──────────────────────────────────────────────
  let body: CreateVideoPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { templateId, images, listingAddress, listingPrice, agentName, format, title } = body;

  if (!templateId || typeof templateId !== 'string') {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
  }
  if (!Array.isArray(images) || images.length < 1 || images.length > 15) {
    return NextResponse.json({ error: 'images must be an array of 1–15 URLs' }, { status: 400 });
  }
  if (images.some((url) => typeof url !== 'string' || !url.startsWith('http'))) {
    return NextResponse.json({ error: 'All images must be valid HTTP URLs' }, { status: 400 });
  }

  // ── 3. Load profile + check plan limits ────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, videos_used_this_month, videos_limit, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const isUnlimited = profile.plan === 'pro' || profile.plan === 'team';
  if (!isUnlimited && (profile.videos_used_this_month ?? 0) >= (profile.videos_limit ?? 1)) {
    return NextResponse.json(
      { error: 'Monthly video limit reached. Upgrade your plan to create more videos.', code: 'LIMIT_REACHED' },
      { status: 403 }
    );
  }

  // ── 4. Create pending video record first ───────────────────────────────────
  // Create the DB record before calling Creatomate so we always have an audit trail
  const admin = getSupabaseAdmin();
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

  // ── 5. Call Creatomate ─────────────────────────────────────────────────────
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/creatomate?token=${process.env.WEBHOOK_SECRET ?? ''}`
    : undefined;

  let render;
  try {
    render = await generateVideo({
      templateId,
      images,
      listingAddress,
      listingPrice,
      agentName,
      format: format ?? 'vertical',
      webhookUrl,
      metadata: { video_id: video.id, user_id: user.id },
    });
  } catch (err) {
    // Mark the video record as failed before returning
    await admin
      .from('videos')
      .update({ status: 'failed' })
      .eq('id', video.id);

    if (err instanceof CreatomateError) {
      console.error('Creatomate API error:', err.message);
      return NextResponse.json({ error: 'Video generation service error. Please try again.' }, { status: 502 });
    }
    console.error('Unexpected error calling Creatomate:', err);
    return NextResponse.json({ error: 'Failed to start video generation' }, { status: 500 });
  }

  // ── 6. Update record with render ID + atomically increment usage ───────────
  const [updateResult] = await Promise.allSettled([
    admin
      .from('videos')
      .update({ status: 'processing', creatomate_render_id: render.id })
      .eq('id', video.id),
    admin.rpc('increment_videos_used', { p_user_id: user.id }),
  ]);

  if (updateResult.status === 'rejected') {
    console.error('Failed to update video record after render start:', updateResult.reason);
    // Video is processing — non-fatal, carry on
  }

  return NextResponse.json({ videoId: video.id, renderId: render.id });
}
