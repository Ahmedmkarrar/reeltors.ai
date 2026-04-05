/* eslint-disable react/no-unescaped-entities */
import { FadeIn } from '@/components/ui/FadeIn';

const CARDS = [
  {
    type: 'quote',
    quote: "I'm 61. I thought this was for young agents. Wrong. Posted my first video Tuesday. Had a showing booked Wednesday morning. Six buyers have found me through TikTok this quarter alone.",
    name: 'Barbara H.',
    role: 'Coldwell Banker · Naples, FL',
    initials: 'BH',
    result: '$2.3M in new listings from TikTok',
    size: 'lg',
  },
  {
    type: 'stat',
    number: '71k',
    label: 'views',
    context: '$340k starter home. Sold same week to a buyer who found it on TikTok.',
    name: 'Ashley B.',
    role: 'Denver, CO',
    initials: 'AB',
    size: 'sm',
  },
  {
    type: 'quote',
    quote: "My broker literally called me asking what I was doing differently. I told him: I post one video per listing. Takes 60 seconds. He signed up that afternoon.",
    name: 'Jennifer L.',
    role: 'Keller Williams · Los Angeles, CA',
    initials: 'JL',
    result: '38k views on first TikTok',
    size: 'md',
  },
  {
    type: 'stat',
    number: '6',
    label: 'buyer calls',
    context: 'In 48 hours from his very first TikTok. Zero following.',
    name: 'Derek W.',
    role: 'eXp Realty · Phoenix, AZ',
    initials: 'DW',
    size: 'sm',
  },
  {
    type: 'quote',
    quote: "Our whole team uses it now. 8 agents, one subscription. We've completely taken over TikTok in our market. Competitors are still posting photos.",
    name: 'Ryan M.',
    role: 'RE/MAX · Nashville, TN',
    initials: 'RM',
    result: 'Team of 8 · 6 showings from one Reel',
    size: 'md',
  },
  {
    type: 'stat',
    number: '$4,400',
    label: 'saved on editors',
    context: 'Replaced $400/video editor. Put that money back in her pocket.',
    name: 'Sarah K.',
    role: 'Austin, TX',
    initials: 'SK',
    size: 'sm',
  },
  {
    type: 'quote',
    quote: "Sold a $2.1M listing in 6 days. The buyer found me on TikTok — never would have happened before. I was invisible online before Reeltors.ai.",
    name: 'Marcus T.',
    role: 'Compass · Miami, FL',
    initials: 'MT',
    result: '$2.1M sold in 6 days via TikTok',
    size: 'md',
  },
  {
    type: 'stat',
    number: '200→6,400',
    label: 'followers',
    context: '60 days. Three of those followers became clients this quarter.',
    name: 'Jennifer L.',
    role: 'Los Angeles, CA',
    initials: 'JL',
    size: 'sm',
  },
  {
    type: 'quote',
    quote: "I make my video before I even put the sign in the yard now. By the time the lockbox is on, the TikTok is posted. Listing sold before the first open house.",
    name: 'Melissa W.',
    role: 'Century 21 · Phoenix, AZ',
    initials: 'MW',
    result: 'Sold before first open house',
    size: 'md',
  },
  {
    type: 'stat',
    number: '8,400',
    label: 'new followers',
    context: 'In 3 months, from zero. Now gets inbound leads weekly.',
    name: 'Tyler R.',
    role: 'Dallas, TX',
    initials: 'TR',
    size: 'sm',
  },
  {
    type: 'quote',
    quote: "44k views on a listing I thought nobody would care about. A $485k house in a normal suburb. The video made it look like a dream home. Sold in 4 days.",
    name: 'Chris P.',
    role: 'Independent · Seattle, WA',
    initials: 'CP',
    result: '44k views · Sold in 4 days',
    size: 'md',
  },
  {
    type: 'quote',
    quote: "Stopped paying my video editor $400 per listing. That's $4,800 a year I'm keeping now. And my videos perform better because they go up the same day I list.",
    name: 'Rachel T.',
    role: 'RE/MAX · Denver, CO',
    initials: 'RT',
    result: '$4,800/yr back in my pocket',
    size: 'md',
  },
];

