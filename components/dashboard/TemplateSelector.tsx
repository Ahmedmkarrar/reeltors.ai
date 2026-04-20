'use client';

import { useRef, useEffect } from 'react';
import { TEMPLATES, TEMPLATE_PREVIEW_URLS } from '@/lib/shotstack/templates';
import type { TemplateStyle } from '@/lib/shotstack/templates';
import type { PlanKey } from '@/types';

interface TemplateSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
  plan: PlanKey;
}


export function TemplateSelector({ selected, onSelect, plan }: TemplateSelectorProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  function canUse(i: number) {
    if (plan === 'free') return i === 0;
    if (plan === 'starter') return i <= 2;
    return true;
  }

  // autoplay all visible muted videos — works on mobile and desktop
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) video.play().catch(() => {});
    });
  }, []);

  // on desktop: pause non-hovered videos for cleaner feel
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {TEMPLATES.map((template, i) => {
        const unlocked   = canUse(i);
        const isSelected = selected === template.id;
        const previewUrl = TEMPLATE_PREVIEW_URLS[template.id as TemplateStyle];

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => unlocked && onSelect(template.id)}
            onMouseEnter={() => unlocked && handleMouseEnter(i)}
            onMouseLeave={handleMouseLeave}
            className={[
              'relative text-left rounded-[20px] overflow-hidden transition-all duration-300 group',
              !unlocked && 'cursor-not-allowed opacity-50',
              unlocked && !isSelected && 'cursor-pointer',
            ].filter(Boolean).join(' ')}
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(8px)',
              border: isSelected ? '2px solid #C9A84C' : '2px solid rgba(201,168,76,0.18)',
              boxShadow: isSelected
                ? '0 0 0 4px rgba(201,168,76,0.15), 0 8px 32px rgba(201,168,76,0.2)'
                : '0 2px 12px rgba(0,0,0,0.04)',
              transform: isSelected ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
            }}
          >
            {/* Video thumbnail */}
            <div className="relative w-full aspect-video bg-[#1A1714] overflow-hidden">
              {previewUrl && (
                <video
                  ref={(el) => { videoRefs.current[i] = el; }}
                  src={previewUrl}
                  preload="auto"
                  muted
                  loop
                  playsInline
                  autoPlay
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Gradient overlay for legibility of badges */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center z-10 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #F5C842, #C9930A)' }}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              )}
            </div>

            {/* Card body */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className={[
                  'font-syne font-bold text-[15px] leading-tight',
                  isSelected ? 'text-[#1A1714]' : 'text-[#1A1714]',
                ].join(' ')}>{template.name}</h3>
                {isSelected && (
                  <span className="shrink-0 text-[10px] font-bold text-white px-2 py-0.5 rounded-full mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #F5C842, #C9930A)' }}>
                    Selected
                  </span>
                )}
              </div>

              <p className="text-[12px] text-[#8A8682] leading-relaxed mb-3">
                {template.description}
              </p>

              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                <span className="text-[11px] font-medium text-[#C9A84C]">
                  {template.bestFor}
                </span>
              </div>
            </div>

            {/* Locked overlay */}
            {!unlocked && (
              <div className="absolute inset-0 bg-[#F5F2EC]/85 backdrop-blur-[3px] flex flex-col items-center justify-center gap-2 rounded-[20px]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #F5C842, #C9930A)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <span className="text-[12px] font-semibold text-[#8C8680]">Upgrade to unlock</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
