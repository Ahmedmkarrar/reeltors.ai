'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PLANS } from '@/lib/stripe/plans';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

const PLAN_META: Record<string, { color: string; label: string; bg: string; border: string }> = {
  free:    { color: '#6B6760', label: 'Free',    bg: 'rgba(107,103,96,0.08)',  border: 'rgba(107,103,96,0.2)'  },
  starter: { color: '#5C5853', label: 'Starter', bg: 'rgba(92,88,83,0.08)',    border: 'rgba(92,88,83,0.2)'    },
  growth:  { color: '#C07A00', label: 'Growth',  bg: 'rgba(240,180,41,0.10)',  border: 'rgba(240,180,41,0.25)' },
  pro:     { color: '#059669', label: 'Pro',     bg: 'rgba(5,150,105,0.08)',   border: 'rgba(5,150,105,0.2)'   },
};

export default function AccountPage() {
  const supabase = createClient();
  const [profile,         setProfile]         = useState<Profile | null>(null);
  const [fullName,        setFullName]        = useState('');
  const [saving,          setSaving]          = useState(false);
  const [portalLoading,   setPortalLoading]   = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>();
      if (data) { setProfile(data); setFullName(data.full_name || ''); }
    }
    load();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
    setSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Profile saved');
    setProfile((p) => p ? { ...p, full_name: fullName } : p);
  }

  async function handlePortal() {
    setPortalLoading(true);
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const { url } = await res.json();
    setPortalLoading(false);
    if (url) window.location.href = url;
    else toast.error('Could not open billing portal');
  }

  async function handleUpgrade(plan: string) {
    setCheckoutLoading(plan);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const { url, error } = await res.json();
    setCheckoutLoading('');
    if (error) { toast.error(error); return; }
    window.location.href = url;
  }

  if (!profile) {
    return (
      <div className="p-6 md:p-8 max-w-2xl space-y-4">
        <div className="h-8 shimmer rounded w-48 mb-6" />
        {[1,2,3].map((i) => <div key={i} className="h-32 shimmer rounded-[10px]" />)}
      </div>
    );
  }

  const planMeta  = PLAN_META[profile.plan] ?? PLAN_META.free;
  const usedPct   = Math.min((profile.videos_used_this_month / Math.max(profile.videos_limit, 1)) * 100, 100);
  const isUnlimited = profile.plan === 'pro' || profile.plan === 'growth';
  const isPaid    = profile.plan !== 'free';

  return (
    <div className="p-6 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="font-syne font-extrabold text-2xl tracking-tight">Account Settings</h1>
        <p className="text-[#6B6760] text-sm mt-1">Manage your profile and subscription.</p>
      </div>

      {/* ── Profile ── */}
      <section className="bg-[#FFFFFF] border border-[#EAE8E2] rounded-[10px] p-6">
        <h2 className="font-syne font-semibold text-base mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6B6760]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          Profile
        </h2>

        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
            style={{
              background: `linear-gradient(135deg, ${planMeta.color}25, ${planMeta.color}10)`,
              border: `2px solid ${planMeta.color}40`,
              color: planMeta.color,
            }}
          >
            {(profile.full_name || profile.email || 'R').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[#1A1714]">{profile.full_name || 'No name set'}</p>
            <p className="text-sm text-[#6B6760]">{profile.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            label="Email"
            value={profile.email}
            disabled
            className="opacity-40 cursor-not-allowed"
          />
          <div className="flex justify-end pt-1">
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </section>

      {/* ── Subscription ── */}
      <section className="bg-[#FFFFFF] border border-[#EAE8E2] rounded-[10px] p-6">
        <h2 className="font-syne font-semibold text-base mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6B6760]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          Subscription
        </h2>

        {/* Plan card */}
        <div
          className="flex items-center justify-between p-4 rounded-[8px] mb-5"
          style={{ background: planMeta.bg, border: `1px solid ${planMeta.border}` }}
        >
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-[#1A1714]">{(PLANS as any)[profile.plan]?.name ?? profile.plan} Plan</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: planMeta.color, background: planMeta.bg, border: `1px solid ${planMeta.border}` }}
              >
                {planMeta.label.toUpperCase()}
              </span>
            </div>
            <p className="text-sm" style={{ color: planMeta.color }}>
              {(PLANS as any)[profile.plan]
                ? `$${(PLANS as any)[profile.plan].price}/month`
                : 'No active plan'}
            </p>
          </div>
          {isPaid && (
            <Button variant="secondary" size="sm" loading={portalLoading} onClick={handlePortal}>
              Manage Billing
            </Button>
          )}
        </div>

        {/* Usage */}
        <div className="mb-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#2E2B27]">Videos this month</span>
            <span className="font-mono text-[#1A1714]">
              <span style={{ color: planMeta.color }}>{profile.videos_used_this_month}</span>
              <span className="text-[#8A8682]">{isUnlimited ? ' / ∞' : ` / ${profile.videos_limit}`}</span>
            </span>
          </div>
          {!isUnlimited && (
            <div className="h-1.5 bg-[#EAE8E2] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${usedPct}%`,
                  background: usedPct >= 90 ? '#FF5500' : usedPct >= 70 ? '#f59e0b' : '#F0B429',
                }}
              />
            </div>
          )}
        </div>

        {/* Upgrade plans */}
        {!isPaid && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-[#EAE8E2]" />
              <span className="text-[11px] text-[#8A8682] font-mono">UPGRADE YOUR PLAN</span>
              <div className="flex-1 h-px bg-[#EAE8E2]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['starter', 'growth', 'pro'] as const).map((key) => {
                const p = PLANS[key];
                const isPopular = key === 'growth';
                return (
                  <div
                    key={key}
                    className="relative rounded-[8px] border p-4 flex flex-col"
                    style={{
                      borderColor: isPopular ? 'rgba(240,180,41,0.4)' : '#EAE8E2',
                      background: isPopular ? 'rgba(240,180,41,0.03)' : '#F7F5EF',
                      boxShadow: isPopular ? '0 0 20px rgba(240,180,41,0.05)' : 'none',
                    }}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F0B429] text-[#1A1714] text-[9px] font-bold px-3 py-0.5 rounded-full">
                        MOST POPULAR
                      </div>
                    )}
                    <div className="font-bold text-[13px] text-[#1A1714] mb-0.5">{p.name}</div>
                    <div className="flex items-baseline gap-0.5 mb-3">
                      <span className="font-syne font-extrabold text-2xl" style={{ color: isPopular ? '#F0B429' : '#7A7672' }}>
                        ${p.price}
                      </span>
                      <span className="text-[11px] text-[#8A8682]">/mo</span>
                    </div>
                    <Button
                      variant={isPopular ? 'primary' : 'secondary'}
                      size="sm"
                      className="w-full text-[12px]"
                      loading={checkoutLoading === key}
                      onClick={() => handleUpgrade(key)}
                    >
                      {isPopular ? 'Get Growth →' : key === 'pro' ? 'Get Pro →' : 'Upgrade'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── Sign out ── */}
      <section className="bg-[#FFFFFF] border border-[#EAE8E2] rounded-[10px] p-6">
        <h2 className="font-syne font-semibold text-base mb-1">Sign Out</h2>
        <p className="text-sm text-[#6B6760] mb-4">Sign out of your Reeltor.ai account on this device.</p>
        <button
          onClick={async () => {
            const sb = createClient();
            await sb.auth.signOut();
            window.location.href = '/';
          }}
          className="flex items-center gap-2 text-sm text-[#FF5500] hover:text-[#ff7744] transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Sign Out
        </button>
      </section>
    </div>
  );
}
