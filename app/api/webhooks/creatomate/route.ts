import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { downloadAndStoreVideo, downloadAndStoreThumbnail } from '@/lib/storage';
import { sendFirstVideoEmail } from '@/lib/resend/emails';

// Creatomate sends metadata back as a JSON string or object
function parseMetadata(raw: unknown): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  if (typeof raw === 'object') return raw as Record<string, string>;
  return {};
}

export async function POST(req: NextRequest) {
  // ── 1. Verify webhook token (skip check if WEBHOOK_SECRET not configured) ────
  const expectedToken = process.env.WEBHOOK_SECRET ?? '';
  if (expectedToken) {
    const token = req.nextUrl.searchParams.get('token');
    if (token !== expectedToken) {
      console.warn('Creatomate webhook: invalid or missing token');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // ── 2. Parse payload ─────────────────────────────────────────────────────────
  let payload: {
    id: string;
    status: string;
    url?: string;
    snapshot_url?: string;
    error_message?: string;
    metadata?: unknown;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id: renderId, status, url: renderUrl, snapshot_url: snapshotUrl, metadata: rawMeta } = payload;

  if (!renderId || !status) {
    return NextResponse.json({ error: 'Missing render id or status' }, { status: 400 });
  }

  const meta = parseMetadata(rawMeta);
  const videoId = meta.video_id;
  const userId  = meta.user_id;

  if (!videoId || !userId) {
    // Could be a test ping or a render without our metadata — acknowledge and ignore
    console.warn('Creatomate webhook: missing video_id/user_id in metadata, renderId:', renderId);
    return NextResponse.json({ received: true });
  }

  const admin = getSupabaseAdmin();

  // ── 3. Handle failed render ──────────────────────────────────────────────────
  if (status === 'failed') {
    await admin
      .from('videos')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', videoId)
      .eq('user_id', userId);

    console.error(`Creatomate render failed: renderId=${renderId} videoId=${videoId}`);
    return NextResponse.json({ received: true });
  }

  // ── 4. Handle succeeded render ───────────────────────────────────────────────
  if (status !== 'succeeded') {
    // Still in progress (planned/waiting/rendering) — nothing to do
    return NextResponse.json({ received: true });
  }

  if (!renderUrl) {
    console.error('Creatomate webhook: status=succeeded but no url, renderId:', renderId);
    await admin
      .from('videos')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', videoId);
    return NextResponse.json({ received: true });
  }

  // ── 5. Permanently store video + thumbnail ───────────────────────────────────
  let permanentVideoUrl: string;
  let permanentThumbUrl: string | null = null;

  try {
    permanentVideoUrl = await downloadAndStoreVideo(renderId, renderUrl, userId);
  } catch (err) {
    console.error('Failed to store video, falling back to CDN URL:', err);
    // Fallback: use Creatomate CDN URL (expires in 7 days) rather than failing the user
    permanentVideoUrl = renderUrl;
  }

  if (snapshotUrl) {
    try {
      permanentThumbUrl = await downloadAndStoreThumbnail(renderId, snapshotUrl, userId);
    } catch (err) {
      console.error('Failed to store thumbnail (non-fatal):', err);
    }
  }

  // ── 6. Update video record to complete ───────────────────────────────────────
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
    // Don't return 500 — Creatomate will retry and double-store
    return NextResponse.json({ received: true });
  }

  // ── 7. Send "video ready" email (best-effort) ────────────────────────────────
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profile?.email) {
      await sendFirstVideoEmail(
        profile.email,
        profile.full_name || 'there',
        permanentVideoUrl,
      );
    }
  } catch (err) {
    console.error('Failed to send video-ready email (non-fatal):', err);
  }

  return NextResponse.json({ received: true });
}
