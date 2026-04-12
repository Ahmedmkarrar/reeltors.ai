import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { VideoCard } from '@/components/dashboard/VideoCard';
import { UpgradeButton, UpgradeLink } from '@/components/dashboard/UpgradeCTA';
import { PLAN_LIMITS } from '@/lib/stripe/plans';
import type { Profile, Video } from '@/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6)  return "Let's get after it";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 20) return "Good evening";
  return "Working late";
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const [{ data: profile }, { data: videos }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', session.user.id).single<Profile>(),
    supabase.from('videos').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(6),
  ]);

  if (!profile) redirect('/login');

  const allVideos   = (videos ?? []) as Video[];
  const totalVideos = allVideos.length;
  const readyVideos = allVideos.filter((v) => v.status === 'complete').length;
  const isUnlimited = profile.plan === 'pro' || profile.plan === 'growth';
  const videoLimit  = PLAN_LIMITS[profile.plan] ?? profile.videos_limit;
  const usedPct     = Math.min((profile.videos_used_this_month / Math.max(videoLimit, 1)) * 100, 100);
  const remaining   = isUnlimited ? '∞' : Math.max(0, videoLimit - profile.videos_used_this_month);
  const firstName   = profile.full_name?.split(' ')[0] || 'there';

  return (
    <div className="p-6 md:p-10 max-w-5xl">

      {/* Limit-reached banner */}
      {profile.videos_used_this_month >= videoLimit && !isUnlimited && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-[#FFF8F6] border border-[#FFCBB5] rounded-[12px] px-4 py-3">
          <p className="text-sm text-[#C04000]">You&apos;ve reached your monthly video limit.</p>
          <UpgradeButton className="shrink-0 text-xs font-semibold text-white bg-[#1A1714] hover:bg-[#2A2420] px-3 py-1.5 rounded-[8px] transition-colors">
            Upgrade
          </UpgradeButton>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <p className="text-sm text-[#ADADAD] mb-1">{getGreeting()}</p>
          <h1 className="font-syne font-extrabold text-[26px] tracking-tight text-[#1A1714]">
            {firstName}&apos;s Studio
          </h1>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-2 bg-[#1A1714] hover:bg-[#2A2420] text-white font-semibold text-sm px-4 py-2.5 rounded-[10px] transition-all shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Video
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Videos"  value={String(totalVideos)} />
        <StatCard label="Ready"         value={String(readyVideos)} highlight />
        <StatCard label="This Month"    value={String(profile.videos_used_this_month)} />
        <StatCard label="Plan"          value={profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} />
      </div>

      {/* Usage bar */}
      {!isUnlimited && (
        <div className="mb-10 bg-white border border-[#EBEBEB] rounded-[12px] px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#6B6760]">Monthly usage</span>
            <span className="text-sm font-mono text-[#1A1714]">
              {profile.videos_used_this_month}
              <span className="text-[#ADADAD]"> / {videoLimit}</span>
            </span>
          </div>
          <div className="h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${usedPct}%`,
                background: usedPct >= 90 ? '#FF5500' : usedPct >= 70 ? '#f59e0b' : '#F0B429',
              }}
            />
          </div>
          <p className="text-xs text-[#ADADAD] mt-2.5">
            {remaining} video{remaining === 1 ? '' : 's'} remaining ·{' '}
            <UpgradeLink className="text-[#1A1714] hover:underline font-medium">
              Upgrade for more →
            </UpgradeLink>
          </p>
        </div>
      )}

      {/* Recent videos */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne font-bold text-[17px] text-[#1A1714]">Recent Videos</h2>
          {allVideos.length > 0 && (
            <Link href="/videos" className="text-sm text-[#ADADAD] hover:text-[#1A1714] transition-colors flex items-center gap-1">
              View all
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          )}
        </div>

        {allVideos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white border border-[#EBEBEB] rounded-[12px] px-4 py-4 flex flex-col gap-2">
      <span className="text-[11px] text-[#ADADAD] font-normal">{label}</span>
      <span
        className="font-syne font-extrabold text-2xl leading-none"
        style={{ color: highlight ? '#C07A00' : '#1A1714' }}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-[#EBEBEB] rounded-[16px] p-12 md:p-16 text-center">
      <div className="w-12 h-12 bg-[#F5F5F3] rounded-[12px] flex items-center justify-center mx-auto mb-5">
        <svg className="w-6 h-6 text-[#ADADAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h3 className="font-syne font-bold text-[18px] mb-2 text-[#1A1714]">No videos yet</h3>
      <p className="text-[#ADADAD] text-sm mb-7 max-w-xs mx-auto leading-relaxed">
        Upload 3–15 listing photos and get a cinematic reel ready to post in under 60 seconds.
      </p>
      <Link
        href="/create"
        className="inline-flex items-center gap-2 bg-[#1A1714] hover:bg-[#2A2420] text-white font-semibold px-5 py-2.5 rounded-[10px] text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Create your first video
      </Link>

      <div className="flex flex-col sm:flex-row gap-6 justify-center mt-10 pt-8 border-t border-[#F0F0F0]">
        {[
          { step: '1', text: 'Upload 3–15 listing photos' },
          { step: '2', text: 'Add address & price (optional)' },
          { step: '3', text: 'Pick a template & generate' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-center gap-2.5 text-sm text-[#ADADAD]">
            <div className="w-5 h-5 rounded-full bg-[#F0F0F0] flex items-center justify-center text-[10px] font-semibold text-[#ADADAD] shrink-0">
              {step}
            </div>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
