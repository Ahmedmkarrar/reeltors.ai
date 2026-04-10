'use client';

import { useEffect, useState, useRef } from 'react';

const LOADING_MESSAGES = [
  'Placing your listing photos into the template...',
  'Adding cinematic motion between scenes...',
  'Applying color grading and transitions...',
  'Rendering your video at full quality...',
  'Mixing the background audio track...',
  'Finalizing your listing video...',
  'Almost there — adding the finishing touches...',
];

const MAX_CONSECUTIVE_ERRORS = 6;

interface StepGeneratingProps {
  pollUrl: string;
  onComplete: (videoUrl: string, thumbnailUrl: string | null) => void;
  onFailed: () => void;
}

export default function StepGenerating({ pollUrl, onComplete, onFailed }: StepGeneratingProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const consecutiveErrorsRef = useRef(0);

  useEffect(() => {
    const startTime = Date.now();
    const FAKE_DURATION_MS = 80_000;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(88, (elapsed / FAKE_DURATION_MS) * 88);
      setProgress(rawProgress);

      const msgIdx = Math.floor((elapsed / FAKE_DURATION_MS) * LOADING_MESSAGES.length);
      setMessageIndex(Math.min(msgIdx, LOADING_MESSAGES.length - 1));
    }, 500);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(pollUrl);
        if (!res.ok) {
          consecutiveErrorsRef.current += 1;
          if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
            onFailed();
          }
          return;
        }

        consecutiveErrorsRef.current = 0;
        const data = await res.json() as Record<string, string | null>;
        const isComplete = data.status === 'complete' || data.status === 'succeeded';
        const isFailed = data.status === 'failed';
        // authenticated endpoint returns output_url; tunnel endpoint returns outputUrl
        const videoUrl = data.output_url ?? data.outputUrl;

        if (isComplete && videoUrl) {
          setProgress(100);
          setTimeout(() => onComplete(videoUrl, data.thumbnailUrl ?? data.thumbnail_url ?? null), 600);
        } else if (isFailed) {
          onFailed();
        }
      } catch {
        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
          onFailed();
        }
      }
    }, 4_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollUrl, onComplete, onFailed]);

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#F0F0EB', margin: '0 0 12px' }}>
        Your listing is becoming a cinematic video...
      </h2>
      <p style={{ color: '#6B6760', fontSize: 15, margin: '0 0 48px' }}>
        {LOADING_MESSAGES[messageIndex]}
      </p>

      <div style={{ width: '100%', maxWidth: 480, marginBottom: 16 }}>
        <div style={{ height: 6, background: '#1A1714', borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%', background: '#F0B429',
              width: `${progress}%`, borderRadius: 3,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      <p style={{ color: '#3A3730', fontSize: 12 }}>
        {Math.round(progress)}% complete · typically 30–90 seconds
      </p>

      <div style={{ display: 'flex', gap: 6, marginTop: 40 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#F0B429',
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
