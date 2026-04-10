'use client';

import { FadeIn } from '@/components/ui/FadeIn';

const PHOTOS = [
  '/demoo/img1.jpg',
  '/demoo/imgdemo.jpg',
  '/demoo/imgrnf.jpg',
  '/demoo/knfkenwfjkne.jpg',
  '/demoo/fjkneknfjn.jpg',
];

export function DemoSection() {
  return (
    <section className="py-24 px-4 bg-[#0D0B08] border-t border-[#1E1C18] overflow-hidden">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <FadeIn>
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[11px] font-mono text-[#4A4744] uppercase tracking-[0.3em]">Real Listing · Real Result</span>
          </div>
          <h2
            className="font-syne font-extrabold text-center text-[#FAFAF8] mb-4"
            style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)', lineHeight: 1.0 }}
          >
            These are the raw MLS photos.<br />
            <span className="text-[#F0B429]">This is what we made. In 60 seconds.</span>
          </h2>
          <p className="text-center text-[#6B6760] text-base max-w-xl mx-auto mb-16">
            No videographer. No editor. No filming. Just upload your listing photos and hit generate.
          </p>
        </FadeIn>

        {/* Main demo layout */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

          {/* ── Left: Raw photos ── */}
          <FadeIn delay={100} direction="right" className="flex-1 w-full">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-mono text-[#4A4744] uppercase tracking-[0.25em] mb-3">
                Input — 5 MLS photos
              </p>

              {/* Featured large photo */}
              <div className="rounded-[10px] overflow-hidden border border-[#2E2B27] aspect-video w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTOS[0]}
                  alt="Listing photo"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 4 small photos */}
              <div className="grid grid-cols-4 gap-2">
                {PHOTOS.slice(1).map((src, i) => (
                  <div key={i} className="rounded-[6px] overflow-hidden border border-[#2E2B27] aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt="Listing photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* ── Arrow ── */}
          <FadeIn delay={200} className="shrink-0 flex flex-col items-center gap-3">
            <div className="hidden lg:flex flex-col items-center gap-2">
              <div className="w-px h-12 bg-gradient-to-b from-transparent to-[#F0B429]/40" />
              <div className="w-10 h-10 rounded-full bg-[#F0B429]/10 border border-[#F0B429]/25 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#F0B429]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-[#F0B429]/40 to-transparent" />
            </div>
            {/* Mobile arrow */}
            <div className="lg:hidden flex items-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#F0B429]/40" />
              <div className="w-10 h-10 rounded-full bg-[#F0B429]/10 border border-[#F0B429]/25 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#F0B429] rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#F0B429]/40" />
            </div>
            <span className="text-[10px] font-mono text-[#F0B429]/60 uppercase tracking-widest">60 sec</span>
          </FadeIn>

          {/* ── Right: Phone with video ── */}
          <FadeIn delay={300} direction="left" className="shrink-0">
            <p className="text-[11px] font-mono text-[#4A4744] uppercase tracking-[0.25em] mb-3 text-center">
              Output — TikTok / Reels ready
            </p>

            {/* Phone mockup */}
            <div className="relative mx-auto" style={{ width: 260 }}>
              {/* Glow */}
              <div className="absolute -inset-6 rounded-[50px] bg-[#F0B429] opacity-[0.08] blur-[30px] pointer-events-none" />
              {/* Gold top line */}
              <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#F0B429]/60 to-transparent z-10 rounded-full" />

              {/* Phone shell */}
              <div className="relative bg-black rounded-[36px] border border-[#333] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)]"
                style={{ aspectRatio: '9/19.5' }}>

                {/* Status bar */}
                <div className="absolute top-3 left-5 right-5 flex items-center justify-between z-20">
                  <span className="text-white/50 text-[9px] font-mono font-bold">9:41</span>
                  <div className="flex items-center gap-1">
                    {[40, 65, 90].map((o) => (
                      <div key={o} className="w-0.5 h-3 rounded-full" style={{ background: `rgba(255,255,255,${o / 100})` }} />
                    ))}
                    <div className="w-4 h-2.5 border border-white/40 rounded-[3px] ml-1 relative">
                      <div className="absolute inset-[1.5px] right-[3px] bg-white/60 rounded-[1px]" />
                    </div>
                  </div>
                </div>

                {/* YouTube embed — fills the phone screen */}
                <iframe
                  src="https://www.youtube.com/embed/8bnFqAHpDro?autoplay=0&controls=1&rel=0&modestbranding=1&loop=1&playlist=8bnFqAHpDro"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Reeltors.ai demo video"
                  style={{ border: 'none' }}
                />

                {/* TikTok-style right actions */}
                <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-20 pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                    <span className="text-base">♥</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                    <span className="text-base">💬</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                    <span className="text-base">↗</span>
                  </div>
                </div>
              </div>

              {/* Badge below phone */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="flex items-center gap-2 bg-[#1A1714] border border-[#2E2B27] rounded-full px-4 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F0B429]" />
                  <span className="text-[11px] font-semibold text-[#8A8682]">Cinematic Template</span>
                </div>
              </div>
            </div>
          </FadeIn>

        </div>

        {/* Bottom stat strip */}
        <FadeIn delay={400}>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '📸', label: 'You provide', value: '5 listing photos' },
              { icon: '⚡', label: 'Time to generate', value: '60 seconds' },
              { icon: '📱', label: 'Ready to post on', value: 'TikTok · Reels · Shorts' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-[#141210] border border-[#2E2B27] rounded-[10px] p-5 flex items-center gap-4">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-[10px] font-mono text-[#4A4744] uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="font-syne font-bold text-[#FAFAF8] text-sm">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
