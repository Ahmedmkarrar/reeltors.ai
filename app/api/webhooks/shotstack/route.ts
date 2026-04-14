import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { downloadAndStoreVideo, downloadAndStoreThumbnail } from '@/lib/storage';
import { sendFirstVideoEmail } from '@/lib/resend/emails';
import { startTunnelEmailSequence } from '@/lib/resend/tunnel-emails';

// Shotstack sends status "done" for success, "failed" for failure.
// video_id, user_id, and tunnel_session_id are embedded as query params
// in the callback URL since Shotstack has no metadata passthrough field.

interface ShotstackWebhookPayload {
  id: string;
  status: 'queued' | 'fetching' | 'rendering' | 'saving' | 'done' | 'failed';
  url?: string;
  thumbnail?: string | null;
  poster?: string | null;
  error?: string;
}

async function handleTunnelWebhook(
  admin: ReturnType<typeof getSupabaseAdmin>,
  renderId: string,
  status: string,
  renderUrl: string | null,
  thumbnailUrl: string | null,
  tunnelSessionId: string,
): Promise<NextResponse> {
  if (status === 'failed') {
    await admin
      .from('tunnel_sessions')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', tunnelSessionId);
    return NextResponse.json({ received: true });
  }

  if (status !== 'done') return NextResponse.json({ received: true });

  if (!renderUrl) {
    await admin
      .from('tunnel_sessions')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', tunnelSessionId);
    return NextResponse.json({ received: true });
  }

  let permanentVideoUrl: string;
  let permanentThumbUrl: string | null = null;

  try {
    permanentVideoUrl = await downloadAndStoreVideo(renderId, renderUrl, `tunnel/${tunnelSessionId}`);
  } catch {
    permanentVideoUrl = renderUrl;
  }

  if (thumbnailUrl) {
    try {
      permanentThumbUrl = await downloadAndStoreThumbnail(renderId, thumbnailUrl, `tunnel/${tunnelSessionId}`);
    } catch {
      // non-fatal
    }
  }

  await admin
    .from('tunnel_sessions')
    .update({
      status:        'complete',
      output_url:    permanentVideoUrl,
      thumbnail_url: permanentThumbUrl ?? null,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', tunnelSessionId);

  try {
    const { data: session } = await admin
      .from('tunnel_sessions')
      .select('email')
      .eq('id', tunnelSessionId)
      .single();

    if (session?.email) {
      await startTunnelEmailSequence(session.email, permanentVideoUrl);
    }
  } catch (err) {
    console.error('Failed to start tunnel email sequence (non-fatal):', err);
  }

  return NextResponse.json({ received: true });
}

export async function POST(req: NextRequest) {
  // ── 1. Verify webhook token ───────────────────────────────────────────────
  const token         = req.nextUrl.searchParams.get('token');
  const expectedToken = process.env.WEBHOOK_SECRET?.trim();

  if (expectedToken && token !== expectedToken) {
    console.warn('Shotstack webhook: invalid token');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── 2. Parse payload ──────────────────────────────────────────────────────
  let payload: ShotstackWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id: renderId, status, url: renderUrl, thumbnail, poster } = payload;
  const thumbnailUrl = thumbnail ?? poster ?? null;

  if (!renderId || !status) {
    return NextResponse.json({ error: 'Missing render id or status' }, { status: 400 });
  }

  // metadata is passed as query params in the callback URL
  const tunnelSessionId = req.nextUrl.searchParams.get('tunnel_session_id');
  const videoId         = req.nextUrl.searchParams.get('video_id');
  const userId          = req.nextUrl.searchParams.get('user_id');

  const admin = getSupabaseAdmin();

  if (tunnelSessionId) {
    return handleTunnelWebhook(admin, renderId, status, renderUrl ?? null, thumbnailUrl, tunnelSessionId);
  }

  if (!videoId || !userId) {
    console.warn('Shotstack webhook: missing video_id/user_id in callback URL, renderId:', renderId);
    return NextResponse.json({ received: true });
  }

  // ── 3. Handle failed render ───────────────────────────────────────────────
  if (status === 'failed') {
    await admin
      .from('videos')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', videoId)
      .eq('user_id', userId);

    console.error(`Shotstack render failed: renderId=${renderId} videoId=${videoId}`);
    return NextResponse.json({ received: true });
  }

  // ── 4. Handle succeeded render ────────────────────────────────────────────
  if (status !== 'done') return NextResponse.json({ received: true });

  if (!renderUrl) {
    console.error('Shotstack webhook: status=done but no url, renderId:', renderId);
    await admin
      .from('videos')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', videoId);
    return NextResponse.json({ received: true });
  }

  // ── 5. Permanently store video + thumbnail ────────────────────────────────
  let permanentVideoUrl: string;
  let permanentThumbUrl: string | null = null;

  try {
    permanentVideoUrl = await downloadAndStoreVideo(renderId, renderUrl, userId);
  } catch (err) {
    console.error('Failed to store video, falling back to CDN URL:', err);
    permanentVideoUrl = renderUrl;
  }

  if (thumbnailUrl) {
    try {
      permanentThumbUrl = await downloadAndStoreThumbnail(renderId, thumbnailUrl, userId);
    } catch (err) {
      console.error('Failed to store thumbnail (non-fatal):', err);
    }
  }

  // ── 6. Update video record to complete ────────────────────────────────────
  const { error: updateError } = await admin
    .from('videos')
    .update({
      status:        'complete',
      output_url:    permanentVideoUrl,
      thumbnail_url: permanentThumbUrl ?? null,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', videoId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to update video record to complete:', updateError);
    return NextResponse.json({ received: true });
  }

  // ── 7. Send "video ready" email (best-effort) ─────────────────────────────
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profile?.email) {
      await sendFirstVideoEmail(profile.email, profile.full_name || 'there', permanentVideoUrl);
    }
  } catch (err) {
    console.error('Failed to send video-ready email (non-fatal):', err);
  }

  return NextResponse.json({ received: true });
}
