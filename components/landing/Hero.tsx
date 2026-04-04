/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { HeroDemoWidget } from '@/components/landing/HeroDemoWidget';

export function Hero() {

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-28 pb-24 px-4 overflow-hidden bg-[#0D0B08]">
      {/* Background layers */}
      <div className="absolute inset-0 dot-grid" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      {/* Top center gold beam */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none" style={{ background: 'conic-gradient(from 180deg at 50% -5%, transparent 65deg, rgba(240,180,41,0.12) 80deg, rgba(240,180,41,0.22) 90deg, rgba(240,180,41,0.12) 100deg, transparent 115deg)' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#F0B429] opacity-[0.08] rounded-full blur-[100px] pointer-events-none" />
      {/* Bottom right subtle glow */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-[#F0B429] opacity-[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-center">

          {/* ── Left column ── */}
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-8 hero-enter hero-enter-1">
              <div className="flex items-center gap-2 border border-[#F0B429]/30 bg-[#F0B429]/8 rounded-full px-4 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F0B429] animate-pulse shrink-0" />
                <span className="text-[11px] font-bold text-[#F0B429] tracking-wider uppercase">
                  Free to start · No camera needed
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1
              className="font-syne font-extrabold tracking-tight mb-6 hero-enter hero-enter-2"
              style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5.2rem)', lineHeight: 1.0, color: '#FAFAF8' }}
            >
              Your listings are{' '}
              <span style={{ color: '#4A4744', textDecoration: 'line-through', textDecorationColor: 'rgba(255,80,0,0.6)', textDecorationThickness: '4px' }}>
                invisible.
              </span>
              <br />
              Make them{' '}
              <span
                className="relative inline-block"
                style={{
                  background: 'linear-gradient(135deg, #F0B429 0%, #FFD166 50%, #F0B429 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                go viral.
              </span>
            </h1>

            {/* Sub */}
            <p className="text-[#8A8682] text-[1.15rem] leading-relaxed mb-8 max-w-[480px] hero-enter hero-enter-3">
              Turn your listing photos into cinematic TikToks and Reels in{' '}
              <span className="text-[#FAFAF8] font-semibold">60 seconds flat</span>.
              No camera. No editor. No excuses.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 hero-enter hero-enter-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto font-bold px-8 text-[15px] shadow-[0_0_40px_rgba(240,180,41,0.4)] hover:shadow-[0_0_60px_rgba(240,180,41,0.6)] transition-all"
                >
                  Make My First Video Free →
                </Button>
              </Link>
              <a href="#how-it-works">
                <button className="w-full sm:w-auto h-12 px-7 text-[15px] font-semibold text-[#8A8682] border border-[#2E2B27] rounded-[6px] hover:border-[#4A4744] hover:text-[#C8C4BC] transition-all">
                  See How It Works ↓
                </button>
              </a>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 hero-enter hero-enter-5">
              {[
                '30-day money-back guarantee',
                'Cancel anytime',
                'Ready in 60 seconds',
                'No filming needed',
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-[12px] text-[#4A4744]">
                  <svg className="w-3.5 h-3.5 text-[#F0B429] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="hidden lg:flex flex-col gap-3 hero-enter hero-enter-r">
            <HeroDemoWidget />
            <div className="flex items-center gap-2 px-1">
              <span className="text-[11px] text-[#4A4744]">Your photos</span>
              <div className="flex-1 h-px bg-gradient-to-r from-[#2E2B27] via-[#F0B429]/40 to-[#F0B429]" />
              <span className="text-[11px] text-[#F0B429] font-semibold">Viral reel ↗</span>
            </div>
          </div>
        </div>

        {/* ── Bottom stats ── */}
        <div className="mt-16 pt-8 border-t border-[#1E1C18] hero-enter hero-enter-5">
          <div className="flex flex-wrap items-center justify-center gap-10">
            {[
              { n: '60s',   label: 'avg creation time' },
              { n: '403%',  label: 'more buyer inquiries*' },
              { n: '3',     label: 'platforms per video' },
              { n: '$19',   label: 'to get started' },
            ].map(({ n, label }) => (
              <div key={label} className="text-center">
                <div className="font-syne font-extrabold text-2xl text-[#F0B429]">{n}</div>
                <div className="text-[11px] text-[#4A4744] mt-0.5 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-[#4A4744] mt-3 font-mono">* NAR Research 2024</p>
        </div>
      </div>
    </section>
  );
}
