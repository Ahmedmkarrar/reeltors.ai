import { ConcentricRings } from './ConcentricRings';

interface Milestone {
  label: string;
  pct: number;
}

const MILESTONES_STANDARD: Milestone[] = [
  { label: 'Uploading photos',    pct: 10 },
  { label: 'Applying effects',    pct: 30 },
  { label: 'Syncing music',       pct: 55 },
  { label: 'Rendering video',     pct: 80 },
  { label: 'Finishing up',        pct: 96 },
];

const MILESTONES_AI: Milestone[] = [
  { label: 'Uploading photos',         pct: 10 },
  { label: 'Generating AI animated videos', pct: 35 },
  { label: 'Compositing footage',       pct: 65 },
  { label: 'Rendering final video',     pct: 85 },
  { label: 'Finishing up',              pct: 96 },
];

interface StepGeneratingProps {
  progress: number;
  countdown: number;
  aiVideoIndices: number[];
}

export function StepGenerating({ progress, countdown, aiVideoIndices }: StepGeneratingProps) {
  const hasAiShots = aiVideoIndices.length > 0;
  const milestones = hasAiShots ? MILESTONES_AI : MILESTONES_STANDARD;
  const activeMilestoneIndex = milestones.reduce((acc, m, i) => progress >= m.pct ? i : acc, 0);

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const timeLabel = countdown > 0
    ? mins > 0 ? `~${mins}m ${secs}s remaining` : `~${secs}s remaining`
    : 'Almost done…';

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-[#F5F2EC]">
      <div className="relative w-full max-w-2xl px-10 py-12 text-center">
        <ConcentricRings sizes={[220, 320, 420, 520]} />

        <div className="relative mb-8">
          <span
            className="text-8xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #1A1714 0%, #B8860B 45%, #F5C842 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>

        <div className="relative h-7 bg-[#E4DFD4] rounded-full overflow-hidden mb-8 mx-2">
          <div
            className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #96680A 0%, #C9930A 25%, #F0B429 55%, #FFD966 75%, #DAA520 100%)',
              boxShadow: '0 2px 16px rgba(197,152,40,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <div
              className="absolute inset-0 w-1/3 animate-gold-shimmer"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
            />
          </div>
        </div>

        <p className="text-sm font-semibold text-[#1A1714] mb-4 transition-all duration-500">
          {milestones[activeMilestoneIndex].label}
        </p>

        <p className="text-sm text-[#8C8680]">{timeLabel}</p>

        {hasAiShots && (
          <div className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-[#7C3AED] bg-[#7C3AED]/8 border border-[#7C3AED]/20 rounded-[6px] px-3 py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
              <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
            </svg>
            Generating {aiVideoIndices.length} AI animated video{aiVideoIndices.length !== 1 ? 's' : ''} — up to 3 min
          </div>
        )}
      </div>
    </div>
  );
}
