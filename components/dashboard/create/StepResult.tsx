import { ConcentricRings } from './ConcentricRings';

interface StepResultProps {
  outputUrl: string;
  images: string[];
  isCopied: boolean;
  onCopy: () => void;
  onRestyle: () => void;
  onNewListing: () => void;
}

const SHARE_PLATFORMS = ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'MLS Listing'];

export function StepResult({ outputUrl, images, isCopied, onCopy, onRestyle, onNewListing }: StepResultProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#F5F2EC] overflow-hidden px-6 py-12">
      <ConcentricRings sizes={[300, 480, 660, 840]} />

      <div className="relative w-full max-w-2xl flex flex-col items-center text-center">
        <h1 className="font-syne font-bold text-5xl md:text-6xl text-[#1A1714] mb-8 tracking-tight">
          Video Ready
        </h1>

        <div
          className="w-full rounded-[20px] overflow-hidden mb-8"
          style={{
            border: '2px solid #C9A84C',
            boxShadow: '0 0 0 4px rgba(201,168,76,0.12), 0 12px 48px rgba(201,168,76,0.2)',
          }}
        >
          <video
            src={outputUrl}
            controls
            autoPlay
            playsInline
            className="w-full max-h-[55vh] object-contain bg-[#1A1714]"
            poster={images[0]}
          />
        </div>

        <div className="flex items-center gap-6 flex-wrap justify-center">
          <a
            href={outputUrl}
            download={`listing-reel-${Date.now()}.mp4`}
            className="relative overflow-hidden flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-transform duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #96680A 0%, #C9930A 25%, #F0B429 55%, #FFD966 75%, #DAA520 100%)',
              boxShadow: '0 4px 24px rgba(197,152,40,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
              color: '#1A1714',
            }}
          >
            <div
              className="absolute inset-0 w-1/3 animate-gold-shimmer"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
            />
            <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="relative z-10">Download Video</span>
          </a>

          <button type="button" onClick={onCopy} className="flex flex-col items-center gap-1.5 text-[#6B6760] hover:text-[#1A1714] transition-colors">
            {isCopied ? (
              <svg className="w-6 h-6 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            )}
            <span className="text-[11px] font-semibold tracking-widest uppercase">{isCopied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button type="button" onClick={onRestyle} className="flex flex-col items-center gap-1.5 text-[#6B6760] hover:text-[#1A1714] transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span className="text-[11px] font-semibold tracking-widest uppercase">Restyle</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-[#B8B4AE] mr-1">Share to</span>
          {SHARE_PLATFORMS.map((platform) => (
            <span
              key={platform}
              className="text-xs rounded-full px-3 py-1.5 text-[#6B6760] transition-colors"
              style={{ border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(255,255,255,0.6)' }}
            >
              {platform}
            </span>
          ))}
        </div>

        <button
          type="button"
          className="mt-6 text-sm text-[#8C8680] hover:text-[#1A1714] transition-colors underline underline-offset-4"
          onClick={onNewListing}
        >
          Start a new listing
        </button>
      </div>
    </div>
  );
}
