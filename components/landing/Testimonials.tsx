/* eslint-disable react/no-unescaped-entities */
import { FadeIn } from '@/components/ui/FadeIn';

const cards = [
  {
    result: '$4,400 saved + $1.1M in new listings',
    quote: 'I used to spend $400 per listing on a video editor. Last month I made 11 videos in Reeltor.ai in one afternoon. But the real win? One of those videos went to 41k views and a buyer called me directly. That turned into a $1.1M listing. Off one TikTok.',
    name: 'Sarah K.',
    role: 'Realtor · Keller Williams',
    location: 'Austin, TX',
    initials: 'SK',
  },
  {
    result: '200 &rarr; 6,400 followers in 60 days',
    quote: 'My broker kept telling me I needed to build my social presence. I had no idea how. Now I post a video every listing — 60 seconds each. My follower count went from 200 to 6,400 in 60 days. Three of those followers became clients this quarter.',
    name: 'Jennifer L.',
    role: 'Independent Realtor',
    location: 'Los Angeles, CA',
    initials: 'JL',
  },
  {
    result: 'First TikTok &rarr; 3 buyer calls',
    quote: 'I signed up on a Tuesday. Had my first video posted that night. By Thursday I had 3 calls from buyers who found me through TikTok. I\'d never had a stranger call me from social media in 8 years of real estate.',
    name: 'Derek W.',
    role: 'Realtor · eXp Realty',
    location: 'Phoenix, AZ',
    initials: 'DW',
  },
];

export function Testimonials() {
  return (
    <section className="py-24 px-4 bg-[#F5F3EF] border-t border-b border-[#E2DED6]">
      <div className="max-w-5xl mx-auto">

        <FadeIn>
          <p className="text-center font-mono text-xs tracking-[0.25em] text-[#6B6760] uppercase mb-4">
            REAL RESULTS. REAL AGENTS.
          </p>
          <h2 className="font-syne font-extrabold text-center mb-4" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 1.0 }}>
            These aren&apos;t influencers.<br />
            <span className="text-[#C07A00]">They&apos;re realtors just like you.</span>
          </h2>
          <p className="text-center text-[#1A1714] text-base max-w-xl mx-auto mb-14">
            No video experience. No big following. No marketing budget.
            Just listing photos and 60 seconds.
          </p>
        </FadeIn>

        {/* Featured testimonial */}
        <FadeIn delay={80}>
          <div className="mb-10 bg-[#FFFBEE] border border-[#F0B429]/25 rounded-[6px] p-8 md:p-10 relative overflow-hidden shadow-[0_0_60px_rgba(240,180,41,0.04)]">
            {/* Left lime accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F0B429]" />

            {/* Result badge */}
            <div className="inline-flex items-center gap-2 bg-[#F0B429] rounded px-3 py-1.5 mb-6 shadow-[0_2px_12px_rgba(240,180,41,0.35)]">
              <span className="text-[#1A1714] text-xs font-bold">$780k listing — under contract in 72 hours</span>
            </div>

            {/* Stars */}
            <div className="flex gap-0.5 text-[#C07A00] mb-5">
              {'★★★★★'.split('').map((s, j) => <span key={j} className="text-lg">{s}</span>)}
            </div>

            {/* Quote */}
            <blockquote className="text-[#2A2826] text-lg md:text-xl leading-relaxed mb-8 max-w-3xl font-inter">
              &ldquo;I listed a $780k home on Friday. Posted the TikTok at 11pm. Woke up Saturday
              to 23k views and 7 DMs from buyers I&apos;d never met. We were under contract by Monday
              for full ask. I&apos;ve never had that happen in 14 years of selling real estate.&rdquo;
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F0B429] flex items-center justify-center text-sm font-bold text-[#1A1714] shrink-0">
                MD
              </div>
              <div>
                <div className="font-semibold text-[#1A1714]">Marcus D.</div>
                <div className="text-sm text-[#7A5200]">Realtor &middot; Compass</div>
                <div className="text-xs text-[#2E2B27]">Miami, FL</div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 3-card grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {cards.map((t, i) => (
            <FadeIn key={t.name} delay={i * 130}>
              <div className="bg-[#F7F5EF] border border-[#ECEAE4] rounded-[6px] p-6 flex flex-col card-hover h-full">
                {/* Result badge */}
                <div className="inline-flex items-center gap-2 bg-[#F0B429] rounded px-3 py-1.5 mb-5 self-start shadow-[0_2px_8px_rgba(240,180,41,0.3)]">
                  <span
                    className="text-[#1A1714] text-xs font-bold"
                    dangerouslySetInnerHTML={{ __html: t.result }}
                  />
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 text-[#C07A00] mb-3">
                  {'★★★★★'.split('').map((s, j) => <span key={j} className="text-sm">{s}</span>)}
                </div>

                {/* Quote */}
                <p className="text-[#1A1714] text-sm leading-relaxed flex-1 mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#EAE8E2]">
                  <div className="w-10 h-10 rounded-full bg-[#F0B429] flex items-center justify-center text-xs font-bold text-[#1A1714] shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1A1714]">{t.name}</div>
                    <div className="text-xs text-[#2E2B27]">{t.role}</div>
                    <div className="text-xs text-[#7A7672]">{t.location}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Aggregate stat bar */}
        <FadeIn delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { stat: '1,247',   label: 'active realtors' },
              { stat: '18,400+', label: 'videos created' },
              { stat: '4.9★',    label: 'average rating' },
              { stat: '$0',      label: 'to get started' },
            ].map(({ stat, label }) => (
              <div key={label} className="bg-[#F7F5EF] border border-[#EAE8E2] rounded-[6px] py-5 text-center card-hover">
                <div className="font-syne font-extrabold text-2xl text-[#8B5E00] mb-0.5">{stat}</div>
                <div className="text-xs text-[#6B6760]">{label}</div>
              </div>
            ))}
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
