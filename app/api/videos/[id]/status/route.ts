import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getRenderStatus } from '@/lib/shotstack/client';
import { downloadAndStoreVideo } from '@/lib/storage';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();

  // Load video record
  const { data: video, error } = await admin
    .from('videos')
    .select('id, status, output_url, creatomate_render_id, user_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  // Already done — just return current state
  if (video.status === 'complete' || video.status === 'failed') {
    return NextResponse.json({ status: video.status, output_url: video.output_url });
  }

  // No render ID yet — still pending
  if (!video.creatomate_render_id) {
    return NextResponse.json({ status: video.status });
  }

  // Poll Creatomate for latest status
  let render;
  try {
    render = await getRenderStatus(video.creatomate_render_id);
  } catch {
    return NextResponse.json({ status: video.status });
  }

  if (render.status === 'done' && render.url) {
    // Store permanently in Supabase Storage
    let finalUrl = render.url;
    try {
      finalUrl = await downloadAndStoreVideo(video.creatomate_render_id, render.url!, user.id);

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

  // Still rendering
  return NextResponse.json({ status: 'processing' });
}
