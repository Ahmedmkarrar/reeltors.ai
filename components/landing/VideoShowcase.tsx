import { FadeIn } from '@/components/ui/FadeIn';

const videos = [
  {
    address: '2847 Oak Drive',
    city: 'Austin, TX',
    price: '$485,000',
    handle: '@sarahkw',
    music: 'Cinematic Listing – Reeltor.ai',
    gradient: 'from-slate-700 via-slate-800 to-emerald-950',
    template: 'Cinematic',
    views: '41k',
    trending: false,
  },
  {
    address: '1429 Palm Ave',
    city: 'Miami, FL',
    price: '$780,000',
    handle: '@marcusd.re',
    music: 'Luxury Listing – Reeltor.ai',
    gradient: 'from-blue-900 via-indigo-950 to-slate-900',
    template: 'Luxury',
    views: '23k',
    trending: true,
  },
  {
    address: '8801 Sunset Blvd',
    city: 'Los Angeles, CA',
    price: '$1,100,000',
    handle: '@jlrealtor',
    music: 'Cinematic Listing – Reeltor.ai',
    gradient: 'from-amber-900 via-orange-950 to-slate-900',
    template: 'Cinematic',
    views: '18k',
    trending: false,
  },
  {
    address: '5502 Pine Street',
    city: 'Denver, CO',
    price: '$612,000',
    handle: '@ashleyb.homes',
    music: 'Quick Reel – Reeltor.ai',
    gradient: 'from-teal-900 via-emerald-950 to-slate-900',
    template: 'Quick Reel',
    views: '9k',
    trending: false,
  },
];

type Video = typeof videos[number];

function PhoneMockup({ v, delay }: { v: Video; delay: number }) {
  return (
    <FadeIn delay={delay} direction="up">
      <div className="flex flex-col items-center gap-3">

        {/* Phone wrapper with glow */}
        <div className="relative">
          {/* Trending animated border */}
          {v.trending && (
            <div
              className="absolute -inset-[2px] rounded-[26px] z-0"
              style={{
                background: 'linear-gradient(135deg, #F0B429, #FFD166, #D4880A, #F0B429)',
                backgroundSize: '300% 300%',
                animation: 'gradient-border-spin 3s ease infinite',
                opacity: 0.8,
              }}
            />
          )}
          {/* Ambient glow */}
          <div
            className={`absolute -inset-[12px] rounded-[36px] blur-[20px] pointer-events-none ${
              v.trending ? 'bg-[#F0B429] opacity-25 animate-glow-pulse' : 'bg-[#F0B429] opacity-[0.06]'
            }`}
          />

          {/* Trending badge */}
          {v.trending && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#F0B429] text-[#0D0B08] text-[8px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shadow-[0_0_16px_rgba(240,180,41,0.6)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D0B08] animate-pulse" />
              {v.views} views
            </div>
          )}

          {/* Phone screen */}
          <div className="relative w-[145px] h-[258px] bg-black rounded-[24px] border border-[#333] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] group z-10">
            <div className={`absolute inset-0 bg-gradient-to-b ${v.gradient}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />

            {/* Status bar */}
            <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
              <span className="text-white/50 text-[7px] font-mono font-bold">9:41</span>
              <div className="flex items-center gap-1">
                {[40, 60, 90].map((o) => (
                  <div key={o} className="w-0.5 h-2.5 rounded-full" style={{ background: `rgba(255,255,255,${o/100})` }} />
                ))}
                <div className="w-3.5 h-2 border border-white/40 rounded-[2px] ml-1 relative">
                  <div className="absolute inset-[1px] left-[1px] right-[3px] bg-white/60 rounded-[1px]" />
                  <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-[2px] h-1 bg-white/40 rounded-r" />
                </div>
              </div>
            </div>

            {/* TikTok-style right actions */}
            <div className="absolute right-2.5 bottom-20 flex flex-col items-center gap-4 z-10">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <span className="text-sm">♥</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <span className="text-sm">💬</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <span className="text-sm">↗</span>
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-[#F0B429]/60 bg-[#F0B429]/20 flex items-center justify-center animate-spin-slow">
                <span className="text-[9px]">♪</span>
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-4 left-3 right-12 z-10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-[#F0B429] flex items-center justify-center text-[7px] font-black text-[#0D0B08]">
                  {v.handle.charAt(1).toUpperCase()}
                </div>
                <span className="text-[9px] font-bold text-white">{v.handle}</span>
                <span className="text-[8px] text-white/60 border border-white/30 rounded px-1">Follow</span>
              </div>
              <p className="text-[8px] text-white/80 leading-relaxed mb-1">
                {v.address}, {v.city}<br />{v.price} 🏠
              </p>
              <p className="text-[7px] text-white/40 flex items-center gap-1">
                <span>♪</span> {v.music}
              </p>
            </div>

            {/* Play button on hover */}
            <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-14 h-14 bg-[#F0B429] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(240,180,41,0.6)]">
                <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            {/* Gold top border accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#F0B429]/60 to-transparent" />
          </div>
        </div>

        {/* Stats + template badge */}
        <div className="flex flex-col items-center gap-1.5">
          {!v.trending && (
            <div className="flex items-center gap-1 text-[#4A4744]">
              <span className="text-[9px] font-mono">{v.views} views</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-[#1A1714] border border-[#2E2B27] rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F0B429]" />
            <span className="text-[10px] font-semibold text-[#8A8682]">{v.template}</span>
          </div>
        </div>

      </div>
    </FadeIn>
  );
}

export function VideoShowcase() {
  return (
    <section className="py-24 px-4 bg-[#0D0B08] border-t border-[#1E1C18] overflow-hidden">
      <div className="max-w-5xl mx-auto">

        <FadeIn>
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[11px] font-mono text-[#4A4744] uppercase tracking-[0.3em]">The Output — Live Examples</span>
          </div>
          <h2
            className="font-syne font-extrabold text-center text-[#FAFAF8] mb-5"
            style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 1.0 }}
          >
            This is what 60 seconds gets you.<br />
            <span className="text-[#F0B429]">On their phones. Right now.</span>
          </h2>
          <p className="text-center text-[#8A8682] text-base max-w-xl mx-auto mb-4">
            Cinematic listing videos, automatically. Upload your photos and pick a template — we handle everything else.
          </p>
          <div className="flex items-center justify-center gap-2 mb-16">
            <div className="flex items-center gap-2 bg-[#1A1714] border border-[#2E2B27] rounded-full px-4 py-2">
              <span className="text-[11px] font-mono text-[#6B6760]">18,400+ videos created</span>
              <span className="text-[#2E2B27]">·</span>
              <span className="text-[11px] font-mono text-[#6B6760]">91k+ total views last week</span>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
          {videos.map((v, i) => (
            <PhoneMockup key={v.handle} v={v} delay={i * 100} />
          ))}
        </div>

        {/* Bottom callout — product facts only */}
        <FadeIn delay={300}>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '📱', title: 'Vertical 9:16',    desc: 'Perfect for TikTok & Reels' },
              { icon: '⬛', title: 'Square 1:1',        desc: 'Feed posts & Instagram' },
              { icon: '🖥️', title: 'Horizontal 16:9', desc: 'YouTube & Facebook' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-[#141210] border border-[#2E2B27] rounded-[10px] p-5 flex items-center gap-4">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-syne font-bold text-[#FAFAF8] text-sm">{title}</p>
                  <p className="text-[11px] text-[#4A4744] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
