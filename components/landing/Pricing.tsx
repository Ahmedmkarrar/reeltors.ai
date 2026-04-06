'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { PLANS } from '@/lib/stripe/plans';

// "original" prices shown crossed out (before launch discount)
const ORIGINAL_PRICES: Record<string, number> = {
  starter: 99,
  growth:  199,
  pro:     399,
};

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    { key: 'starter', data: PLANS.starter },
    { key: 'growth',  data: PLANS.growth },
    { key: 'pro',     data: PLANS.pro },
  ] as const;

  return (
    <section id="pricing" className="py-24 px-4 bg-[#0D0B08] border-t border-[#1E1C18]">
      <div className="max-w-5xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-center font-mono text-[11px] tracking-[0.3em] text-[#4A4744] uppercase mb-5">PRICING</p>
          <h2 className="font-syne font-extrabold text-center text-[#FAFAF8] mb-5" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 1.0 }}>
            Less than one Starbucks order<br />
            <span className="text-[#F0B429]">to replace a $500 videographer.</span>
          </h2>
          <p className="text-center text-[#8A8682] text-base max-w-xl mx-auto mb-6">
            30-day money-back guarantee. Cancel anytime in 2 clicks.
          </p>
        </motion.div>

        {/* Launch Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-3 bg-[#1A1200] border border-[#F0B429]/40 rounded-full px-6 py-3 shadow-[0_0_40px_rgba(240,180,41,0.15)]">
            <span className="text-lg">🚀</span>
            <span className="font-mono font-bold text-[#F0B429] text-sm tracking-wide uppercase">
              Launch Special — 50% Off
            </span>
            <span className="text-[#8A8682] text-xs">· Limited spots · Lock in your price forever</span>
          </div>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center items-center gap-3 mb-12"
        >
          <span className={`text-sm font-medium ${!annual ? 'text-[#FAFAF8]' : 'text-[#4A4744]'}`}>Monthly</span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className={['relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer', annual ? 'bg-[#F0B429]' : 'bg-[#2E2B27]'].join(' ')}
            aria-label="Toggle billing period"
          >
            <span className={['absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm', annual ? 'translate-x-6' : ''].join(' ')} />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-[#FAFAF8]' : 'text-[#4A4744]'}`}>
            Annual <span className="text-[#F0B429] font-bold ml-1">Save 30%</span>
          </span>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {plans.map(({ key, data }, i) => {
            const isPopular     = key === 'growth';
            const annualTotal   = 'priceAnnual' in data ? (data as typeof data & { priceAnnual: number }).priceAnnual : 0;
            const price         = annual && annualTotal > 0 ? +(annualTotal / 12).toFixed(2) : data.price;
            const originalPrice = annual ? Math.round(ORIGINAL_PRICES[key] * 0.7) : ORIGINAL_PRICES[key];
            const roi = key === 'pro' ? 'Pays back in 1 lead' : key === 'starter' ? 'Pays back in 1 showing' : '';

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: isPopular ? -6 : -4, transition: { duration: 0.2 } }}
                className={isPopular ? 'animated-border-glow md:scale-[1.03]' : ''}
              >
                <div
                  className={[
                    'relative flex flex-col rounded-[12px] p-6 transition-all h-full',
                    isPopular
                      ? 'bg-[#1A1714] border border-[#F0B429]/30 shadow-[0_0_60px_rgba(240,180,41,0.15)]'
                      : 'bg-[#141210] border border-[#2E2B27] hover:border-[#3E3B37]',
                  ].join(' ')}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F0B429] text-[#0D0B08] text-[10px] font-extrabold px-4 py-1 rounded-full uppercase tracking-widest whitespace-nowrap shadow-[0_0_20px_rgba(240,180,41,0.4)]">
                      ⭐ Most Popular
                    </div>
                  )}

                  <div className="absolute top-4 right-4 bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">
                    50% OFF
                  </div>

                  <div className="mb-5">
                    <h3 className="font-syne font-bold text-lg text-[#FAFAF8] mb-0.5">{data.name}</h3>
                    <p className="text-xs text-[#8A8682] mb-2 italic">{data.tagline}</p>
                    {roi && <p className="text-xs text-[#F0B429] mb-3 font-medium">{roi}</p>}

                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#4A4744] text-sm line-through">${originalPrice}/mo</span>
                      <span className="bg-red-500/15 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        SAVE ${originalPrice - price}/mo
                      </span>
                    </div>

                    <div className="flex items-end gap-1 mb-1">
                      <span className="font-syne font-extrabold text-4xl leading-none text-[#FAFAF8]">${price}</span>
                      <span className="text-[#4A4744] text-sm mb-0.5">/mo</span>
                    </div>
                    {annual && annualTotal > 0 && (
                      <p className="text-xs text-[#4A4744]">billed ${annualTotal}/yr</p>
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
                    <Button variant={isPopular ? 'primary' : 'secondary'} className="w-full" size="md">
                      {key === 'growth' ? 'Claim 50% Off →' : key === 'pro' ? 'Get Pro →' : 'Get Started →'}
                    </Button>
                  </Link>

                  <p className="text-center text-[#4A4744] text-[10px] mt-2">
                    🔒 Price locked in forever at launch rate
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { icon: '🛡️', title: '30-Day Money Back', desc: "If it doesn't work for you, email us. Full refund. No questions asked." },
            { icon: '🔓', title: 'Cancel Anytime',    desc: 'No annual lock-in. Cancel in 2 clicks from your account page.' },
            { icon: '⚡', title: 'Works Immediately', desc: 'Sign up, upload your listing photos, and have a video ready in 60 seconds.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-[#141210] border border-[#2E2B27] rounded-[10px] p-5 flex gap-4 hover:border-[#3E3B37] transition-colors">
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <p className="font-semibold text-[#FAFAF8] text-sm mb-1">{title}</p>
                <p className="text-xs text-[#4A4744] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
