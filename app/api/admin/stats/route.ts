import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PLANS } from '@/lib/stripe/plans';

export async function GET() {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();

  // Fetch all profiles
  const { data: profiles } = await admin
    .from('profiles')
    .select('plan, videos_used_this_month, created_at, subscription_status');

  // Fetch all videos
  const { data: videos } = await admin
    .from('videos')
    .select('status, created_at');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalUsers   = profiles?.length ?? 0;
  const paidUsers    = profiles?.filter(p => p.plan !== 'free').length ?? 0;
  const freeUsers    = totalUsers - paidUsers;
  const newThisMonth = profiles?.filter(p => new Date(p.created_at ?? '') > thirtyDaysAgo).length ?? 0;
  const totalVideos  = videos?.length ?? 0;
  const videosThisMonth = videos?.filter(v => new Date(v.created_at ?? '') > thirtyDaysAgo).length ?? 0;

  // MRR calculation
  const planPrices: Record<string, number> = {
    starter: PLANS.starter.price,
    growth:  PLANS.growth.price,
    pro:     PLANS.pro.price,
  };
  const mrr = profiles?.reduce((sum, p) => {
    return sum + (planPrices[p.plan ?? ''] ?? 0);
  }, 0) ?? 0;

  const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : '0.0';

  // Plan breakdown
  const planBreakdown: Record<string, number> = { free: 0, starter: 0, growth: 0, pro: 0 };
  profiles?.forEach(p => {
    const key = p.plan ?? 'free';
    planBreakdown[key] = (planBreakdown[key] ?? 0) + 1;
  });

  return NextResponse.json({
    totalUsers,
    paidUsers,
    freeUsers,
    newThisMonth,
    totalVideos,
    videosThisMonth,
    mrr,
    conversionRate,
    planBreakdown,
  });
}
