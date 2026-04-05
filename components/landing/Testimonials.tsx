/* eslint-disable react/no-unescaped-entities */
'use client';

import { motion } from 'framer-motion';

const MARQUEE_ROW1 = [
  { name: 'Amy R.', brokerage: 'Compass · Dallas', text: 'First video got 12k views overnight. 3 buyer calls by morning.' },
  { name: 'Tom H.', brokerage: 'KW · Nashville', text: 'Closed $890k listing from a TikTok DM. Never happened before.' },
  { name: 'Lisa P.', brokerage: 'RE/MAX · Chicago', text: 'Saved $3,600 in production costs last month alone.' },
  { name: 'Carlos M.', brokerage: 'eXp · Houston', text: '200 followers → 8,400 in 45 days. Three became clients.' },
  { name: 'Rachel K.', brokerage: "Sotheby's · NYC", text: '$1.2M listing under contract in 4 days. Posted Tuesday, offer Friday.' },
  { name: 'Mike T.', brokerage: 'Douglas Elliman · LA', text: 'My broker asked what agency I hired. I said I made it in 60 seconds.' },
];

const MARQUEE_ROW2 = [
  { name: 'Priya S.', brokerage: 'Coldwell Banker · Austin', text: 'Went from 0 to 23k views on my first video. Booked 2 showings.' },
  { name: 'James W.', brokerage: 'Century 21 · Denver', text: 'First time a random person called me from social media in 9 years.' },
  { name: 'Natalie B.', brokerage: 'Howard Hanna · Pittsburgh', text: '$455k home, 4 offers in 48 hours. The TikTok had 19k views.' },
  { name: 'David L.', brokerage: 'Better Homes · Phoenix', text: 'My team adopted it. We now post every single listing. Game changer.' },
  { name: 'Sofia R.', brokerage: 'Engel & Völkers · Miami', text: 'Cut my marketing spend by $2,400/month. Better results too.' },
  { name: 'Mark C.', brokerage: 'eXp · Seattle', text: 'Signed up Monday. Had a listing video on TikTok by Tuesday night.' },
];

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
    result: '200 → 6,400 followers in 60 days',
    quote: "My broker kept telling me I needed to build my social presence. I had no idea how. Now I post a video every listing — 60 seconds each. My follower count went from 200 to 6,400 in 60 days. Three of those followers became clients this quarter.",
    name: 'Jennifer L.',
    role: 'Independent Realtor',
    location: 'Los Angeles, CA',
    initials: 'JL',
  },
  {
    result: 'First TikTok → 3 buyer calls',
    quote: "I signed up on a Tuesday. Had my first video posted that night. By Thursday I had 3 calls from buyers who found me through TikTok. I'd never had a stranger call me from social media in 8 years of real estate.",
    name: 'Derek W.',
    role: 'Realtor · eXp Realty',
    location: 'Phoenix, AZ',
    initials: 'DW',
  },
];

