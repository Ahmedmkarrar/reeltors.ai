/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';

export function ROICalculator() {
  const [commission, setCommission] = useState(9400);
  const [listings, setListings] = useState(3);
  const [showResult, setShowResult] = useState(false);

  const extraDealsPerMonth = Math.round(listings * 0.35);
  const extraRevenuePerMonth = extraDealsPerMonth * commission;
  const extraRevenuePerYear = extraRevenuePerMonth * 12;
  const costPerYear = 47 * 12;
  const roi = Math.round((extraRevenuePerYear / costPerYear) * 100);

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;

  return (
    <section className="py-24 px-4 bg-[#111010] border-t border-[#1E1C18]">
      <div className="max-w-3xl mx-auto">

        <FadeIn>
          <p className="text-center font-mono text-[11px] tracking-[0.3em] text-[#4A4744] uppercase mb-5">
            YOUR PERSONAL ROI
          </p>
          <h2 className="font-syne font-extrabold text-center text-[#FAFAF8] mb-5" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 1.0 }}>
            Find out what not posting video
            <br /><span className="text-[#F0B429]">costs you every year.</span>
          </h2>
          <p className="text-center text-[#8A8682] text-base max-w-lg mx-auto mb-12">
            Enter your numbers. We'll show you the math.
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="bg-[#141210] border border-[#2E2B27] rounded-[10px] p-6 md:p-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-[#C8C4BC] mb-2">
                  Average commission per deal
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4744] text-sm">$</span>
                  <input
                    type="number"
                    value={commission}
                    onChange={(e) => { setCommission(Number(e.target.value)); setShowResult(false); }}
                    className="w-full bg-[#0D0B08] border border-[#2E2B27] rounded-[6px] px-3 py-2.5 pl-7 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#F0B429] transition-colors"
                  />
                </div>
                <p className="text-xs text-[#4A4744] mt-1">US average is $9,400</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#C8C4BC] mb-2">
                  Listings you take per month
                </label>
                <input
                  type="number"
                  value={listings}
                  min={1}
                  max={30}
                  onChange={(e) => { setListings(Number(e.target.value)); setShowResult(false); }}
                  className="w-full bg-[#0D0B08] border border-[#2E2B27] rounded-[6px] px-3 py-2.5 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#F0B429] transition-colors"
                />
                <p className="text-xs text-[#4A4744] mt-1">Just your listings, not team</p>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-[#C8C4BC] mb-3">
                Listings per month: <span className="text-[#F0B429] font-bold">{listings}</span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={listings}
                onChange={(e) => { setListings(Number(e.target.value)); setShowResult(false); }}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #F0B429 0%, #F0B429 ${(listings / 20) * 100}%, #2E2B27 ${(listings / 20) * 100}%, #2E2B27 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-[#4A4744] mt-1">
                <span>1 listing</span>
                <span>20 listings</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full text-base font-bold shadow-[0_0_30px_rgba(240,180,41,0.2)]"
              onClick={() => setShowResult(true)}
            >
              Calculate My Revenue Gap →
            </Button>

            {showResult && (
              <div className="mt-6 pt-6 border-t border-[#2E2B27]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Extra deals/month', value: `+${extraDealsPerMonth}`, note: 'from video-driven leads', color: '#F0B429' },
                    { label: 'Extra revenue/month', value: fmt(extraRevenuePerMonth), note: 'additional commissions', color: '#F0B429' },
                    { label: 'Annual upside', value: fmt(extraRevenuePerYear), note: 'left on the table', color: '#FF6B35' },
                  ].map(({ label, value, note, color }) => (
                    <div key={label} className="bg-[#0D0B08] border border-[#2E2B27] rounded-[8px] p-4 text-center">
                      <div className="text-[10px] text-[#4A4744] mb-1 font-mono uppercase tracking-wider">{label}</div>
                      <div className="font-syne font-extrabold text-2xl" style={{ color }}>{value}</div>
                      <div className="text-[10px] text-[#4A4744] mt-1">{note}</div>
                    </div>
                  ))}
                </div>

                <div className="border border-[#F0B429]/20 bg-[#F0B429]/5 rounded-[8px] p-5 text-center mb-5">
                  <p className="text-[#8A8682] text-sm mb-1">
                    Reeltor.ai Pro costs <span className="text-[#FAFAF8] font-bold">$564/year</span>.
                    Your potential upside is{' '}
                    <span className="text-[#F0B429] font-bold">{fmt(extraRevenuePerYear)}</span>.
                  </p>
                  <p className="font-syne font-extrabold text-[#F0B429] text-3xl mt-2">
                    {roi.toLocaleString()}% ROI
                  </p>
                  <p className="text-xs text-[#4A4744] mt-1">
                    Based on 403% more inquiries from video listings (NAR data)
                  </p>
                </div>

                <Link href="/signup" className="block">
                  <Button variant="primary" size="lg" className="w-full text-base font-bold shadow-[0_0_30px_rgba(240,180,41,0.2)]">
                    Start Capturing That Revenue — First Video Free →
                  </Button>
                </Link>

                <p className="text-center text-xs text-[#4A4744] mt-3">
                  From $19/month. Cancel anytime. 30-day money-back guarantee.
                </p>
              </div>
            )}
          </div>
        </FadeIn>

        <p className="text-center text-xs text-[#4A4744] mt-4">
          * Estimates based on NAR 2024 data. Results vary by market and effort.
        </p>
      </div>
    </section>
  );
}
