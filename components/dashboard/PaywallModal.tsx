'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PLANS, PLAN_LIMITS } from '@/lib/stripe/plans';
import { EmbeddedCheckoutModal } from './EmbeddedCheckout';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

type PlanKey = 'starter' | 'growth' | 'pro';
const ALL_PLAN_KEYS: PlanKey[] = ['starter', 'growth', 'pro'];
const PLAN_ORDER: Record<string, number> = { free: 0, starter: 1, growth: 2, pro: 3 };

export function PaywallModal() {
  const [annual, setAnnual] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<{ plan: PlanKey; annual: boolean } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from('profiles')
        .select('plan, videos_used_this_month, videos_limit')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (!data) return;
          setCurrentPlan(data.plan ?? 'free');
          const isPaid = !!PLAN_LIMITS[data.plan as string];
          const limit = PLAN_LIMITS[data.plan as string] || data.videos_limit || 1;
          const hitLimit = !isPaid && (data.videos_used_this_month ?? 0) >= limit;
          setShouldShow(hitLimit);
        });
    });
  }, []);

  useEffect(() => {
    const handler = () => {
      setShouldShow(true);
      setIsDismissed(false);
    };
    window.addEventListener('show-upgrade-modal', handler);
    return () => window.removeEventListener('show-upgrade-modal', handler);
  }, []);

  useEffect(() => {
    if (searchParams.get('upgraded') !== '1') return;
    toast.success('Payment successful — welcome to your new plan!', { duration: 6000 });
    const url = new URL(window.location.href);
    url.searchParams.delete('upgraded');
    router.replace(url.pathname + (url.search || ''), { scroll: false });

    // poll until the Stripe webhook has updated the plan, then refresh the server component
    const supabase = createClient();
    let attempts = 0;
    const maxAttempts = 15; // 30 seconds
    const poll = setInterval(async () => {
      attempts++;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { clearInterval(poll); return; }
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', session.user.id)
        .single();
      const isActive = data?.subscription_status === 'active' || data?.subscription_status === 'trialing';
      if (isActive || attempts >= maxAttempts) {
        clearInterval(poll);
        router.refresh();
      }
    }, 2000);
  }, [searchParams, router]);

  if (!shouldShow || isDismissed) return null;

  function handleUpgrade(plan: PlanKey) {
    setCheckoutPlan({ plan, annual });
  }

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(13,11,8,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-3xl bg-[#FAFAF8] rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '92vh' }}>

        {/* header */}
        <div className="relative px-6 pt-5 pb-4 text-center border-b border-[#EAE8E2] shrink-0">
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-[#9A9690] hover:bg-[#EDEAE4] transition-colors"
            title="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-[#F0B429] rounded-[4px] flex items-center justify-center shadow-[0_0_10px_rgba(240,180,41,0.4)]">
              <svg className="w-3.5 h-3.5 text-[#1A1714]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="font-syne font-extrabold text-[16px] text-[#1A1714]">
              ReeltorsAI
            </span>
          </div>
          <h2 className="font-syne font-extrabold text-[20px] text-[#1A1714] mb-1">
            Choose a plan to get started
          </h2>
          <p className="text-[12px] text-[#8A8682] mb-3">
            Turn listing photos into viral videos in 60 seconds. Cancel anytime.
          </p>

          {/* billing toggle */}
          <div className="inline-flex items-center gap-1 bg-[#F0EDE6] rounded-lg p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1 rounded-md text-[12px] font-medium transition-all ${!annual ? 'bg-white text-[#1A1714] shadow-sm' : 'text-[#8A8682] hover:text-[#1A1714]'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-1.5 px-4 py-1 rounded-md text-[12px] font-medium transition-all ${annual ? 'bg-white text-[#1A1714] shadow-sm' : 'text-[#8A8682] hover:text-[#1A1714]'}`}
            >
              Annual
              <span className="text-[9px] font-bold bg-[#F0B429] text-[#1A1714] px-1.5 py-0.5 rounded-full">SAVE 32%</span>
            </button>
          </div>
        </div>

        {/* plan cards — only show plans above the user's current plan */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 overflow-y-auto flex-1 min-h-0">
          {ALL_PLAN_KEYS.filter((key) => (PLAN_ORDER[key] ?? 0) > (PLAN_ORDER[currentPlan] ?? 0)).map((key) => {
            const p         = PLANS[key];
            const isPopular = key === 'growth';

            return (
              <div
                key={key}
                className="relative rounded-xl border flex flex-col transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                style={{
                  borderColor: isPopular ? 'rgba(240,180,41,0.5)' : '#EAE8E2',
                  background:  isPopular ? 'rgba(240,180,41,0.03)' : '#FFFFFF',
                }}
              >
                {isPopular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#F0B429] text-[#1A1714] text-[9px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap tracking-wide shadow-[0_2px_8px_rgba(240,180,41,0.35)]">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-0.5">
                    <p className="font-bold text-[13px] text-[#1A1714]">{p.name}</p>
                    {key === 'pro' && (
                      <span className="text-[8px] font-bold bg-[#059669]/10 text-[#059669] border border-[#059669]/20 px-1.5 py-0.5 rounded-full">TOP</span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8A8682] mb-3 leading-relaxed">{p.tagline}</p>

                  <div className="mb-3">
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-syne font-extrabold text-[22px] leading-none" style={{ color: isPopular ? '#F0B429' : '#1A1714' }}>
                        ${annual && p.priceAnnual ? (p.priceAnnual / 12).toFixed(2) : p.price}
                      </span>
                      <span className="text-[10px] text-[#8A8682] ml-1">/mo</span>
                    </div>
                    {annual && p.priceAnnual && (
                      <p className="text-[10px] text-[#8A8682] mt-0.5">billed ${p.priceAnnual}/yr</p>
                    )}
                  </div>

                  <ul className="space-y-1.5 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[11px] text-[#6B6760]">
                        <svg className="w-3 h-3 mt-0.5 shrink-0" style={{ color: isPopular ? '#F0B429' : '#B8B4AE' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-4 pb-4">
                  <button
                    onClick={() => handleUpgrade(key)}
                    className={[
                      'w-full h-9 rounded-lg text-[12px] font-semibold transition-all duration-150',
                      isPopular
                        ? 'bg-[#F0B429] text-[#1A1714] hover:bg-[#E8AC22] shadow-[0_2px_12px_rgba(240,180,41,0.3)]'
                        : 'border border-[#E2DED6] text-[#1A1714] bg-white hover:border-[#C8C4BC] hover:bg-[#FAFAF8]',
                    ].join(' ')}
                  >
                    {isPopular ? `Get ${p.name} →` : `Start with ${p.name} →`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div className="text-center pb-4 shrink-0 space-y-1">
          <p className="text-[10px] text-[#B8B4AE]">
            30-day money-back guarantee · Cancel anytime · Secure checkout via Stripe
          </p>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-[11px] text-[#B8B4AE] hover:text-[#6B6760] transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>

    {checkoutPlan && (
      <EmbeddedCheckoutModal
        plan={checkoutPlan.plan}
        annual={checkoutPlan.annual}
        onClose={() => setCheckoutPlan(null)}
      />
    )}
  </>
  );
}
