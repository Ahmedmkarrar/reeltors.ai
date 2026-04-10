import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRenderStatus } from '@/lib/shotstack/client';

/**
 * Fallback status poller — used only when Supabase Realtime is unavailable.
 * The primary path is: Creatomate webhook → DB update → Realtime push.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ renderId: string }> }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { renderId } = await params;

    // Verify ownership: this render must belong to the requesting user
    const { data: video, error: ownershipError } = await supabase
      .from('videos')
      .select('id, status, output_url, thumbnail_url')
      .eq('creatomate_render_id', renderId)
      .eq('user_id', user.id)
      .single();

    if (ownershipError || !video) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // If webhook already completed the record, return DB state without hitting Creatomate
    if (video.status === 'complete' || video.status === 'failed') {
      return NextResponse.json({
        status:       video.status === 'complete' ? 'succeeded' : 'failed',
        outputUrl:    video.output_url ?? null,
        thumbnailUrl: video.thumbnail_url ?? null,
      });
    }

    // Still processing — call Creatomate for live status
    const render = await getRenderStatus(renderId);
    return NextResponse.json({
      status:       render.status === 'done' ? 'succeeded' : render.status,
      outputUrl:    render.url ?? null,
      thumbnailUrl: render.thumbnail ?? null,
    });
  } catch (err) {
    console.error('Status check error:', err);
    return NextResponse.json({ error: 'Failed to get render status' }, { status: 500 });
  }
}
