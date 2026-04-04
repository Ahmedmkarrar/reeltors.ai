import type { Profile } from '@/types';

export function UsageBar({ profile }: { profile: Profile }) {
  const pct = Math.min(
    (profile.videos_used_this_month / Math.max(profile.videos_limit, 1)) * 100,
    100
  );
  const isNearLimit = pct >= 80;

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-[6px] p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Monthly Usage</span>
        <span className={`text-sm font-mono ${isNearLimit ? 'text-[#FF5500]' : 'text-[#888888]'}`}>
          {profile.videos_used_this_month} / {profile.videos_limit === 999 ? '∞' : profile.videos_limit}
        </span>
      </div>
      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isNearLimit ? 'bg-[#FF5500]' : 'bg-[#C8FF00]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isNearLimit && profile.plan === 'free' && (
        <p className="text-xs text-[#FF5500] mt-2">
          You&apos;re almost at your limit.{' '}
          <a href="/pricing" className="underline hover:text-[#FF7733]">
            Upgrade to Pro
          </a>
        </p>
      )}
    </div>
  );
}
