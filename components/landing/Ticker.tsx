'use client';

const items = [
  { text: '60 seconds from photos to finished video' },
  { text: '403% more buyer inquiries with video vs. photos alone' },
  { text: 'TikTok · Instagram Reels · YouTube Shorts — one click' },
  { text: 'MLS compliant · no editing · no filming required' },
  { text: 'Vertical · Square · Horizontal — all formats included' },
  { text: '$47/month replaces a $500/video editor' },
  { text: 'Works with iPhone photos · MLS downloads · any image' },
  { text: 'Agent branding on every video automatically' },
  { text: '30-day money-back guarantee · cancel anytime' },
  { text: 'Be among the first agents in your market posting video' },
];

export function Ticker() {
  const doubled = [...items, ...items];

  return (
    <div className="border-y border-[#1E1C18] bg-[#0D0B08] overflow-hidden py-3 relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0D0B08] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0D0B08] to-transparent z-10 pointer-events-none" />
      <div
        className="flex gap-0 whitespace-nowrap"
        style={{ animation: 'ticker-scroll 60s linear infinite', width: 'max-content' }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 px-8">
            <span className="w-1 h-1 rounded-full bg-[#F0B429]/50 shrink-0" />
            <span className="text-[11px] text-[#4A4744] font-mono tracking-wide">{item.text}</span>
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
