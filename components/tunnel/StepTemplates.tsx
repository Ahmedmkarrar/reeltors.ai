'use client';

import { useState } from 'react';

interface TunnelTemplate {
  key: string;
  label: string;
  tagline: string;
  bestFor: string;
  previewImageUrl: string;
}

const TUNNEL_TEMPLATES: TunnelTemplate[] = [
  {
    key: 'LUXURY_REVEAL',
    label: 'Luxury',
    tagline: 'Logo intro · Dramatic reveal · Cinematic close',
    bestFor: 'High-end homes',
    previewImageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=400',
  },
  {
    key: 'MODERN_MINIMAL',
    label: 'Modern',
    tagline: 'Clean slides · Bold typography · Sharp cuts',
    bestFor: 'Contemporary listings',
    previewImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400',
  },
  {
    key: 'CINEMATIC',
    label: 'Warm',
    tagline: 'Ken Burns zoom · Soft motion · Inviting feel',
    bestFor: 'Family homes',
    previewImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400',
  },
  {
    key: 'TIKTOK_FAST',
    label: 'Minimal',
    tagline: 'Viral hook · Fast cuts · Social-first format',
    bestFor: 'TikTok & Reels',
    previewImageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=400',
  },
];

interface StepTemplatesProps {
  onGenerate: (templateKey: string) => void;
}

export default function StepTemplates({ onGenerate }: StepTemplatesProps) {
  const [selectedKey, setSelectedKey] = useState<string>(TUNNEL_TEMPLATES[0].key);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}
      >
        {TUNNEL_TEMPLATES.map((template) => {
          const isSelected = selectedKey === template.key;
          return (
            <button
              key={template.key}
              onClick={() => setSelectedKey(template.key)}
              style={{
                background: '#0D0B08',
                border: `2px solid ${isSelected ? '#F0B429' : '#2E2B27'}`,
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0,
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.previewImageUrl}
                  alt={template.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(13,11,8,0.9) 0%, rgba(13,11,8,0.2) 60%, transparent 100%)',
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
                    }}
                  >
                    ✓
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute', bottom: 10, left: 14,
                    color: '#F0F0EB', fontWeight: 800, fontSize: 20,
                  }}
                >
                  {template.label}
                </span>
              </div>
              <div style={{ padding: '14px 16px 16px' }}>
                <p style={{ color: '#8A8682', fontSize: 13, margin: '0 0 8px', lineHeight: 1.5 }}>
                  {template.tagline}
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

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => onGenerate(selectedKey)}
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
          No account required · Takes 30–90 seconds
        </p>
      </div>
    </div>
  );
}
