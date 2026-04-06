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
  if (hour < 12) return "Let's close some deals";
  if (hour < 17) return "Time to go viral";
  if (hour < 20) return "Make tonight count";
  return "Night owl mode";
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: videos }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase.from('videos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
  ]);

  if (!profile) redirect('/login');

  const allVideos    = (videos ?? []) as Video[];
  const totalVideos  = allVideos.length;
  const readyVideos  = allVideos.filter((v) => v.status === 'complete').length;
  const isUnlimited  = profile.plan === 'pro' || profile.plan === 'growth';
  const videoLimit   = PLAN_LIMITS[profile.plan] ?? profile.videos_limit;
  const usedPct      = Math.min((profile.videos_used_this_month / Math.max(videoLimit, 1)) * 100, 100);
  const remaining    = isUnlimited ? '∞' : Math.max(0, videoLimit - profile.videos_used_this_month);
  const firstName    = profile.full_name?.split(' ')[0] || 'Realtor';

  return (
    <div className="p-6 md:p-8 max-w-5xl">

      {/* ── Limit-reached banner ── */}
      {profile.plan === 'free' && profile.videos_used_this_month >= videoLimit && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1a0800] border border-[#FF5500]/30 rounded-[8px] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-[#FF5500] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-[#FF5500]">You&apos;ve used your free video this month.</p>
          </div>
          <UpgradeButton className="shrink-0 text-sm font-bold text-[#FAFAF8] bg-[#FF5500] hover:bg-[#ff7744] px-4 py-1.5 rounded-[5px] transition-colors">
            Upgrade to Pro
          </UpgradeButton>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-syne font-extrabold text-2xl md:text-[28px] tracking-tight mb-1 text-[#1A1714]">
            {getGreeting()},{' '}
            <span className="text-gradient-lime">{firstName}</span>.
          </h1>
          <p className="text-[#6B6760] text-sm">
            {isUnlimited
              ? 'Unlimited plan — go create.'
              : `${remaining} video${remaining === 1 ? '' : 's'} remaining this month.`}
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 bg-[#F0B429] hover:bg-[#F5C842] text-[#1A1714] font-bold text-sm px-5 py-2.5 rounded-[6px] transition-all shadow-[0_0_20px_rgba(240,180,41,0.2)] hover:shadow-[0_0_30px_rgba(240,180,41,0.35)] self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Video
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Total Videos"
          value={String(totalVideos)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          }
        />
        <StatCard
          label="Ready"
          value={String(readyVideos)}
          accent
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="This Month"
          value={String(profile.videos_used_this_month)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
          }
        />
        <StatCard
          label="Plan"
          value={profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)}
          planColor={profile.plan === 'pro' || profile.plan === 'growth' ? '#F0B429' : undefined}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          }
        />
      </div>

      {/* ── Monthly usage bar ── */}
      {!isUnlimited && (
        <div className="mb-8 bg-[#FFFFFF] border border-[#EAE8E2] rounded-[8px] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#6B6760]">Monthly video quota</span>
            <span className="text-sm font-mono text-[#1A1714]">
              <span className="text-[#C07A00] font-bold">{profile.videos_used_this_month}</span>
              <span className="text-[#8A8682]"> / {videoLimit}</span>
            </span>
          </div>
          <div className="h-2 bg-[#EAE8E2] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${usedPct}%`,
                background: usedPct >= 90 ? '#FF5500' : usedPct >= 70 ? '#f59e0b' : '#F0B429',
                boxShadow: usedPct >= 90 ? '0 0 12px rgba(255,85,0,0.4)' : '0 0 12px rgba(240,180,41,0.25)',
              }}
            />
          </div>
          {profile.plan === 'free' && (
            <p className="text-xs text-[#8A8682] mt-2">
              On the free plan.{' '}
              <UpgradeLink className="text-[#F0B429] hover:underline">
                Upgrade for unlimited →
              </UpgradeLink>
            </p>
          )}
        </div>
      )}

      {/* ── Recent videos ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne font-bold text-lg text-[#1A1714]">Recent Videos</h2>
          {allVideos.length > 0 && (
            <Link href="/videos" className="text-sm text-[#C07A00] hover:text-[#8B5E00] transition-colors flex items-center gap-1">
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

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
  planColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
  planColor?: string;
}) {
  const valueColor = planColor ?? (accent ? '#C07A00' : '#1A1714');
  return (
    <div className="bg-[#FFFFFF] border border-[#EAE8E2] rounded-[8px] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#6B6760] font-medium uppercase tracking-wider">{label}</span>
        <span className="text-[#B8B4AE]">{icon}</span>
      </div>
      <span
        className="font-syne font-extrabold text-2xl leading-none"
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-[#FFFFFF] border border-[#EAE8E2] rounded-[10px] p-12 md:p-16 text-center">
      <div className="w-16 h-16 bg-[#F0B429] rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_4px_20px_rgba(240,180,41,0.3)]">
        <svg className="w-8 h-8 text-[#1A1714]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h3 className="font-syne font-bold text-xl mb-2">Your first video is one click away</h3>
      <p className="text-[#6B6760] text-sm mb-6 max-w-xs mx-auto leading-relaxed">
        Upload 3–15 listing photos and get a cinematic reel ready to post in under 60 seconds.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/create"
          className="inline-flex items-center gap-2 bg-[#F0B429] text-[#1A1714] font-bold px-6 py-3 rounded-[6px] text-sm hover:bg-[#F5C842] transition-colors shadow-[0_0_20px_rgba(240,180,41,0.25)]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Your First Video
        </Link>
      </div>
      {/* Mini how-it-works */}
      <div className="flex flex-col sm:flex-row gap-6 justify-center mt-10 pt-8 border-t border-[#EAE8E2]">
        {[
          { step: '1', text: 'Upload 3–15 listing photos' },
          { step: '2', text: 'Add address & price (optional)' },
          { step: '3', text: 'Pick a template & generate' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-center gap-2.5 text-sm text-[#6B6760]">
            <div className="w-6 h-6 rounded-full bg-[#EAE8E2] border border-[#E2DED6] flex items-center justify-center text-[10px] font-bold text-[#888888] shrink-0">
              {step}
            </div>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
