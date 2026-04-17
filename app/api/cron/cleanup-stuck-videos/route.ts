import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// videos stuck in pending/processing for over 10 minutes are considered dead
const STUCK_THRESHOLD_MINUTES = 10;

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const admin = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    const { data, error } = await admin
      .from('videos')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .in('status', ['pending', 'processing'])
      .lt('created_at', cutoff)
      .select('id');

    if (error) {
      console.error('Stuck video cleanup failed:', error);
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }

    const count = data?.length ?? 0;
    if (count > 0) {
      console.log(`Stuck video cleanup: marked ${count} video(s) as failed`, data?.map((v) => v.id));
    }

    return NextResponse.json({ cleaned: count, cutoff });
  } catch (err) {
    console.error('Stuck video cleanup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
