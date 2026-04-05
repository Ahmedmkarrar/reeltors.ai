/* eslint-disable react/no-unescaped-entities */
'use client';

import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { FadeIn } from '@/components/ui/FadeIn';

export function PainSection() {
  return (
    <section id="proof" className="bg-[#0D0B08] border-t border-[#1E1C18]">

      {/* ── Header ── */}
      <div className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-center font-mono text-[11px] tracking-[0.3em] text-[#6B6760] uppercase mb-5">THE MATH DOESN'T LIE</p>
            <h2
              className="font-syne font-extrabold text-center mb-5"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 1.0 }}
            >
              Here's exactly what bad marketing<br />
              is <span className="text-[#CC3D00]">costing you. Per month.</span>
            </h2>
            <p className="text-center text-[#8A8682] text-base md:text-lg max-w-2xl mx-auto">
              While you're posting photo carousels on Facebook, agents who figured this out are
              building audiences, getting DMs, and closing your buyers. Here's the math.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* ── Comparison cards ── */}
      <div className="px-4 pb-0">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-0">
          <FadeIn delay={0}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-[#141210] border border-[#2E2B27] rounded-[10px] p-7 h-full">
              <div className="flex items-center gap-2.5 mb-7">
                <div className="w-3 h-3 rounded-full bg-[#CC3D00]/70" />
                <span className="text-sm font-bold text-[#CC3D00] uppercase tracking-widest">Realtor without video</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Inbound leads per month', value: '2–3', note: 'word of mouth + Zillow' },
                  { label: 'Average closings per month', value: '1', note: 'best case' },
                  { label: 'Monthly commission', value: '$9,400', note: 'avg US commission' },
                  { label: 'Video content posted', value: '0 videos', note: '"I\'ll start next month"' },
                  { label: 'Social media growth', value: '—', note: 'zero organic reach' },
                ].map(({ label, value, note }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-[#1E1C18] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#C8C4BC]">{label}</p>
                      <p className="text-xs text-[#8A8682] mt-0.5">{note}</p>
                    </div>
                    <span className="font-syne font-bold text-[#7A7672] ml-4 shrink-0">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t-2 border-[#2E2B27]">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-[#6B6760]">Potential annual earnings</span>
                  <span className="font-syne font-extrabold text-3xl text-[#4A4744]">~$113k</span>
                </div>
              </div>
            </motion.div>
          </FadeIn>

          <FadeIn delay={120}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-[#1A1714] border border-[#F0B429]/15 rounded-[10px] p-7 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#F0B429] opacity-[0.06] rounded-full blur-[80px] pointer-events-none" />
              <div className="flex items-center gap-2.5 mb-7 relative">
                <div className="w-3 h-3 rounded-full bg-[#F0B429] animate-pulse" />
                <span className="text-sm font-bold text-[#F0B429] uppercase tracking-widest">Realtor using Reeltors.ai</span>
              </div>
              <div className="space-y-3 relative">
                {[
                  { label: 'Inbound leads per month', value: '12–15', note: 'video drives organic traffic 24/7' },
                  { label: 'Average closings per month', value: '3–4', note: '+300% vs no video' },
                  { label: 'Monthly commission', value: '$37,600+', note: '4× more closings' },
                  { label: 'Video content posted', value: '1/listing', note: 'automated in 60 seconds' },
                  { label: 'Social media growth', value: '+22k views', note: 'per video on average' },
                ].map(({ label, value, note }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-[#2E2B27] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#C8C4BC]">{label}</p>
                      <p className="text-xs text-[#6B6760] mt-0.5">{note}</p>
                    </div>
                    <span className="font-syne font-bold text-[#F0B429] ml-4 shrink-0">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t-2 border-[#F0B429]/20 relative">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-[#8A8682]">Potential annual earnings</span>
                  <span className="font-syne font-extrabold text-3xl text-[#F0B429]">~$451k</span>
                </div>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </div>

      {/* ── The Gap — full-bleed dark block ── */}
      <div className="mt-4 px-4 pb-0">
        <div className="max-w-5xl mx-auto">
          <FadeIn delay={100}>
            <div className="bg-[#1A1714] rounded-[10px] overflow-hidden relative">
              <div className="absolute inset-0 dot-grid opacity-15" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-[#F0B429] opacity-[0.07] rounded-full blur-[100px] pointer-events-none" />
              <div className="relative py-14 px-6 md:px-14 flex flex-col md:flex-row items-center gap-8">
                <div className="text-center md:text-left shrink-0">
                  <p className="font-mono text-[10px] tracking-[0.25em] text-[#6B6760] uppercase mb-3">The Earnings Gap</p>
                  <div
                    className="font-syne font-extrabold text-[#F0B429] leading-none"
                    style={{ fontSize: 'clamp(4rem, 10vw, 7rem)' }}
                  >
                    $<AnimatedCounter end={338000} duration={2500} suffix="/yr" />
                  </div>
                </div>
                <div className="w-px h-20 bg-[#F0B429]/20 hidden md:block shrink-0" />
                <div>
                  <p className="text-[#C8C4BC] text-base md:text-lg leading-relaxed">
                    That's the average earnings gap between realtors who consistently post video
                    and those who don't.
                  </p>
                  <p className="mt-3 text-[#F0B429] font-semibold text-lg">
                    Reeltors.ai costs $49/month. That's a <span className="text-white font-extrabold">191x return</span> on a single deal.
                  </p>
                  <p className="text-[#2E2B27] text-sm mt-2">$1.57/day. Less than a bag of chips.</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* ── Three brutal truths — dark full-width band ── */}
      <div className="mt-4 bg-[#1A1714] border-y border-[#2E2B27] relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="max-w-5xl mx-auto px-4 py-16 relative">
          <FadeIn>
            <p className="text-center font-mono text-[11px] tracking-[0.3em] text-[#4A4744] uppercase mb-12">BY THE NUMBERS</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#2E2B27]">
            {[
              {
                stat: <AnimatedCounter end={73} suffix="%" />,
                fact: 'of homebuyers say video influenced their decision to contact an agent',
                source: 'NAR Research 2024',
              },
              {
                stat: <AnimatedCounter end={403} suffix="%" />,
                fact: 'more inquiries on listings that include video vs. photo-only listings',
                source: 'Zillow listing data',
              },
              {
                stat: '8 sec',
                fact: 'average human attention span. A video hooks them before they scroll past',
                source: 'Microsoft behavioral study',
              },
            ].map(({ stat, fact, source }, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="px-8 py-8 md:py-0 text-center first:pt-0 last:pb-0 md:first:pt-0 md:last:pb-0">
                  <div
                    className="font-syne font-extrabold text-[#F0B429] leading-none mb-5"
                    style={{ fontSize: 'clamp(4rem, 8vw, 6.5rem)' }}
                  >
                    {stat}
                  </div>
                  <p className="text-sm text-[#8A8682] leading-relaxed mb-3 max-w-[220px] mx-auto">{fact}</p>
                  <p className="text-[10px] text-[#4A4744] font-mono uppercase tracking-wider">{source}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* ── Compounding cost warning ── */}
      <div className="px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <FadeIn delay={150}>
            <div className="border-l-4 border-[#CC3D00]/40 bg-[#CC3D00]/10 rounded-r-[8px] px-6 py-5">
              <p className="text-[#C8C4BC] text-base leading-relaxed">
                <span className="text-[#FAFAF8] font-bold">The worst part? It compounds.</span>{' '}
                Every month you wait, the video-posting agents in your market get further ahead.
                They're building audiences while you're starting from zero. This decision gets more
                expensive every day you delay.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>

    </section>
  );
}