function MarqueeRow({ items, reverse = false }: { items: typeof MARQUEE_ROW1; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#F5F3EF] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#F5F3EF] to-transparent z-10 pointer-events-none" />
      <div
        className="flex gap-3 whitespace-nowrap"
        style={{
          animation: reverse
            ? 'ticker-scroll-reverse 50s linear infinite'
            : 'ticker-scroll 50s linear infinite',
          width: 'max-content',
        }}
      >
        {doubled.map((q, i) => (
          <div
            key={i}
            className="inline-flex flex-col gap-2 bg-white border border-[#EAE8E2] rounded-[10px] px-4 py-3 shrink-0 w-[270px] whitespace-normal shadow-sm hover:shadow-md hover:border-[#F0B429]/30 transition-all duration-200"
          >
            <div className="flex gap-0.5 text-[#C07A00]">
              {'★★★★★'.split('').map((s, j) => <span key={j} className="text-[10px]">{s}</span>)}
            </div>
            <p className="text-[12px] text-[#1A1714] leading-relaxed">&ldquo;{q.text}&rdquo;</p>
            <div>
              <p className="text-[11px] font-semibold text-[#1A1714]">{q.name}</p>
              <p className="text-[10px] text-[#8A8682]">{q.brokerage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-24 px-4 bg-[#F5F3EF] border-t border-b border-[#E2DED6]">
      <div className="max-w-5xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
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
        </motion.div>

        {/* Two marquee rows */}
        <div className="flex flex-col gap-3 mb-14 -mx-4">
          <MarqueeRow items={MARQUEE_ROW1} />
          <MarqueeRow items={MARQUEE_ROW2} reverse />
        </div>

        {/* Featured testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-10 bg-[#FFFBEE] border border-[#F0B429]/25 rounded-[12px] p-8 md:p-10 relative overflow-hidden shadow-[0_4px_40px_rgba(240,180,41,0.08)]"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F0B429]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#F0B429] opacity-[0.04] rounded-full blur-[80px] pointer-events-none" />

          <div className="inline-flex items-center gap-2 bg-[#F0B429] rounded px-3 py-1.5 mb-6 shadow-[0_2px_12px_rgba(240,180,41,0.35)]">
            <span className="text-[#1A1714] text-xs font-bold">$780k listing — under contract in 72 hours</span>
          </div>

          <div className="flex gap-0.5 text-[#C07A00] mb-5">
            {'★★★★★'.split('').map((s, j) => <span key={j} className="text-lg">{s}</span>)}
          </div>

          <blockquote className="text-[#2A2826] text-lg md:text-xl leading-relaxed mb-8 max-w-3xl font-inter">
            &ldquo;I listed a $780k home on Friday. Posted the TikTok at 11pm. Woke up Saturday
            to 23k views and 7 DMs from buyers I&apos;d never met. We were under contract by Monday
            for full ask. I&apos;ve never had that happen in 14 years of selling real estate.&rdquo;
          </blockquote>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#F0B429] flex items-center justify-center text-sm font-bold text-[#1A1714] shrink-0 shadow-[0_0_20px_rgba(240,180,41,0.3)]">
              MD
            </div>
            <div>
              <div className="font-semibold text-[#1A1714]">Marcus D.</div>
              <div className="text-sm text-[#7A5200]">Realtor &middot; Compass</div>
              <div className="text-xs text-[#2E2B27]">Miami, FL</div>
            </div>
          </div>
        </motion.div>

        {/* 3-card grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {cards.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white border border-[#ECEAE4] rounded-[12px] p-6 flex flex-col shadow-sm hover:shadow-md hover:border-[#F0B429]/30 transition-all duration-200 h-full cursor-default"
            >
              <div className="inline-flex items-center gap-2 bg-[#F0B429] rounded px-3 py-1.5 mb-5 self-start shadow-[0_2px_8px_rgba(240,180,41,0.3)]">
                <span className="text-[#1A1714] text-xs font-bold">{t.result}</span>
              </div>

              <div className="flex gap-0.5 text-[#C07A00] mb-3">
                {'★★★★★'.split('').map((s, j) => <span key={j} className="text-sm">{s}</span>)}
              </div>

              <p className="text-[#1A1714] text-sm leading-relaxed flex-1 mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-[#EAE8E2]">
                <div className="w-10 h-10 rounded-full bg-[#F0B429] flex items-center justify-center text-xs font-bold text-[#1A1714] shrink-0">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1A1714]">{t.name}</div>
                  <div className="text-xs text-[#6B6760]">{t.role}</div>
                  <div className="text-xs text-[#8A8682]">{t.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Aggregate stat bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { stat: '1,247',   label: 'active realtors' },
            { stat: '18,400+', label: 'videos created' },
            { stat: '4.9★',    label: 'average rating' },
            { stat: '$0',      label: 'to get started' },
          ].map(({ stat, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-white border border-[#EAE8E2] rounded-[10px] py-5 text-center hover:border-[#F0B429]/30 hover:shadow-sm transition-all duration-200"
            >
              <div className="font-syne font-extrabold text-2xl text-[#8B5E00] mb-0.5">{stat}</div>
              <div className="text-xs text-[#6B6760]">{label}</div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
