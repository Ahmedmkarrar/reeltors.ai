'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// ── Stage definitions ─────────────────────────────────────────────────────────

interface Stage {
  label:    string;
  sublabel: string;
}

const STAGES: Stage[] = [
  {
    label:    'Analyzing Property Data',
    sublabel: 'Reading listing details & images',
  },
  {
    label:    'Generating Cinematic AI Video',
    sublabel: 'AI is composing your cinematic scenes (~40s)',
  },
  {
    label:    'Applying Branding & Overlays',
    sublabel: 'Adding price, address & agent details',
  },
  {
    label:    'Finalizing 1080p Export',
    sublabel: 'Encoding, compressing & preparing download',
  },
];

// Shotstack's API sub-statuses → which stage they map to.
// These fast-forward the stepper beyond what time alone can infer.
const SHOTSTACK_STAGE_MAP: Record<string, number> = {
  queued:    1,
  fetching:  1,
  rendering: 2,
  saving:    3,
};

// Time windows: stage advances at these elapsed-second marks when
// Shotstack sub-status isn't available (tunnel flow, network lag, etc.)
const STAGE_END_TIMES = [8, 45, 65, 75] as const;
const TOTAL_EXPECTED_SECONDS = 75;

const MAX_CONSECUTIVE_ERRORS = 6;
const MAX_POLL_DURATION_MS   = 10 * 60 * 1000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function stageFromTime(seconds: number): number {
  if (seconds < STAGE_END_TIMES[0]) return 0;
  if (seconds < STAGE_END_TIMES[1]) return 1;
  if (seconds < STAGE_END_TIMES[2]) return 2;
  return 3;
}

