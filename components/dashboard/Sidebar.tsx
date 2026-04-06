'use client';

import Link from 'next/link';
import { LogoIcon } from '@/components/ui/LogoIcon';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UpgradeModal } from '@/components/dashboard/UpgradeModal';
import { PLAN_LIMITS } from '@/lib/stripe/plans';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile;
}

const NAV = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: '/videos',
    label: 'My Videos',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
  {
    href: '/subscription',
    label: 'Subscription',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    href: '/account',
    label: 'Account',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    href: '/feedback',
    label: 'Feedback',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
];

const PLAN_LABELS: Record<string, string> = {
  free:    'Free',
  starter: 'Starter',
  growth:  'Growth',
  pro:     'Pro',
};

const PLAN_COLORS: Record<string, string> = {
  free:    '#6B6760',
  starter: '#5C5853',
  growth:  '#C07A00',
  pro:     '#059669',
};

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const videoLimit = PLAN_LIMITS[profile.plan] ?? profile.videos_limit;
  const usedPct    = Math.min((profile.videos_used_this_month / Math.max(videoLimit, 1)) * 100, 100);
  const planColor  = PLAN_COLORS[profile.plan] ?? '#6B6760';
  const initial     = (profile.full_name || profile.email || 'R').charAt(0).toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="w-[220px] shrink-0 hidden md:flex flex-col h-screen sticky top-0 border-r border-[#E2DED6]" style={{ background: '#F5F3EF' }}>

      {/* logo */}
      <div className="px-5 py-5 border-b border-[#E2DED6]">
        <Link href="/" className="flex items-center gap-2 group">
          <LogoIcon className="w-8 h-8" />
          <span className="font-syne font-extrabold text-[17px] text-[#1A1714] group-hover:text-[#F0B429] transition-colors">
            Reeltor<span className="text-[#F0B429]">.</span>ai
          </span>
        </Link>
      </div>

      {/* create cta */}
      <div className="px-4 py-4 border-b border-[#E2DED6]">
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 w-full bg-[#F0B429] hover:bg-[#F5C842] text-[#1A1714] font-bold text-sm rounded-[6px] py-2.5 transition-all shadow-[0_0_20px_rgba(240,180,41,0.2)] hover:shadow-[0_0_30px_rgba(240,180,41,0.35)]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Video
        </Link>
      </div>

      {/* nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={[
                'group flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-all duration-150 relative',
                active
                  ? 'bg-[#F0EDE6] text-[#1A1714]'
                  : 'text-[#5C5853] hover:text-[#3D3A36] hover:bg-[#F0EDE6]',
              ].join(' ')}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#C07A00] rounded-r-full" />
              )}
              <span className={active ? 'text-[#C07A00]' : 'text-[#8A8682] group-hover:text-[#5C5853] transition-colors'}>
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* plan + usage */}
      <div className="px-4 pb-3">
        <div className="bg-[#FFFFFF] border border-[#EAE8E2] rounded-[8px] p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-[#6B6760] font-medium uppercase tracking-wider">Plan</span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: planColor, background: `${planColor}18`, border: `1px solid ${planColor}30` }}
            >
              {PLAN_LABELS[profile.plan] ?? 'Free'}
            </span>
          </div>

          <div className="flex justify-between text-[11px] mb-2">
            <span className="text-[#6B6760]">Videos this month</span>
            <span className="text-[#888888] font-mono">
              {profile.videos_used_this_month} / {videoLimit}
            </span>
          </div>

          <div className="h-1 bg-[#EAE8E2] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${usedPct}%`,
                background: usedPct >= 90 ? '#FF5500' : usedPct >= 70 ? '#f59e0b' : '#F0B429',
              }}
            />
          </div>

          {profile.plan === 'free' && (
            <button
              onClick={() => setUpgradeOpen(true)}
              className="flex items-center gap-1.5 mt-3 text-[11px] text-[#FF5500] hover:text-[#ff7744] transition-colors font-medium w-full text-left"
            >
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
              Upgrade for unlimited videos
            </button>
          )}
        </div>
      </div>

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      {/* user row */}
      <div className="px-4 py-4 border-t border-[#E2DED6] flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: `linear-gradient(135deg, ${planColor}30, ${planColor}10)`,
            border: `1px solid ${planColor}40`,
            color: planColor,
          }}
        >
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[#1A1714] truncate leading-tight">
            {profile.full_name || 'Realtor'}
          </p>
          <p className="text-[10px] text-[#8A8682] truncate">{profile.email}</p>
        </div>

        <button
          onClick={handleSignOut}
          title="Sign out"
          className="text-[#B8B4AE] hover:text-[#5C5853] transition-colors p-1 rounded hover:bg-[#F0EDE6]"
        >
          <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
