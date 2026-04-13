'use client';

import { useRef, useEffect, useState } from 'react';
import { TEMPLATES, TEMPLATE_PREVIEW_URLS } from '@/lib/shotstack/templates';
import type { TemplateStyle } from '@/lib/shotstack/templates';
import type { VideoFormat } from '@/types';

interface StepTemplatesProps {
  onGenerate: (templateKey: string, format: VideoFormat) => void;
}

const FORMAT_OPTIONS: { value: VideoFormat; label: string; ratio: string; desc: string }[] = [
  { value: 'vertical',   label: 'Vertical',   ratio: '9:16', desc: 'TikTok · Reels · Shorts' },
  { value: 'square',     label: 'Square',     ratio: '1:1',  desc: 'Instagram · Facebook' },
  { value: 'horizontal', label: 'Horizontal', ratio: '16:9', desc: 'YouTube · Desktop' },
];

export default function StepTemplates({ onGenerate }: StepTemplatesProps) {
  const [selectedKey, setSelectedKey] = useState<string>(TEMPLATES[0].id);
  const [format, setFormat] = useState<VideoFormat>('vertical');
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) video.play().catch(() => {});
    });
  }, []);

  function handleMouseEnter(i: number) {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === i) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  function handleMouseLeave() {
    videoRefs.current.forEach((video) => {
      if (video) video.play().catch(() => {});
    });
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#F0F0EB', margin: '0 0 12px' }}>
          Pick your style
        </h2>
        <p style={{ color: '#6B6760', fontSize: 15, margin: 0 }}>
          Each template is a complete cinematic listing video. Choose the vibe.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}
      >
        {TEMPLATES.map((template, i) => {
          const isSelected = selectedKey === template.id;
          const previewUrl = TEMPLATE_PREVIEW_URLS[template.id as TemplateStyle];

          return (
            <button
              key={template.id}
              onClick={() => setSelectedKey(template.id)}
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
              style={{
                background: '#0D0B08',
                border: `2px solid ${isSelected ? '#F0B429' : '#2E2B27'}`,
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0,
                transition: 'border-color 0.2s, transform 0.2s',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#1A1714' }}>
                {previewUrl ? (
                  <video
                    ref={(el) => { videoRefs.current[i] = el; }}
                    src={previewUrl}
                    preload="auto"
                    muted
                    loop
                    playsInline
                    autoPlay
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : null}
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(13,11,8,0.85) 0%, rgba(13,11,8,0.15) 60%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      background: '#F0B429', color: '#0D0B08',
                      borderRadius: '50%', width: 24, height: 24,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14,
                      zIndex: 1,
                    }}
                  >
                    ✓
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute', bottom: 10, left: 14,
                    color: '#F0F0EB', fontWeight: 800, fontSize: 18,
                    zIndex: 1,
                  }}
                >
                  {template.name}
                </span>
              </div>
              <div style={{ padding: '14px 16px 16px' }}>
                <p style={{ color: '#8A8682', fontSize: 13, margin: '0 0 8px', lineHeight: 1.5 }}>
                  {template.description}
                </p>
                <span
                  style={{
                    background: '#1A1714', color: '#F0B429',
                    fontSize: 11, fontWeight: 700, padding: '3px 8px',
                    borderRadius: 4, letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}
                >
                  Best for: {template.bestFor}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Format selector */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ color: '#8A8682', fontSize: 13, fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Video format
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {FORMAT_OPTIONS.map(({ value, label, ratio, desc }) => {
            const isSelected = format === value;
            return (
              <button
                key={value}
                onClick={() => setFormat(value)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  padding: '16px 12px',
                  background: isSelected ? '#1A1714' : '#0D0B08',
                  border: `2px solid ${isSelected ? '#F0B429' : '#2E2B27'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44 }}>
                  {value === 'vertical' && (
                    <div style={{ width: 18, height: 32, borderRadius: 3, border: `2px solid ${isSelected ? '#F0B429' : '#4A4642'}`, background: isSelected ? 'rgba(240,180,41,0.1)' : 'transparent', transition: 'border-color 0.2s' }} />
                  )}
                  {value === 'square' && (
                    <div style={{ width: 28, height: 28, borderRadius: 3, border: `2px solid ${isSelected ? '#F0B429' : '#4A4642'}`, background: isSelected ? 'rgba(240,180,41,0.1)' : 'transparent', transition: 'border-color 0.2s' }} />
                  )}
                  {value === 'horizontal' && (
                    <div style={{ width: 40, height: 24, borderRadius: 3, border: `2px solid ${isSelected ? '#F0B429' : '#4A4642'}`, background: isSelected ? 'rgba(240,180,41,0.1)' : 'transparent', transition: 'border-color 0.2s' }} />
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: isSelected ? '#F0F0EB' : '#6B6760', fontWeight: 700, fontSize: 13, margin: '0 0 2px', transition: 'color 0.2s' }}>{label}</p>
                  <p style={{ color: isSelected ? '#F0B429' : '#4A4642', fontSize: 11, fontFamily: 'monospace', margin: '0 0 4px', transition: 'color 0.2s' }}>{ratio}</p>
                  <p style={{ color: '#4A4642', fontSize: 10, margin: 0, lineHeight: 1.4 }}>{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => onGenerate(selectedKey, format)}
          style={{
            background: '#F0B429', color: '#0D0B08',
            border: 'none', borderRadius: 8,
            padding: '18px 48px', fontSize: 18, fontWeight: 800,
            cursor: 'pointer', width: '100%', maxWidth: 380,
          }}
        >
          Generate My Free Video →
        </button>
        <p style={{ color: '#4A4642', fontSize: 12, marginTop: 12 }}>
          Free with Google sign-in · No credit card · 30–90 seconds
        </p>
      </div>
    </div>
  );
}
