import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.rpc('reset_monthly_videos');

    if (error) {
      console.error('Monthly usage reset failed:', error);
      return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
    }

    console.log('Monthly video usage reset completed:', new Date().toISOString());
    return NextResponse.json({ success: true, resetAt: new Date().toISOString() });
  } catch (err) {
    console.error('Cron reset error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