function timeRemainingText(elapsed: number): string {
  if (elapsed > 72) return 'Any moment now...';
  const remaining = Math.ceil(Math.max(0, TOTAL_EXPECTED_SECONDS - elapsed));
  return `~${remaining}s remaining`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface StepGeneratingProps {
  pollUrl:    string;
  /** Epoch ms when generation was kicked off. If provided (e.g. after a page
   *  refresh), the elapsed time and active stage are initialised accurately
   *  rather than starting from zero. */
  startedAt?: number;
  onComplete: (videoUrl: string, thumbnailUrl: string | null) => void;
  onFailed:   (reason?: string) => void;
}

export default function StepGenerating({
  pollUrl,
  startedAt,
  onComplete,
  onFailed,
}: StepGeneratingProps) {
  // Use the provided startedAt (resume after refresh) or start counting now
  const originMs = useRef<number>(startedAt && startedAt > 0 ? startedAt : Date.now());

  const [elapsed, setElapsed]         = useState(() => (Date.now() - originMs.current) / 1000);
  const [activeStage, setActiveStage] = useState(() => stageFromTime((Date.now() - originMs.current) / 1000));
  const [isDone, setIsDone]           = useState(false);

  const consecutiveErrors = useRef(0);
  const tickRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef           = useRef<ReturnType<typeof setInterval> | null>(null);

  // Advance the stepper — never regress (Math.max guards against that)
  const advanceByRenderStage = useCallback((renderStage: string) => {
    const stage = SHOTSTACK_STAGE_MAP[renderStage] ?? 0;
    setActiveStage((cur) => Math.max(cur, stage));
  }, []);

  useEffect(() => {
    // Tick every 500ms to update elapsed time and advance stage by time
    tickRef.current = setInterval(() => {
      const secs = (Date.now() - originMs.current) / 1000;
      setElapsed(secs);
      setActiveStage((cur) => Math.max(cur, stageFromTime(secs)));
    }, 500);

    // Poll status endpoint every 4s
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(pollUrl);
        if (!res.ok) {
          consecutiveErrors.current += 1;
          console.error(`[StepGenerating] poll ${res.status} (${consecutiveErrors.current}/${MAX_CONSECUTIVE_ERRORS})`);
          if (consecutiveErrors.current >= MAX_CONSECUTIVE_ERRORS) {
            onFailed('Could not reach the server after several attempts. Check your connection and try again.');
          }
          return;
        }

        consecutiveErrors.current = 0;
        const data = await res.json() as Record<string, string | null>;

        // authenticated endpoint uses snake_case; tunnel endpoint uses camelCase
        const status      = data.status;
        const videoUrl    = data.output_url ?? data.outputUrl ?? null;
        const thumbUrl    = data.thumbnail_url ?? data.thumbnailUrl ?? null;
        const renderStage = data.renderStage ?? null;

        if (renderStage) advanceByRenderStage(renderStage);

        if ((status === 'complete' || status === 'succeeded') && videoUrl) {
          setActiveStage(STAGES.length - 1);
          setIsDone(true);
          if (tickRef.current) clearInterval(tickRef.current);
          if (pollRef.current) clearInterval(pollRef.current);
          setTimeout(() => onComplete(videoUrl, thumbUrl), 800);
        } else if (status === 'failed') {
          console.error('[StepGenerating] video status returned failed, pollUrl:', pollUrl);
          onFailed('The video render failed on our end. Please try again — this is usually a one-off issue.');
        }
      } catch (err) {
        consecutiveErrors.current += 1;
        console.error('[StepGenerating] poll threw:', err, `(${consecutiveErrors.current}/${MAX_CONSECUTIVE_ERRORS})`);
        if (consecutiveErrors.current >= MAX_CONSECUTIVE_ERRORS) {
          onFailed('Could not reach the server after several attempts. Check your connection and try again.');
        }
      }
    }, 4_000);

    const hardTimeout = setTimeout(
      () => onFailed('Generation is taking longer than expected. Please try again.'),
      MAX_POLL_DURATION_MS,
    );

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(hardTimeout);
    };
  }, [pollUrl, onComplete, onFailed, advanceByRenderStage]);

  const overallProgress = isDone
    ? 100
    : Math.min(95, (elapsed / TOTAL_EXPECTED_SECONDS) * 95);

  return (
    <div
      style={{
        minHeight:     '100vh',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        justifyContent:'center',
        padding:       '24px 20px',
        textAlign:     'center',
      }}
    >
      {/* Header */}
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#F0F0EB', margin: '0 0 8px' }}>
        Creating Your Listing Video
      </h2>
      <p style={{ color: '#6B6760', fontSize: 14, margin: '0 0 48px' }}>
        {startedAt && startedAt > 0 && elapsed > 5
          ? 'Resuming — your video is still being processed'
          : 'Typically ready in about 75 seconds'}
      </p>

      {/* ── Stage Stepper ── */}
      <div
        style={{
          display:    'flex',
          alignItems: 'flex-start',
          width:      '100%',
          maxWidth:   480,
          marginBottom: 36,
        }}
      >
        {STAGES.map((stage, idx) => {
          const isStepDone    = isDone || idx < activeStage;
          const isStepActive  = !isDone && idx === activeStage;
          const isStepPending = !isDone && idx > activeStage;

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
              <div
                style={{
                  display:       'flex',
                  flexDirection: 'column',
                  alignItems:    'center',
                  flex:          '0 0 auto',
                }}
              >
                {/* Step circle */}
                <div
                  style={{
                    width:        32,
                    height:       32,
                    borderRadius: '50%',
                    background:   isStepDone ? '#C9A96E' : 'transparent',
                    border:       isStepDone   ? 'none'
                                : isStepActive ? '2px solid #C9A96E'
                                : '2px solid #2E2B27',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent:'center',
                    flexShrink:   0,
                    boxShadow:    isStepActive ? '0 0 14px rgba(201,169,110,0.35)' : 'none',
                    transition:   'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
                  }}
                >
                  {isStepDone && (
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path
                        d="M1 5L5 9L12 1"
                        stroke="#0D0B08"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {isStepActive && (
                    <div
                      style={{
                        width:        10,
                        height:       10,
                        borderRadius: '50%',
                        background:   '#C9A96E',
                        animation:    'pulseDot 1.4s ease-in-out infinite',
                      }}
                    />
                  )}
                  {isStepPending && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2E2B27' }} />
                  )}
                </div>

                {/* Step label */}
                <span
                  style={{
                    fontSize:   9,
                    fontWeight: isStepDone || isStepActive ? 600 : 400,
                    color:      isStepDone   ? '#C9A96E'
                              : isStepActive ? '#F0F0EB'
                              : '#3A3730',
                    marginTop:  6,
                    lineHeight: 1.3,
                    maxWidth:   60,
                    textAlign:  'center',
                    letterSpacing: '0.3px',
                    transition: 'color 0.4s ease',
                  }}
                >
                  {/* Abbreviate to fit under the small circles */}
                  {idx === 0 && 'Analysis'}
                  {idx === 1 && 'AI Video'}
                  {idx === 2 && 'Branding'}
                  {idx === 3 && 'Export'}
                </span>
              </div>

              {/* Connector line */}
              {idx < STAGES.length - 1 && (
                <div
                  style={{
                    flex:       1,
                    height:     2,
                    marginTop:  15,
                    background: idx < activeStage || isDone ? '#C9A96E' : '#1A1714',
                    transition: 'background 0.6s ease',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Active stage detail card ── */}
      <div
        style={{
          width:        '100%',
          maxWidth:     480,
          background:   '#141210',
          border:       '1px solid #1E1C18',
          borderLeft:   '3px solid #C9A96E',
          borderRadius: 10,
          padding:      '18px 24px',
          marginBottom: 28,
          textAlign:    'left',
          transition:   'opacity 0.3s ease',
        }}
      >
        <p style={{ color: '#F0F0EB', fontSize: 15, fontWeight: 700, margin: '0 0 5px' }}>
          {isDone ? 'Complete!' : STAGES[activeStage].label}
        </p>
        <p style={{ color: '#6B6760', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          {isDone
            ? 'Your listing video is ready to download.'
            : STAGES[activeStage].sublabel}
        </p>
      </div>

      {/* ── Overall progress bar ── */}
      <div style={{ width: '100%', maxWidth: 480, marginBottom: 10 }}>
        <div
          style={{
            height:       6,
            background:   '#1A1714',
            borderRadius: 3,
            overflow:     'hidden',
          }}
        >
          <div
            style={{
              height:     '100%',
              background: '#C9A96E',
              width:      `${overallProgress}%`,
              borderRadius: 3,
              transition: isDone ? 'width 0.3s ease' : 'width 0.8s linear',
            }}
          />
        </div>
      </div>

      <p style={{ color: '#3A3730', fontSize: 12, margin: '0 0 36px' }}>
        {isDone
          ? '100% complete'
          : `${Math.round(overallProgress)}% complete · ${timeRemainingText(elapsed)}`}
      </p>

      {/* Pulse dots — hidden once complete */}
      {!isDone && (
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width:        6,
                height:       6,
                borderRadius: '50%',
                background:   '#C9A96E',
                opacity:      0.6,
                animation:    `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(0.85); opacity: 0.7; }
          50%       { transform: scale(1.2);  opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
