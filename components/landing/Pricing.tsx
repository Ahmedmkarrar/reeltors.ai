'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { PLANS } from '@/lib/stripe/plans';

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    { key: 'starter', data: PLANS.starter },
    { key: 'pro',     data: PLANS.pro },
    { key: 'team',    data: PLANS.team },
  ] as const;

  return (
    <section id="pricing" className="py-24 px-4 bg-[#0D0B08] border-t border-[#1E1C18]">
      <div className="max-w-5xl mx-auto">

        <FadeIn>
          <p className="text-center font-mono text-[11px] tracking-[0.3em] text-[#4A4744] uppercase mb-5">PRICING</p>
          <h2 className="font-syne font-extrabold text-center text-[#FAFAF8] mb-5" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 1.0 }}>
            Less than one Starbucks order<br />
            <span className="text-[#F0B429]">to replace a $500 videographer.</span>
          </h2>
          <p className="text-center text-[#8A8682] text-base max-w-xl mx-auto mb-6">
            30-day money-back guarantee. Cancel anytime in 2 clicks.
          </p>
        </FadeIn>

        <FadeIn delay={80}>
          <div className="flex justify-center items-center gap-3 mb-12">
            <span className={`text-sm font-medium ${!annual ? 'text-[#FAFAF8]' : 'text-[#4A4744]'}`}>Monthly</span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className={['relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer', annual ? 'bg-[#F0B429]' : 'bg-[#2E2B27]'].join(' ')}
              aria-label="Toggle billing period"
            >
              <span className={['absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200', annual ? 'translate-x-6' : ''].join(' ')} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-[#FAFAF8]' : 'text-[#4A4744]'}`}>
              Annual <span className="text-[#F0B429] font-bold ml-1">Save 30%</span>
            </span>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {plans.map(({ key, data }, i) => {
            const isPro = key === 'pro';
            const price = annual && data.price > 0 ? Math.round(data.price * 0.7) : data.price;
            const roi = key === 'pro' ? 'Pays back in 1 lead' : key === 'starter' ? 'Pays back in 1 showing' : '';

            return (
              <FadeIn key={key} delay={i * 80}>
                <div
                  className={[
                    'relative flex flex-col rounded-[10px] p-6 transition-all h-full',
                    isPro
                      ? 'bg-[#1A1714] border-2 border-[#F0B429] shadow-[0_0_60px_rgba(240,180,41,0.12)] md:scale-[1.03]'
                      : 'bg-[#141210] border border-[#2E2B27] hover:border-[#3E3B37] transition-colors',
                  ].join(' ')}
                >
                  {isPro && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F0B429] text-[#0D0B08] text-[10px] font-extrabold px-4 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="font-syne font-bold text-lg text-[#FAFAF8] mb-0.5">{data.name}</h3>
                    {roi && <p className="text-xs text-[#F0B429] mb-3 font-medium">{roi}</p>}
                    <div className="flex items-end gap-1 mb-1">
                      <span className="font-syne font-extrabold text-4xl leading-none text-[#FAFAF8]">
                        ${price}
                      </span>
                      <span className="text-[#4A4744] text-sm mb-0.5">/mo</span>
                    </div>
                    {annual && data.price > 0 && (
                      <p className="text-xs text-[#4A4744]">billed ${Math.round(price * 12)}/yr</p>
                    )}
                    {!annual && data.price > 0 && (
                      <p className="text-xs text-[#4A4744]">
                        = <span className="text-[#F0B429]">${(data.price / 30).toFixed(2)}/day</span>
                      </p>
                    )}
                  </div>

                  <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                    {data.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <span className="text-[#F0B429] mt-0.5 shrink-0">✓</span>
                        <span className="text-[#8A8682]">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/signup" className="block">
                    <Button variant={isPro ? 'primary' : 'secondary'} className="w-full" size="md">
                      {isPro ? 'Get Pro →' : 'Get Started →'}
                    </Button>
                  </Link>
                </div>
              </FadeIn>
            );
          })}
        </div>

        <FadeIn delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🛡️', title: '30-Day Money Back', desc: "If it doesn't work for you, email us. Full refund. No questions asked." },
              { icon: '🔓', title: 'Cancel Anytime',    desc: 'No annual lock-in. Cancel in 2 clicks from your account page.' },
              { icon: '⚡', title: 'Works Immediately', desc: 'Sign up, upload your listing photos, and have a video ready in 60 seconds.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-[#141210] border border-[#2E2B27] rounded-[8px] p-5 flex gap-4">
                <span className="text-2xl shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-[#FAFAF8] text-sm mb-1">{title}</p>
                  <p className="text-xs text-[#4A4744] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
