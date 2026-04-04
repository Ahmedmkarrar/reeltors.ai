/* eslint-disable react/no-unescaped-entities */
import { FadeIn } from '@/components/ui/FadeIn';

const steps = [
  {
    number: '01',
    time: '10 sec',
    title: 'Drop Your Photos',
    description: 'Drag in the photos from your last listing shoot. Already on your phone? 10 seconds. We accept everything — MLS downloads, iPhone photos, email attachments.',
    detail: 'Zero new equipment. Zero new shoots.',
    pill: '4 photos → any format',
  },
  {
    number: '02',
    time: '15 sec',
    title: '3 Fields. That\'s It.',
    description: 'Address. Price. Your name. That\'s literally it. We handle music, transitions, motion effects, typography — every creative decision is made for you.',
    detail: 'This takes less time than writing a caption.',
    pill: 'Address + Price + Name',
  },
  {
    number: '03',
    time: '33 sec',
    title: 'Post. Watch Your Phone Ring.',
    description: 'Video renders in real-time. Download vertical for TikTok/Reels, square for feed, horizontal for YouTube. One listing, three platforms, done.',
    detail: '1 listing. 3 platforms. Every listing. Forever.',
    pill: 'TikTok · Reels · YouTube',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-[#1E1C18] overflow-hidden">

      {/* ── Header ── */}
      <div className="py-20 px-4 bg-[#0D0B08]">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-center font-mono text-[11px] tracking-[0.3em] text-[#4A4744] uppercase mb-5">
              STUPIDLY SIMPLE
            </p>
            <h2
              className="font-syne font-extrabold text-center text-[#FAFAF8] mb-5"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 1.0 }}
            >
              Three steps. 58 seconds.{' '}
              <span className="text-[#F0B429]">No excuses.</span>
            </h2>
            <p className="text-center text-[#8A8682] text-base md:text-lg max-w-xl mx-auto">
              We timed it. Watched a realtor do it live for the first time.{' '}
              <span className="text-[#FAFAF8] font-semibold">58 seconds</span> from opening the
              app to downloading a video ready for TikTok.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* ── Steps — alternating rows ── */}
      <div>
        {steps.map((step, i) => {
          const isDark = i % 2 === 1;
          return (
            <FadeIn key={step.number} delay={i * 150}>
              <div
                className="relative overflow-hidden border-t border-[#1E1C18]"
                style={{ background: isDark ? '#1A1714' : '#111010' }}
              >
                {isDark && <div className="absolute inset-0 dot-grid opacity-15" />}

                <div className="max-w-5xl mx-auto px-4 py-16 md:py-20 relative">
                  <div className="flex flex-col md:flex-row items-start gap-8 md:gap-16">

                    {/* Step number — giant */}
                    <div className="shrink-0">
                      <div
                        className="font-syne font-extrabold leading-none select-none"
                        style={{
                          fontSize: 'clamp(6rem, 14vw, 11rem)',
                          color: isDark ? 'rgba(240,180,41,0.15)' : 'rgba(240,180,41,0.08)',
                          lineHeight: 1,
                        }}
                        aria-hidden="true"
                      >
                        {step.number}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-2">
                      <div className="flex flex-wrap items-center gap-3 mb-5">
                        <span
                          className="font-mono text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                          style={{
                            background: isDark ? 'rgba(240,180,41,0.12)' : 'rgba(240,180,41,0.12)',
                            color: '#F0B429',
                            border: `1px solid ${isDark ? 'rgba(240,180,41,0.2)' : 'rgba(240,180,41,0.15)'}`,
                          }}
                        >
                          {step.time}
                        </span>
                        <span
                          className="text-[11px] font-mono"
                          style={{ color: '#4A4744' }}
                        >
                          {step.pill}
                        </span>
                      </div>

                      <h3
                        className="font-syne font-extrabold leading-tight mb-4"
                        style={{
                          fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                          color: '#FAFAF8',
                        }}
                      >
                        {step.title}
                      </h3>

                      <p
                        className="text-base md:text-lg leading-relaxed mb-4 max-w-xl"
                        style={{ color: '#8A8682' }}
                      >
                        {step.description}
                      </p>

                      <p
                        className="text-sm font-semibold"
                        style={{ color: '#F0B429' }}
                      >
                        → {step.detail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>

      {/* ── Total time callout — full dark band ── */}
      <div className="bg-[#1A1714] border-t border-[#2E2B27] relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="max-w-5xl mx-auto px-4 py-12 relative">
          <FadeIn delay={400}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="text-center">
                <div
                  className="font-syne font-extrabold text-[#F0B429] leading-none"
                  style={{ fontSize: 'clamp(4rem, 8vw, 6rem)' }}
                >
                  58
                </div>
                <div className="text-sm text-[#6B6760] font-mono uppercase tracking-widest mt-1">seconds total</div>
              </div>
              <div className="w-px h-16 bg-[#F0B429]/20 hidden sm:block" />
              <div className="max-w-sm text-center sm:text-left">
                <p className="text-[#C8C4BC] text-base leading-relaxed">
                  From opening Reeltor.ai to a finished video ready to post on TikTok. We watched a
                  first-timer do it.{' '}
                  <span className="text-white font-bold">58 seconds.</span>
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

    </section>
  );
}
