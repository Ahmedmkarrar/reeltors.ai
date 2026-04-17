import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getRenderStatus } from '@/lib/shotstack/client';
import { downloadAndStoreVideo } from '@/lib/storage';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();

  // Load video record
  const { data: video, error } = await admin
    .from('videos')
    .select('id, status, output_url, thumbnail_url, render_id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  // Already done — return current state (thumbnail_url may be null if webhook hasn't fired yet)
  if (video.status === 'complete' || video.status === 'failed') {
    return NextResponse.json({
      status:        video.status,
      output_url:    video.output_url,
      thumbnail_url: video.thumbnail_url,
    });
  }

  // No render ID yet — still pending
  if (!video.render_id) {
    return NextResponse.json({ status: video.status });
  }

  // Poll Shotstack for latest status
  let render;
  try {
    render = await getRenderStatus(video.render_id);
  } catch {
    return NextResponse.json({ status: video.status });
  }

  if (render.status === 'done' && render.url) {
    let finalUrl = render.url;
    try {
      finalUrl = await downloadAndStoreVideo(video.render_id, render.url!, user.id);
    } catch (e) {
      console.error('Failed to store video, using CDN URL as fallback:', e);
    }

    await admin
      .from('videos')
      .update({ status: 'complete', output_url: finalUrl })
      .eq('id', video.id);

    return NextResponse.json({ status: 'complete', output_url: finalUrl });
  }

  if (render.status === 'failed' || render.error) {
    await admin
      .from('videos')
      .update({ status: 'failed' })
      .eq('id', video.id);
    return NextResponse.json({ status: 'failed' });
  }

  // Still rendering — surface Shotstack sub-status so the frontend stage stepper
  // can fast-forward to the correct stage rather than relying on time alone
  return NextResponse.json({ status: 'processing', renderStage: render.status });
}
