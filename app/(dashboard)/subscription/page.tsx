'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PLANS, PLAN_LIMITS } from '@/lib/stripe/plans';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

const PLAN_META: Record<string, { color: string; ring: string; label: string }> = {
  free:    { color: '#8A8682', ring: '#8A8682', label: 'Free' },
  starter: { color: '#5C5853', ring: '#5C5853', label: 'Starter' },
  growth:  { color: '#C07A00', ring: '#F0B429', label: 'Growth' },
  pro:     { color: '#059669', ring: '#059669', label: 'Pro' },
};

const PLAN_PERKS: Record<string, string[]> = {
  starter: [`${PLANS.starter.videosPerMonth} videos / month`, 'AI captions', 'TikTok & Reels export', '60-sec videos', 'Fast generation'],
  growth:  [`${PLANS.growth.videosPerMonth} videos / month`, 'Premium templates', 'Brand logo & colors', 'Faster rendering', 'Everything in Starter'],
  pro:     [`${PLANS.pro.videosPerMonth} videos / month`, 'Priority rendering', 'Advanced styles', 'Multi-platform export', 'Everything in Growth'],
};

const UPGRADE_FROM: Record<string, Array<'starter' | 'growth' | 'pro'>> = {
  free:    ['starter', 'growth', 'pro'],
  starter: ['growth', 'pro'],
  growth:  ['pro'],
  pro:     [],
};

