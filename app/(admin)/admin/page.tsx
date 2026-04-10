'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  newThisMonth: number;
  totalVideos: number;
  videosThisMonth: number;
  mrr: number;
  conversionRate: string;
  planBreakdown: Record<string, number>;
}

const PLAN_COLORS: Record<string, string> = {
  free:    '#8A8682',
  starter: '#5C5853',
  growth:  '#F0B429',
  pro:     '#22c55e',
};

export default function AdminOverviewPage() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 shimmer rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 shimmer rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-[#FF5500]">Failed to load stats.</div>;

  const topStats = [
    { label: 'MRR',             value: `$${stats.mrr.toFixed(2)}`,   sub: 'monthly recurring',      color: '#F0B429' },
    { label: 'Total Users',     value: stats.totalUsers,              sub: `${stats.newThisMonth} new this month`, color: '#FAFAF8' },
    { label: 'Paid Users',      value: stats.paidUsers,               sub: `${stats.conversionRate}% conversion`,  color: '#22c55e' },
    { label: 'Videos Created',  value: stats.totalVideos,             sub: `${stats.videosThisMonth} this month`,  color: '#60a5fa' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-syne font-extrabold text-2xl text-[#1A1714]">Overview</h1>
        <p className="text-[13px] text-[#8A8682] mt-1">Real-time snapshot of Reeltors.ai</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {topStats.map(({ label, value, sub, color }) => (
          <div key={label} className="bg-[#141210] rounded-xl border border-[#2E2B27] p-5">
            <p className="text-[11px] font-mono text-[#4A4744] uppercase tracking-wider mb-2">{label}</p>
            <p className="font-syne font-extrabold text-3xl leading-none mb-1" style={{ color }}>{value}</p>
            <p className="text-[11px] text-[#4A4744]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="bg-white rounded-xl border border-[#E2DED6] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <div className="px-6 py-4 border-b border-[#F0EDE6]">
          <h2 className="text-[13px] font-semibold text-[#1A1714]">Users by Plan</h2>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.planBreakdown).map(([plan, count]) => {
            const pct = stats.totalUsers > 0 ? ((count / stats.totalUsers) * 100).toFixed(0) : '0';
            return (
              <div key={plan} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold capitalize" style={{ color: PLAN_COLORS[plan] }}>{plan}</span>
                  <span className="text-[12px] font-mono text-[#1A1714]">{count}</span>
                </div>
                <div className="h-1.5 bg-[#F0EDE6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: PLAN_COLORS[plan] }}
                  />
                </div>
                <span className="text-[10px] text-[#8A8682]">{pct}% of users</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { href: '/admin/users', title: 'Manage Users', desc: 'Search, filter, change plans, delete accounts', icon: '👥' },
          { href: '/admin/videos', title: 'All Videos', desc: 'Browse every video generated across all users', icon: '🎬' },
        ].map(({ href, title, desc, icon }) => (
          <a
            key={href}
            href={href}
            className="bg-white rounded-xl border border-[#E2DED6] p-5 flex items-start gap-4 hover:border-[#F0B429]/40 hover:shadow-[0_0_20px_rgba(240,180,41,0.06)] transition-all duration-200"
          >
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-semibold text-[14px] text-[#1A1714] mb-0.5">{title}</p>
              <p className="text-[12px] text-[#8A8682]">{desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
