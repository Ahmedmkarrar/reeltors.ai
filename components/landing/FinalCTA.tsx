/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';

export function FinalCTA() {
  return (
    <section className="relative py-32 px-4 overflow-hidden bg-[#0D0B08] border-t border-[#1E1C18]">
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none" style={{ background: 'conic-gradient(from 180deg at 50% -5%, transparent 65deg, rgba(240,180,41,0.10) 80deg, rgba(240,180,41,0.18) 90deg, rgba(240,180,41,0.10) 100deg, transparent 115deg)' }} />

      <div className="relative max-w-3xl mx-auto text-center">
        <FadeIn>
          <p className="font-mono text-[11px] tracking-[0.3em] text-[#4A4744] uppercase mb-6">THE BOTTOM LINE</p>

          <h2 className="font-syne font-extrabold text-[#FAFAF8] mb-6" style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', lineHeight: 1.0 }}>
            Every listing without a video
            <br />
            <span className="text-[#F0B429]">is a lead you're giving away.</span>
          </h2>

          <p className="text-[#8A8682] text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
            Not maybe. Not probably. Actually. The buyer who would have called you will find
            the agent who posted video first.
          </p>

          <p className="text-[#4A4744] text-base mb-12 leading-relaxed">
            Starts at $49/month. Takes 60 seconds. If it doesn't work —
            email us within 30 days for a full refund. No questions asked.
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <Link href="/signup">
            <Button
              size="lg"
              variant="primary"
              className="text-base font-bold px-12 py-5 shadow-[0_0_60px_rgba(240,180,41,0.3)] hover:shadow-[0_0_90px_rgba(240,180,41,0.5)] transition-shadow"
            >
              Get Started — From $49/month →
            </Button>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {['From $49/month', '30-day money back', 'Cancel anytime', 'Ready in 60 seconds'].map((item, i, arr) => (
              <span key={item} className="flex items-center gap-3">
                <span className="text-xs text-[#4A4744]">{item}</span>
                {i < arr.length - 1 && <span className="text-[#2E2B27]">&middot;</span>}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