export default function SubscriptionPage() {
  const supabase     = createClient();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [profile,         setProfile]         = useState<Profile | null>(null);
  const [portalLoading,   setPortalLoading]   = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [annual,          setAnnual]          = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single<Profile>();
      if (data) setProfile(data);
    }
    load();
  }, [supabase]);

  useEffect(() => {
    if (searchParams.get('checkout_cancelled') !== '1') return;
    toast('Payment cancelled — no charge was made. You can try again whenever you\'re ready.', { duration: 6000 });
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout_cancelled');
    router.replace(url.pathname + (url.search || ''), { scroll: false });
  }, [searchParams, router]);

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
        body: JSON.stringify({ plan, annual }),
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

  if (!profile) {
    return (
      <div className="relative min-h-screen overflow-hidden" style={{ background: '#F5F2EC' }}>
        <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-4">
          <div className="h-7 shimmer rounded w-44 mb-1" />
          <div className="h-4 shimmer rounded w-56 mb-6" />
          <div className="h-44 shimmer rounded-xl" />
          <div className="h-64 shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  const meta       = PLAN_META[profile.plan] ?? PLAN_META.free;
  const videoLimit = PLAN_LIMITS[profile.plan] || profile.videos_limit || 1;
  const usedPct    = Math.min((profile.videos_used_this_month / Math.max(videoLimit, 1)) * 100, 100);
  const isPaid     = profile.plan !== 'free';
  const upgrades   = UPGRADE_FROM[profile.plan] ?? [];
  const planData   = isPaid ? PLANS[profile.plan as keyof typeof PLANS] : null;
  const perks      = PLAN_PERKS[profile.plan] ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#F5F2EC' }}>

      {/* Concentric rings */}
      <div className="absolute inset-0 flex pointer-events-none overflow-hidden">
        {[300, 450, 600, 750].map((size) => (
          <div
            key={size}
            className="absolute rounded-full border border-[#C9A96E]/10"
            style={{ width: size, height: size, top: -size / 3, right: -size / 4 }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto p-6 md:p-8 space-y-6">

        <div className="pb-1">
          <h1 className="font-syne font-extrabold text-[22px] text-[#0F0D0A] tracking-tight">Subscription</h1>
          <p className="text-[13px] text-[#8A8682] mt-1">Your plan, usage, and billing.</p>
        </div>

        {/* subscription status banners */}
        {profile.subscription_status === 'past_due' && (
          <div className="rounded-xl border border-[#FFB347]/40 bg-[#FFF8F0] px-5 py-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-[#C04000]">Your last payment failed. Update your payment method to keep your plan active.</p>
            <button onClick={handlePortal} disabled={portalLoading} className="shrink-0 text-[12px] font-semibold text-[#C04000] underline underline-offset-2 disabled:opacity-50">
              {portalLoading ? 'Opening…' : 'Fix now →'}
            </button>
          </div>
        )}
        {profile.subscription_status === 'canceled' && (
          <div className="rounded-xl border border-[#E2DED6] bg-[#FAF9F7] px-5 py-3">
            <p className="text-[13px] text-[#6B6760]">Your subscription has been canceled. Choose a plan below to reactivate.</p>
          </div>
        )}
        {profile.subscription_status === 'trialing' && (
          <div className="rounded-xl border border-[#059669]/30 bg-[#F0FDF4] px-5 py-3">
            <p className="text-[13px] text-[#059669]">You&apos;re on a free trial. Your card will be charged when the trial ends.</p>
          </div>
        )}

        {/* current plan hero — only for paid users */}
        {isPaid && (
          <section className="rounded-xl border border-[#C9A84C]/25 bg-white/80 overflow-hidden backdrop-blur-sm shadow-[0_2px_12px_rgba(201,168,76,0.08)]">

            <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#8A8682]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
                <span className="text-[13px] font-semibold text-[#1A1714]">Current Plan</span>
              </div>
              {isPaid && (
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-medium border border-[#C9A84C]/30 text-[#6B6760] bg-white/60 hover:bg-white hover:border-[#C9A84C]/50 transition-all duration-150 disabled:opacity-50"
                >
                  {portalLoading ? 'Opening…' : 'Manage Billing →'}
                </button>
              )}
            </div>

            <div className="px-6 pt-6 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-syne font-extrabold text-[32px] leading-none text-[#0F0D0A]">
                      {meta.label}
                    </span>
                    {planData && (
                      <span className="text-[15px] text-[#8A8682] font-normal">
                        ${planData.price}<span className="text-[12px]">/mo</span>
                      </span>
                    )}
                  </div>
                  {planData && (
                    <p className="text-[12px] text-[#8A8682] mt-1">{planData.tagline}</p>
                  )}
                  {!isPaid && (
                    <p className="text-[12px] text-[#8A8682] mt-1">Choose a plan below to start creating videos.</p>
                  )}
                </div>
                <span
                  className="shrink-0 text-[11px] font-bold px-3 py-1 rounded-full mt-1"
                  style={{ color: meta.color, background: `${meta.ring}15`, border: `1px solid ${meta.ring}30` }}
                >
                  {meta.label.toUpperCase()}
                </span>
              </div>

              {/* usage bar */}
              <div className="mt-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-[#8A8682]">Videos this month</span>
                  <span className="text-[12px] font-mono font-semibold text-[#1A1714]">
                    {profile.videos_used_this_month}
                    <span className="text-[#C8C4BC] font-normal"> / {videoLimit}</span>
                  </span>
                </div>
                <div className="h-2 bg-[#F0EDE6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${usedPct}%`,
                      background: usedPct >= 90 ? '#FF5500' : usedPct >= 70 ? '#f59e0b' : 'linear-gradient(90deg, #96680A 0%, #C9930A 25%, #F0B429 55%, #FFD966 75%, #DAA520 100%)',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span
                    className="text-[11px]"
                    style={{ color: usedPct >= 90 ? '#FF5500' : usedPct >= 70 ? '#C07A00' : '#B8B4AE' }}
                  >
                    {usedPct >= 90
                      ? 'Almost at your limit — upgrade to keep creating.'
                      : usedPct >= 70
                      ? 'Getting close to your limit.'
                      : `${Math.round(100 - usedPct)}% of your monthly allowance remaining.`}
                  </span>
                  <span className="text-[11px] text-[#B8B4AE]">{Math.round(usedPct)}% used</span>
                </div>
              </div>

              {isPaid && perks.length > 0 && (
                <div className="mt-5 pt-5 border-t border-[#F0EDE6]">
                  <p className="text-[11px] font-semibold text-[#8A8682] uppercase tracking-wider mb-3">What&apos;s included</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {perks.map((perk) => (
                      <div key={perk} className="flex items-center gap-2">
                        <svg className="w-3 h-3 shrink-0 text-[#C9930A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[12px] text-[#6B6760]">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* upgrade plans */}
        {upgrades.length > 0 && (
          <section className="rounded-xl border border-[#C9A84C]/25 bg-white/80 overflow-hidden backdrop-blur-sm shadow-[0_2px_12px_rgba(201,168,76,0.08)]">

            <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between gap-4">
              <span className="text-[13px] font-semibold text-[#1A1714]">
                {isPaid ? 'Upgrade Your Plan' : 'Choose a Plan'}
              </span>
              {/* billing toggle */}
              <div className="flex items-center gap-2 bg-[#F5F2EC] rounded-lg p-1">
                <button
                  onClick={() => setAnnual(false)}
                  className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all ${!annual ? 'bg-white text-[#1A1714] shadow-sm' : 'text-[#8A8682] hover:text-[#1A1714]'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setAnnual(true)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-all ${annual ? 'bg-white text-[#1A1714] shadow-sm' : 'text-[#8A8682] hover:text-[#1A1714]'}`}
                >
                  Annual
                  <span className="text-[9px] font-bold btn-gold px-1.5 py-0.5 rounded-full">SAVE 32%</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className={`grid gap-4 ${upgrades.length === 1 ? 'grid-cols-1' : upgrades.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
                {upgrades.map((key) => {
                  const p         = PLANS[key];
                  const isPopular = key === 'growth';
                  const isLoading = checkoutLoading === key;

                  return (
                    <div
                      key={key}
                      className="relative rounded-xl border flex flex-col transition-all duration-200 hover:shadow-[0_4px_16px_rgba(201,168,76,0.15)]"
                      style={{
                        borderColor: isPopular ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.15)',
                        background:  isPopular ? 'rgba(240,180,41,0.025)' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[#1A1714] text-[9px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap tracking-wide shadow-[0_2px_8px_rgba(240,180,41,0.35)] btn-gold">
                          MOST POPULAR
                        </div>
                      )}

                      <div className="p-5 flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-bold text-[14px] text-[#1A1714]">{p.name}</p>
                          {key === 'pro' && (
                            <span className="text-[9px] font-bold bg-[#059669]/10 text-[#059669] border border-[#059669]/20 px-2 py-0.5 rounded-full">TOP TIER</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8A8682] mb-4 leading-relaxed">{p.tagline}</p>

                        <div className="mb-5">
                          <div className="flex items-baseline gap-0.5">
                            <span
                              className="font-syne font-extrabold text-[28px] leading-none"
                              style={{ color: isPopular ? '#C9930A' : '#1A1714' }}
                            >
                              ${annual && p.priceAnnual ? (p.priceAnnual / 12).toFixed(2) : p.price}
                            </span>
                            <span className="text-[11px] text-[#8A8682] ml-1">/mo</span>
                          </div>
                          {annual && p.priceAnnual && (
                            <p className="text-[10px] text-[#8A8682] mt-1">billed ${p.priceAnnual}/yr</p>
                          )}
                        </div>

                        <ul className="space-y-2 mb-5">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-[12px] text-[#6B6760]">
                              <svg
                                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                                style={{ color: isPopular ? '#C9930A' : '#B8B4AE' }}
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="px-5 pb-5">
                        <button
                          onClick={() => handleUpgrade(key)}
                          disabled={!!checkoutLoading}
                          className={[
                            'w-full h-10 rounded-lg text-[13px] font-semibold transition-all duration-150',
                            isPopular
                              ? 'btn-gold'
                              : 'border border-[#C9A84C]/30 text-[#1A1714] bg-white/60 hover:border-[#C9A84C]/50 hover:bg-white',
                            checkoutLoading ? 'opacity-50 cursor-not-allowed' : '',
                          ].join(' ')}
                        >
                          {isLoading
                            ? 'Redirecting…'
                            : isPaid
                            ? `Upgrade to ${p.name} →`
                            : isPopular
                            ? `Get ${p.name} →`
                            : `Start with ${p.name} →`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* pro — already on highest tier */}
        {profile.plan === 'pro' && (
          <section className="rounded-xl border border-[#C9A84C]/25 bg-white/80 overflow-hidden backdrop-blur-sm shadow-[0_2px_12px_rgba(201,168,76,0.08)]">
            <div className="px-6 py-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <svg className="w-5 h-5 text-[#C9930A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1A1714]">You&apos;re on the highest tier</p>
                <p className="text-[12px] text-[#8A8682] mt-0.5">Need more? Reach out and we&apos;ll set up a custom plan for your team.</p>
              </div>
              <a
                href="mailto:support@reeltors.ai"
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12px] font-semibold border border-[#C9A84C]/30 text-[#6B6760] bg-white/60 hover:bg-white hover:border-[#C9A84C]/50 transition-all duration-150"
              >
                Contact Us →
              </a>
            </div>
          </section>
        )}

        {/* billing management — paid users */}
        {isPaid && (
          <section className="rounded-xl border border-[#C9A84C]/25 bg-white/80 overflow-hidden backdrop-blur-sm shadow-[0_2px_12px_rgba(201,168,76,0.08)]">
            <div className="px-6 py-4 border-b border-[#F0EDE6]">
              <span className="text-[13px] font-semibold text-[#1A1714]">Billing</span>
            </div>
            <div className="divide-y divide-[#F0EDE6]">
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F5F2EC]/50 transition-colors duration-150 group text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <svg className="w-4 h-4 text-[#C9930A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#1A1714]">Manage Billing</p>
                    <p className="text-[11px] text-[#8A8682]">Update payment method, download invoices, cancel plan</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-[#C8C4BC] group-hover:text-[#C9930A] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
