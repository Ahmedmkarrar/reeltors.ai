import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// files older than this are safe to delete — any video job is long done by then
const STALE_HOURS = 48;
// process at most this many session folders per run to bound execution time
const MAX_SESSIONS = 300;

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const admin = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

    const { data: folders, error: listErr } = await admin.storage
      .from('listing-images')
      .list('tunnel', { limit: MAX_SESSIONS });

    if (listErr) {
      console.error('[clean-tunnel] failed to list tunnel folders:', listErr);
      return NextResponse.json({ error: 'Storage list failed' }, { status: 500 });
    }

    if (!folders?.length) {
      return NextResponse.json({ success: true, deleted: 0, sessions: 0 });
    }

    let totalDeleted = 0;
    let sessionsProcessed = 0;

    for (const folder of folders) {
      const { data: files } = await admin.storage
        .from('listing-images')
        .list(`tunnel/${folder.name}`);

      if (!files?.length) continue;

      const stalePaths = files
        .filter((f) => f.created_at && new Date(f.created_at) < cutoff)
        .map((f) => `tunnel/${folder.name}/${f.name}`);

      if (stalePaths.length === 0) continue;

      const { error: removeErr } = await admin.storage
        .from('listing-images')
        .remove(stalePaths);

      if (removeErr) {
        console.error(`[clean-tunnel] failed to delete ${stalePaths.length} file(s) from tunnel/${folder.name}:`, removeErr);
      } else {
        totalDeleted += stalePaths.length;
      }

      sessionsProcessed++;
    }

    console.log(`[clean-tunnel] deleted ${totalDeleted} file(s) across ${sessionsProcessed} session(s)`);
    return NextResponse.json({ success: true, deleted: totalDeleted, sessions: sessionsProcessed });
  } catch (err) {
    console.error('[clean-tunnel] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
