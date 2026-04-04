/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';

const lineItems = [
  { item: 'Professional videographer (per listing)',  normal: '$350–500',  },
  { item: 'Video editor + post-production',           normal: '$150–300',  },
  { item: 'Cinematic music licensing',                normal: '$30–80',    },
  { item: 'Motion graphics & title cards',            normal: '$75–150',   },
  { item: 'Format exports (TikTok, Reels, YouTube)',  normal: '$50–100',   },
  { item: 'Agent branding overlay on every video',    normal: '$50–100',   },
  { item: 'Unlimited re-exports & revisions',         normal: '$75+/each', },
];

export function ValueStack() {
  return (
    <section className="py-24 px-4 bg-[#0D0B08] border-t border-[#1E1C18]">
      <div className="max-w-3xl mx-auto">

        <FadeIn>
          <p className="text-center font-mono text-[11px] tracking-[0.3em] text-[#4A4744] uppercase mb-5">
            THE REAL VALUE
          </p>
          <h2 className="font-syne font-extrabold text-center text-[#FAFAF8] mb-5" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 1.0 }}>
            What this would cost you<br />
            <span className="text-[#F0B429]">if you hired it out.</span>
          </h2>
          <p className="text-center text-[#8A8682] text-base max-w-xl mx-auto mb-14">
            Every professional video involves a videographer, editor, designer, and licensing.
            That's $700–$1,200 per listing. Here's what you're actually getting.
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="bg-[#141210] border border-[#2E2B27] rounded-[10px] overflow-hidden mb-8">
            <div className="grid grid-cols-[1fr_140px_120px] px-6 py-3.5 border-b border-[#2E2B27] bg-[#1A1714]">
              <span className="text-[11px] font-mono text-[#4A4744] uppercase tracking-wider">What you get</span>
              <span className="text-[11px] font-mono text-[#4A4744] uppercase tracking-wider text-right">Hiring out</span>
              <span className="text-[11px] font-mono text-[#F0B429] uppercase tracking-wider text-right">With Pro</span>
            </div>

            {lineItems.map((line, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_140px_120px] px-6 py-4 border-b border-[#1E1C18] last:border-0 hover:bg-[#1A1714] transition-colors"
              >
                <span className="text-sm text-[#C8C4BC]">{line.item}</span>
                <span className="text-sm text-[#4A4744] text-right line-through">{line.normal}</span>
                <span className="text-sm text-[#F0B429] font-semibold text-right">Included</span>
              </div>
            ))}

            <div className="grid grid-cols-[1fr_140px_120px] px-6 py-5 bg-[#1A1714]">
              <span className="font-syne font-bold text-[#FAFAF8]">Total per listing</span>
              <span className="font-syne font-bold text-[#4A4744] text-right line-through">$780–$1,230</span>
              <span className="font-syne font-extrabold text-[#F0B429] text-right">
                $1.57<span className="text-xs font-normal text-[#8A8682]">/day</span>
              </span>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="border border-[#F0B429]/20 bg-[#F0B429]/5 rounded-[10px] p-6 text-center mb-10 relative overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative">
              <p className="text-[#8A8682] text-sm mb-2">One listing video made with Reeltor.ai generates</p>
              <p className="font-syne font-extrabold text-[#F0B429] text-3xl md:text-4xl mb-2">
                $9,400+ in potential commission.
              </p>
              <p className="text-[#8A8682] text-sm">
                Growth costs <span className="text-[#FAFAF8] font-semibold">$99/month</span>.
                Your first video pays for <span className="text-[#FAFAF8] font-semibold">94 months</span> of Growth.
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="flex justify-center">
            <Link href="/signup">
              <Button variant="primary" size="lg" className="text-base font-bold px-10 shadow-[0_0_40px_rgba(240,180,41,0.25)] hover:shadow-[0_0_60px_rgba(240,180,41,0.4)] transition-shadow">
                Get Started — From $49/month
              </Button>
            </Link>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