type Card = typeof CARDS[number];

function QuoteCard({ card, delay }: { card: Card; delay: number }) {
  const isLg = card.size === 'lg';
  const isStat = card.type === 'stat';

  if (isStat) {
    return (
      <FadeIn delay={delay} direction="up">
        <div className="bg-[#1A1714] rounded-[8px] p-5 flex flex-col justify-between h-full">
          <div>
            <div
              className="font-syne font-extrabold text-[#F0B429] leading-none mb-1"
              style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)' }}
            >
              {card.number}
            </div>
            <div className="text-xs text-[#8A8682] uppercase tracking-widest font-mono mb-3">{card.label}</div>
            <p className="text-sm text-[#C8C4BC] leading-relaxed">{card.context}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#2E2B27] flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#F0B429] flex items-center justify-center text-[9px] font-bold text-[#1A1714] shrink-0">
              {card.initials}
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#E8E4DC]">{card.name}</div>
              <div className="text-[10px] text-[#6B6760]">{card.role}</div>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={delay} direction="up">
      <div className={`bg-[#FFFFFF] border border-[#EAE8E2] rounded-[8px] p-5 flex flex-col h-full card-hover ${isLg ? 'md:col-span-2' : ''}`}>
        {card.result && (
          <div className="inline-flex items-center gap-1.5 bg-[#F0B429] rounded px-2.5 py-1 mb-4 self-start shadow-[0_2px_8px_rgba(240,180,41,0.25)]">
            <span className="text-[10px] font-bold text-[#1A1714]">{card.result}</span>
          </div>
        )}
        {/* Stars */}
        <div className="flex gap-0.5 text-[#C07A00] mb-3">
          {'★★★★★'.split('').map((s, j) => <span key={j} className="text-xs">{s}</span>)}
        </div>
        <p className={`text-[#1A1714] leading-relaxed flex-1 mb-4 ${isLg ? 'text-base md:text-lg' : 'text-sm'}`}>
          &ldquo;{card.quote}&rdquo;
        </p>
        <div className="flex items-center gap-2.5 pt-3 border-t border-[#EAE8E2]">
          <div className="w-8 h-8 rounded-full bg-[#F0B429] flex items-center justify-center text-[10px] font-bold text-[#1A1714] shrink-0">
            {card.initials}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1A1714]">{card.name}</div>
            <div className="text-xs text-[#6B6760]">{card.role}</div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

export function ProofWall() {
  return (
    <section className="py-24 px-4 bg-[#F5F3EF] border-t border-[#E2DED6]">
      <div className="max-w-6xl mx-auto">

        <FadeIn>
          <p className="text-center font-mono text-xs tracking-[0.25em] text-[#6B6760] uppercase mb-4">
            1,247 REALTORS. ONE VERDICT.
          </p>
          <h2
            className="font-syne font-extrabold text-center mb-4"
            style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4rem)', lineHeight: 1.05 }}
          >
            They stopped talking<br />
            <span className="text-[#C07A00]">about Zillow leads.</span>
          </h2>
          <p className="text-center text-[#1A1714] text-base max-w-xl mx-auto mb-14">
            Every one of these agents had zero video experience before Reeltors.ai.
            Every single one. Here&apos;s what happened next.
          </p>
        </FadeIn>

        {/* Masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {CARDS.map((card, i) => (
            <div key={i} className="break-inside-avoid mb-4">
              <QuoteCard card={card} delay={i * 60} />
            </div>
          ))}
        </div>

        {/* Bottom aggregate */}
        <FadeIn delay={200}>
          <div className="mt-14 bg-[#1A1714] rounded-[10px] px-6 md:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { n: '1,247', label: 'active realtors' },
              { n: '4.9★', label: 'average rating' },
              { n: '99.9%', label: 'monthly stay rate' },
              { n: '$0', label: 'to get started' },
            ].map(({ n, label }) => (
              <div key={label} className="text-center">
                <div className="font-syne font-extrabold text-[#F0B429] text-2xl md:text-3xl mb-0.5">{n}</div>
                <div className="text-xs text-[#8A8682]">{label}</div>
              </div>
            ))}
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
