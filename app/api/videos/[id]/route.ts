import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { deleteStoredVideo } from '@/lib/storage';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the video first to get the render ID for storage cleanup
    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('id, render_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Delete DB record (admin client to bypass RLS for service-level cleanup)
    const admin = getSupabaseAdmin();
    const { error: deleteError } = await admin
      .from('videos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to delete video record:', deleteError);
      return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
    }

    // Clean up stored files (best-effort, after DB delete)
    if (video.render_id) {
      deleteStoredVideo(video.render_id, user.id).catch((err) =>
        console.error('Storage cleanup failed (non-fatal):', err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete video error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
