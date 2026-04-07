'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PLANS, PLAN_LIMITS } from '@/lib/stripe/plans';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

const PLAN_META: Record<string, { color: string; label: string; ring: string }> = {
  free:    { color: '#8A8682', label: 'Free',    ring: '#8A8682' },
  starter: { color: '#5C5853', label: 'Starter', ring: '#5C5853' },
  growth:  { color: '#C07A00', label: 'Growth',  ring: '#F0B429' },
  pro:     { color: '#059669', label: 'Pro',      ring: '#059669' },
};

export default function AccountPage() {
  const supabase = createClient();
  const [profile,         setProfile]         = useState<Profile | null>(null);
  const [fullName,        setFullName]        = useState('');
  const [brandName,       setBrandName]       = useState('');
  const [phone,           setPhone]           = useState('');
  const [saving,          setSaving]          = useState(false);
  const [portalLoading,   setPortalLoading]   = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setBrandName(data.brand_name || '');
        setPhone(data.phone || '');
      }
    }
    load();
  }, [supabase]);

  useEffect(() => {
    if (!profile) return;
    if (window.location.hash === '#upgrade') {
      setTimeout(() => {
        document.getElementById('upgrade')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name:  fullName  || null,
      brand_name: brandName || null,
      phone:      phone     || null,
    }).eq('id', profile.id);
    setSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Profile saved');
    setProfile((p) => p ? { ...p, full_name: fullName, brand_name: brandName, phone } : p);
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
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const { url, error } = await res.json();
      if (error) { toast.error(error); return; }
      window.location.href = url;
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setCheckoutLoading('');
    }
  }

  // loading skeleton
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-4">
        <div className="h-7 shimmer rounded w-44 mb-1" />
        <div className="h-4 shimmer rounded w-56 mb-6" />
        {[1, 2].map((i) => <div key={i} className="h-48 shimmer rounded-xl" />)}
      </div>
    );
  }

  const planMeta    = PLAN_META[profile.plan] ?? PLAN_META.free;
  const videoLimit  = PLAN_LIMITS[profile.plan] ?? profile.videos_limit;
  const usedPct     = Math.min((profile.videos_used_this_month / Math.max(videoLimit, 1)) * 100, 100);
  const isPaid      = profile.plan !== 'free';
  const nameUnchanged = fullName === (profile.full_name || '') && brandName === (profile.brand_name || '') && phone === (profile.phone || '');
  const initials    = (profile.full_name || profile.email || 'R').charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-6">

      <div className="pb-1">
        <h1 className="font-syne font-extrabold text-[22px] text-[#0F0D0A] tracking-tight">Account Settings</h1>
        <p className="text-[13px] text-[#8A8682] mt-1">Manage your profile and subscription.</p>
      </div>

      {/* profile */}
      <section className="rounded-xl border border-[#E2DED6] bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">

        <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#8A8682]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="text-[13px] font-semibold text-[#1A1714]">Profile</span>
        </div>

        <form onSubmit={handleSave}>
          <div className="px-6 py-6 space-y-5">

            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0 select-none"
                style={{
                  background: `linear-gradient(135deg, ${planMeta.ring}22, ${planMeta.ring}0d)`,
                  border: `2px solid ${planMeta.ring}50`,
                  color: planMeta.color,
                }}
              >
                {initials}
              </div>
              <div>
                <p className="font-semibold text-[14px] text-[#1A1714] leading-tight">{profile.full_name || 'No name set'}</p>
                <p className="text-[12px] text-[#8A8682] mt-0.5">{profile.email}</p>
                <span
                  className="inline-flex mt-1.5 items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    color: planMeta.color,
                    background: `${planMeta.ring}15`,
                    border: `1px solid ${planMeta.ring}30`,
                  }}
                >
                  <span className="w-1 h-1 rounded-full" style={{ background: planMeta.color }} />
                  {planMeta.label.toUpperCase()} PLAN
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-semibold text-[#6B6760] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full h-10 px-3 text-[13px] text-[#1A1714] bg-white border border-[#E2DED6] rounded-lg outline-none transition-all duration-150
                  placeholder:text-[#C8C4BC]
                  hover:border-[#C8C4BC]
                  focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20"
              />
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-[11px] font-semibold text-[#6B6760] uppercase tracking-wider mb-1.5">
                Brand / Brokerage Name
                <span className="ml-2 normal-case font-normal text-[#B8B4AE] tracking-normal">— shown on every video</span>
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Keller Williams, My Realty Group"
                className="w-full h-10 px-3 text-[13px] text-[#1A1714] bg-white border border-[#E2DED6] rounded-lg outline-none transition-all duration-150
                  placeholder:text-[#C8C4BC]
                  hover:border-[#C8C4BC]
                  focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-semibold text-[#6B6760] uppercase tracking-wider mb-1.5">
                Phone Number
                <span className="ml-2 normal-case font-normal text-[#B8B4AE] tracking-normal">— shown on every video</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(123) 555-1234"
                className="w-full h-10 px-3 text-[13px] text-[#1A1714] bg-white border border-[#E2DED6] rounded-lg outline-none transition-all duration-150
                  placeholder:text-[#C8C4BC]
                  hover:border-[#C8C4BC]
                  focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20"
              />
            </div>

            {/* Email — read only */}
            <div>
              <label className="block text-[11px] font-semibold text-[#6B6760] uppercase tracking-wider mb-1.5">
                Email
                <span className="ml-2 normal-case font-normal text-[#B8B4AE] tracking-normal">— cannot be changed here</span>
              </label>
              <input
                type="email"
                value={profile.email}
                readOnly
                tabIndex={-1}
                className="w-full h-10 px-3 text-[13px] text-[#8A8682] bg-[#F7F5F0] border border-[#E2DED6] rounded-lg cursor-not-allowed select-none"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#F0EDE6] flex items-center justify-between">
            <p className="text-[11px] text-[#B8B4AE]">Changes are saved immediately.</p>
            <button
              type="submit"
              disabled={saving || nameUnchanged}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-lg text-[13px] font-semibold transition-all duration-150
                bg-[#F0B429] text-[#1A1714]
                hover:bg-[#E8AC22] active:bg-[#D9A01E]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#F0B429]"
            >
              {saving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Saving…
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* subscription */}
      <section id="upgrade" className="rounded-xl border border-[#E2DED6] bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)] scroll-mt-6">

        <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#8A8682]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            <span className="text-[13px] font-semibold text-[#1A1714]">Subscription</span>
          </div>
          {isPaid && (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-medium border border-[#E2DED6] text-[#6B6760] bg-white hover:bg-[#F7F5F0] hover:border-[#C8C4BC] transition-all duration-150 disabled:opacity-50"
            >
              {portalLoading ? 'Opening…' : 'Manage Billing →'}
            </button>
          )}
        </div>

        <div className="px-6 py-5 border-b border-[#F0EDE6]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#8A8682] uppercase tracking-wider mb-1">Current Plan</p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-syne font-extrabold text-[22px] text-[#1A1714]">
                  {profile.plan in PLANS ? PLANS[profile.plan as keyof typeof PLANS].name : 'Free'}
                </span>
                {isPaid && (
                  <span className="text-[13px] text-[#8A8682]">
                    ${PLANS[profile.plan as keyof typeof PLANS].price}/mo
                  </span>
                )}
              </div>
            </div>
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ color: planMeta.color, background: `${planMeta.ring}15`, border: `1px solid ${planMeta.ring}30` }}
            >
              {planMeta.label.toUpperCase()}
            </span>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-[#8A8682]">Videos this month</span>
              <span className="font-mono font-semibold text-[#1A1714]">
                {profile.videos_used_this_month}
                <span className="text-[#C8C4BC] font-normal"> / {videoLimit}</span>
              </span>
            </div>
            <div className="h-1.5 bg-[#F0EDE6] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${usedPct}%`,
                  background: usedPct >= 90 ? '#FF5500' : usedPct >= 70 ? '#f59e0b' : '#F0B429',
                }}
              />
            </div>
            {usedPct >= 80 && (
              <p className="text-[11px] mt-1.5" style={{ color: usedPct >= 90 ? '#FF5500' : '#C07A00' }}>
                {usedPct >= 90 ? 'Almost at your limit — upgrade to keep creating.' : 'Getting close to your limit.'}
              </p>
            )}
          </div>
        </div>

        {!isPaid && (
          <div className="px-6 py-5">
            <p className="text-[11px] font-semibold text-[#8A8682] uppercase tracking-wider mb-4">Upgrade Your Plan</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['starter', 'growth', 'pro'] as const).map((key) => {
                const p         = PLANS[key];
                const isPopular = key === 'growth';
                const isLoading = checkoutLoading === key;
                return (
                  <div
                    key={key}
                    className="relative rounded-xl border p-4 flex flex-col transition-all duration-150"
                    style={{
                      borderColor: isPopular ? 'rgba(240,180,41,0.45)' : '#EAE8E2',
                      background:  isPopular ? 'rgba(240,180,41,0.03)' : '#FAFAF8',
                    }}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F0B429] text-[#1A1714] text-[9px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap tracking-wide shadow-[0_2px_8px_rgba(240,180,41,0.3)]">
                        MOST POPULAR
                      </div>
                    )}

                    <p className="font-bold text-[13px] text-[#1A1714] mb-0.5">{p.name}</p>
                    <div className="flex items-baseline gap-0.5 mb-3">
                      <span
                        className="font-syne font-extrabold text-[24px] leading-none"
                        style={{ color: isPopular ? '#F0B429' : '#6B6760' }}
                      >
                        ${p.price}
                      </span>
                      <span className="text-[11px] text-[#8A8682] ml-0.5">/mo</span>
                    </div>

                    <ul className="space-y-1.5 mb-4 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[11px] text-[#6B6760]">
                          <svg
                            className="w-3 h-3 mt-0.5 shrink-0"
                            style={{ color: isPopular ? '#F0B429' : '#B8B4AE' }}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(key)}
                      disabled={!!checkoutLoading}
                      className={[
                        'w-full h-9 rounded-lg text-[12px] font-semibold transition-all duration-150',
                        isPopular
                          ? 'bg-[#F0B429] text-[#1A1714] hover:bg-[#E8AC22] shadow-[0_2px_8px_rgba(240,180,41,0.25)]'
                          : 'border border-[#E2DED6] text-[#6B6760] bg-white hover:border-[#C8C4BC] hover:text-[#1A1714]',
                        checkoutLoading ? 'opacity-50 cursor-not-allowed' : '',
                      ].join(' ')}
                    >
                      {isLoading ? 'Redirecting…' : isPopular ? `Get ${p.name} →` : `Upgrade →`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* session / sign out */}
      <section className="rounded-xl border border-[#E2DED6] bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#8A8682]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          <span className="text-[13px] font-semibold text-[#1A1714]">Session</span>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[#1A1714]">Sign out</p>
            <p className="text-[12px] text-[#8A8682] mt-0.5">Sign out of your account on this device.</p>
          </div>
          <button
            onClick={async () => {
              const sb = createClient();
              await sb.auth.signOut();
              window.location.href = '/';
            }}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12px] font-semibold border border-[#FFD4C2] text-[#FF5500] bg-[#FFF4F0] hover:bg-[#FFE8DF] hover:border-[#FF5500]/40 transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      </section>

    </div>
  );
}
