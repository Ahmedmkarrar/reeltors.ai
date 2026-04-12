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

  const signupUrl  = `${APP_BASE}/signup?email=${encodeURIComponent(email)}&ref=tunnel`;
  const upgradeUrl = `${APP_BASE}/signup?email=${encodeURIComponent(email)}&ref=tunnel&upgrade=1`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0D0B08' }}>

      {/* Video player */}
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

      {/* Result actions */}
      <div style={{ width: '100%', maxWidth: 480, padding: '36px 24px 160px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0EB', margin: '0 0 6px' }}>
          Your listing video is ready 🎬
        </h2>
        <p style={{ color: '#6B6760', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 }}>
          Tap and hold on mobile to save · or download below
        </p>

        <button
          onClick={handleDownload}
          style={{
            width: '100%', background: '#F0B429', color: '#0D0B08',
            border: 'none', borderRadius: 10, padding: '16px 24px',
            fontSize: 17, fontWeight: 800, cursor: 'pointer', marginBottom: 12,
            boxShadow: '0 0 32px rgba(240,180,41,0.35)',
          }}
        >
          {hasDownloaded ? 'Download Again ↓' : 'Download Video ↓'}
        </button>

        <a
          href={signupUrl}
          style={{
            display: 'block', width: '100%', background: 'transparent',
            color: '#8A8682', border: '1px solid #2E2B27',
            borderRadius: 10, padding: '14px 24px',
            fontSize: 14, fontWeight: 500, textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          Save to account →
        </a>
      </div>

      {/* Upsell slide-up */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          transform: isUpsellVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            background: '#0F0D0A',
            borderTop: '1px solid #C9A96E40',
            padding: '28px 24px 36px',
            textAlign: 'center',
          }}
        >
          {/* Usage bar */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#6B6760', fontSize: 11, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Free videos used</span>
              <span style={{ color: '#C9A96E', fontSize: 11, fontWeight: 700 }}>1 of 1</span>
            </div>
            <div style={{ height: 3, background: '#1A1714', borderRadius: 2 }}>
              <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #C9A96E, #F0B429)', borderRadius: 2 }} />
            </div>
          </div>

          {/* Hook */}
          <p style={{ color: '#F0F0EB', fontWeight: 800, fontSize: 20, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            Your competitors are already using this.
          </p>
          <p style={{ color: '#6B6760', fontSize: 14, margin: '0 0 22px', lineHeight: 1.6 }}>
            Get 15 cinematic listing videos per month.<br />
            Close more listings. Stop paying videographers.
          </p>

          {/* CTA */}
          <a
            href={upgradeUrl}
            style={{
              display: 'block',
              background: 'linear-gradient(135deg, #C9A96E 0%, #F0B429 100%)',
              color: '#0D0B08',
              borderRadius: 10, padding: '17px 24px',
              fontSize: 16, fontWeight: 800, textDecoration: 'none',
              marginBottom: 12,
              boxShadow: '0 0 40px rgba(201,169,110,0.4)',
              letterSpacing: '-0.2px',
            }}
          >
            Get 15 Videos/Month — $49 →
          </a>

          {/* Social proof */}
          <p style={{ color: '#4A4642', fontSize: 11, margin: '0 0 12px' }}>
            ✓ No contract &nbsp;·&nbsp; ✓ Cancel anytime &nbsp;·&nbsp; ✓ Used by 247 agents today
          </p>

          <button
            onClick={() => setIsUpsellVisible(false)}
            style={{
              background: 'transparent', border: 'none',
              color: '#3A3730', fontSize: 12, cursor: 'pointer', padding: '4px 8px',
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
