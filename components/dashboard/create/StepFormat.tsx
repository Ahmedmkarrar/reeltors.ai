import { Button } from '@/components/ui/Button';
import { ConcentricRings } from './ConcentricRings';
import type { VideoFormat } from '@/types';

interface FormatOption {
  value: VideoFormat;
  label: string;
  ratio: string;
  desc: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'vertical',   label: 'Vertical',   ratio: '9:16', desc: 'TikTok · Reels · Shorts' },
  { value: 'square',     label: 'Square',     ratio: '1:1',  desc: 'Instagram · Facebook' },
  { value: 'horizontal', label: 'Horizontal', ratio: '16:9', desc: 'YouTube · MLS · Desktop' },
];

interface StepFormatProps {
  format: VideoFormat;
  onFormatChange: (format: VideoFormat) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepFormat({ format, onFormatChange, onBack, onNext }: StepFormatProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#F5F2EC] overflow-hidden px-6 py-12">
      <ConcentricRings sizes={[300, 450, 600, 750]} />

      <h1 className="relative font-syne font-bold text-5xl md:text-6xl text-[#1A1714] mb-12 tracking-tight">
        Select Format
      </h1>

      <div className="relative grid grid-cols-3 gap-5 w-full max-w-3xl mb-12">
        {FORMAT_OPTIONS.map(({ value, label, ratio, desc }) => {
          const isSelected = format === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onFormatChange(value)}
              className="flex flex-col items-center gap-5 p-8 rounded-[20px] transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(8px)',
                border: isSelected ? '2px solid #C9A84C' : '2px solid rgba(201,168,76,0.2)',
                boxShadow: isSelected
                  ? '0 0 0 4px rgba(201,168,76,0.15), 0 8px 32px rgba(201,168,76,0.2)'
                  : '0 2px 12px rgba(0,0,0,0.04)',
                transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
              }}
            >
              <div className="flex items-center justify-center h-24">
                <FormatIcon value={value} />
              </div>
              <div className="text-center">
                <p className="font-syne font-semibold text-base text-[#1A1714]">
                  {label} <span className="text-[#C9A84C]">({ratio})</span>
                </p>
                <p className="text-xs text-[#8C8680] mt-1">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative flex gap-3">
        <Button variant="secondary" size="md" onClick={onBack}>← Back</Button>
        <Button variant="primary" size="md" onClick={onNext}>Next →</Button>
      </div>
    </div>
  );
}

function FormatIcon({ value }: { value: VideoFormat }) {
  if (value === 'vertical') {
    return (
      <svg width="52" height="88" viewBox="0 0 52 88" fill="none">
        <defs>
          <linearGradient id="goldV" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#96680A"/>
            <stop offset="40%" stopColor="#DAA520"/>
            <stop offset="70%" stopColor="#F5C842"/>
            <stop offset="100%" stopColor="#B8860B"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="48" height="84" rx="8" stroke="url(#goldV)" strokeWidth="3.5" fill="rgba(201,168,76,0.08)"/>
        <circle cx="26" cy="76" r="4" fill="url(#goldV)"/>
        <rect x="18" y="6" width="16" height="3" rx="1.5" fill="url(#goldV)" opacity="0.6"/>
      </svg>
    );
  }

  if (value === 'square') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="goldS" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#96680A"/>
            <stop offset="40%" stopColor="#DAA520"/>
            <stop offset="70%" stopColor="#F5C842"/>
            <stop offset="100%" stopColor="#B8860B"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="76" height="76" rx="12" stroke="url(#goldS)" strokeWidth="3.5" fill="rgba(201,168,76,0.08)"/>
        <rect x="18" y="18" width="44" height="44" rx="6" fill="url(#goldS)" opacity="0.25"/>
      </svg>
    );
  }

  return (
    <svg width="96" height="72" viewBox="0 0 96 72" fill="none">
      <defs>
        <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#96680A"/>
          <stop offset="40%" stopColor="#DAA520"/>
          <stop offset="70%" stopColor="#F5C842"/>
          <stop offset="100%" stopColor="#B8860B"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="92" height="60" rx="8" stroke="url(#goldH)" strokeWidth="3.5" fill="rgba(201,168,76,0.08)"/>
      <rect x="40" y="64" width="16" height="5" rx="2.5" fill="url(#goldH)"/>
      <rect x="30" y="69" width="36" height="2.5" rx="1.25" fill="url(#goldH)" opacity="0.5"/>
      <path d="M30 32 L42 22 L52 30 L62 18 L72 28" stroke="url(#goldH)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="38" cy="24" r="5" stroke="url(#goldH)" strokeWidth="2" fill="none"/>
    </svg>
  );
}
