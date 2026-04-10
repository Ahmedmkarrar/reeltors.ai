'use client';

import { useEffect, useRef, useState } from 'react';

interface StepResultProps {
  videoUrl: string;
  email: string;
}

const APP_BASE = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');

export default function StepResult({ videoUrl, email }: StepResultProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isUpsellVisible, setIsUpsellVisible] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  // Show upsell after 5 seconds of video playing
  useEffect(() => {
    const timer = setTimeout(() => setIsUpsellVisible(true), 5_000);
    videoRef.current?.play().catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    setHasDownloaded(true);
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'listing-video.mp4';
    a.click();
  };

  const signupUrl = `${APP_BASE}/signup?email=${encodeURIComponent(email)}&ref=tunnel`;
  const upgradeUrl = `${APP_BASE}/signup?email=${encodeURIComponent(email)}&ref=tunnel&upgrade=1`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Full-width video */}
      <div style={{ width: '100%', maxWidth: 480, position: 'relative', background: '#000' }}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          muted
          loop
          playsInline
          style={{ width: '100%', display: 'block', maxHeight: '70vh', objectFit: 'contain' }}
        />
      </div>

      {/* Download + account creation */}
      <div style={{ width: '100%', maxWidth: 480, padding: '32px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0EB', margin: '0 0 8px' }}>
          Your video is ready.
        </h2>
        <p style={{ color: '#6B6760', fontSize: 14, margin: '0 0 28px' }}>
          Download it now, or create an account to save it forever.
        </p>

        <button
          onClick={handleDownload}
          style={{
            width: '100%', background: '#F0B429', color: '#0D0B08',
            border: 'none', borderRadius: 8, padding: '16px 24px',
            fontSize: 17, fontWeight: 800, cursor: 'pointer', marginBottom: 12,
          }}
        >
          {hasDownloaded ? 'Download Again ↓' : 'Download Video ↓'}
        </button>

        <a
          href={signupUrl}
          style={{
            display: 'block', width: '100%', background: '#1A1714',
            color: '#F0F0EB', border: '1px solid #2E2B27',
            borderRadius: 8, padding: '15px 24px',
            fontSize: 15, fontWeight: 600, textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          Create account to save forever →
        </a>
      </div>

      {/* Upsell card — slides in after 5s */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          transform: isUpsellVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            background: '#121009', borderTop: '1px solid #2E2B27',
            padding: '24px 24px 32px', textAlign: 'center',
          }}
        >
          {/* Usage bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#6B6760', fontSize: 12 }}>Free videos used</span>
              <span style={{ color: '#F0B429', fontSize: 12, fontWeight: 700 }}>1 / 1</span>
            </div>
            <div style={{ height: 4, background: '#1A1714', borderRadius: 2 }}>
              <div style={{ height: '100%', width: '100%', background: '#F0B429', borderRadius: 2 }} />
            </div>
          </div>

          <p style={{ color: '#F0F0EB', fontWeight: 700, fontSize: 17, margin: '0 0 4px' }}>
            You&apos;ve used your 1 free video.
          </p>
          <p style={{ color: '#6B6760', fontSize: 14, margin: '0 0 20px' }}>
            Make 15 more listing videos for $49/month.
          </p>

          <a
            href={upgradeUrl}
            style={{
              display: 'block', background: '#F0B429', color: '#0D0B08',
              borderRadius: 8, padding: '16px 24px',
              fontSize: 16, fontWeight: 800, textDecoration: 'none',
              marginBottom: 10,
            }}
          >
            Get 15 Videos/Month — $49 →
          </a>
          <button
            onClick={() => setIsUpsellVisible(false)}
            style={{
              background: 'transparent', border: 'none',
              color: '#4A4642', fontSize: 12, cursor: 'pointer', padding: '4px 8px',
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
