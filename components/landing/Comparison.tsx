import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';

type CellValue = true | false | string;

const rows: { feature: string; reeltor: CellValue; agency: CellValue; diy: CellValue }[] = [
  { feature: 'Cost per listing', reeltor: '$1.57/day flat', agency: '$400–800/video', diy: '2–4 hrs of your time' },
  { feature: 'Time to produce', reeltor: '60 seconds', agency: '3–7 business days', diy: '2–4 hours' },
  { feature: 'Works with MLS photos', reeltor: true, agency: true, diy: true },
  { feature: 'Consistent every listing', reeltor: true, agency: false, diy: false },
  { feature: 'TikTok + Reels + YouTube', reeltor: true, agency: 'Extra charge', diy: 'Manual export' },
  { feature: 'Agent branding included', reeltor: true, agency: 'Extra charge', diy: true },
  { feature: 'Available same day', reeltor: true, agency: false, diy: false },
  { feature: 'Scales to every listing', reeltor: true, agency: 'Way too expensive', diy: 'Never happens' },
  { feature: '30-day money-back', reeltor: true, agency: false, diy: false },
];

function Cell({ value, highlight = false }: { value: CellValue; highlight?: boolean }) {
  const base = `px-4 py-3.5 text-center ${highlight ? 'bg-[#1A1714]' : ''}`;

  if (value === true) return (
    <td className={base}>
      <div className="flex justify-center">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${highlight ? 'bg-[#F0B429] shadow-[0_0_10px_rgba(240,180,41,0.3)]' : 'bg-[#2E2B27]'}`}>
          <span className={`text-[10px] font-bold ${highlight ? 'text-[#0D0B08]' : 'text-[#4A4744]'}`}>✓</span>
        </div>
      </div>
    </td>
  );

  if (value === false) return (
    <td className={base}>
      <span className="text-[#2E2B27] text-sm font-bold">—</span>
    </td>
  );

  return (
    <td className={base}>
      <span className={`text-xs ${highlight ? 'text-[#F0B429] font-semibold' : 'text-[#4A4744]'}`}>{value}</span>
    </td>
  );
}

export function Comparison() {
  return (
    <section className="py-24 px-4 bg-[#111010] border-t border-[#1E1C18]">
      <div className="max-w-4xl mx-auto">

        <FadeIn>
          <p className="text-center font-mono text-[11px] tracking-[0.3em] text-[#4A4744] uppercase mb-5">THE MATH IS OBVIOUS</p>
          <h2 className="font-syne font-extrabold text-center text-[#FAFAF8] mb-5" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 1.0 }}>
            Replace a $500/video agency<br />
            <span className="text-[#F0B429]">with $1.57/day software.</span>
          </h2>
          <p className="text-center text-[#8A8682] text-base max-w-xl mx-auto mb-14">
            The only difference between you and the agent crushing it on TikTok is this table.
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="overflow-x-auto rounded-[10px] border border-[#2E2B27]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#2E2B27]">
                  <th className="px-4 py-4 text-left text-[11px] font-mono text-[#4A4744] uppercase tracking-wider bg-[#141210] w-[38%]">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-center bg-[#1A1714] border-x border-[#F0B429]/20 relative">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#F0B429]" />
                    <div className="font-syne font-extrabold text-[#F0B429] text-sm">Reeltors.ai</div>
                    <div className="text-[10px] text-[#8A8682] mt-0.5">$47/month</div>
                  </th>
                  <th className="px-4 py-4 text-center bg-[#141210]">
                    <div className="font-semibold text-[#4A4744] text-xs">Videographer</div>
                    <div className="text-[10px] text-[#2E2B27] mt-0.5">$400–800/video</div>
                  </th>
                  <th className="px-4 py-4 text-center bg-[#141210]">
                    <div className="font-semibold text-[#4A4744] text-xs">DIY (CapCut)</div>
                    <div className="text-[10px] text-[#2E2B27] mt-0.5">Your time</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-[#1E1C18] ${i % 2 === 0 ? 'bg-[#0D0B08]' : 'bg-[#141210]'}`}>
                    <td className="px-4 py-4 text-sm text-[#C8C4BC] font-medium">{row.feature}</td>
                    <Cell value={row.reeltor} highlight />
                    <Cell value={row.agency} />
                    <Cell value={row.diy} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>

        {/* CTA row pinned at bottom */}
        <div className="sticky bottom-0 bg-[#141210] border-t border-[#F0B429]/20 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-syne font-bold text-[#FAFAF8] text-sm">One extra closing covers 200 months of Pro.</p>
            <p className="text-xs text-[#8A8682]">$9,400 avg commission ÷ $49/month = 191x ROI on a single deal.</p>
          </div>
          <Link href="/signup" className="shrink-0">
            <Button variant="primary" size="md" className="font-bold whitespace-nowrap shadow-[0_0_30px_rgba(240,180,41,0.2)]">
              Get Started →
            </Button>
          </Link>
        </div>
      </div>
    </ContainerScroll>
    </section >
  );
}
