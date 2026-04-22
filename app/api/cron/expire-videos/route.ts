import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Videos stuck in pending/processing longer than this are considered dead
const STALE_THRESHOLD_MINUTES = 15;

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const admin = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    const { data, error } = await admin
      .from('videos')
      .update({ status: 'failed' })
      .in('status', ['pending', 'processing'])
      .lt('updated_at', cutoff)
      .select('id');

    if (error) {
      console.error('[expire-videos] DB update failed:', error);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    const expiredCount = data?.length ?? 0;
    if (expiredCount > 0) {
      console.log(`[expire-videos] Marked ${expiredCount} stale video(s) as failed:`, data?.map((v) => v.id));
    }

    return NextResponse.json({ success: true, expired: expiredCount });
  } catch (err) {
    console.error('[expire-videos] Cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
