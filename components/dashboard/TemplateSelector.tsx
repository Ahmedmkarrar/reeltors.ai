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
              'relative text-left rounded-[14px] border-2 overflow-hidden transition-all duration-200 bg-white group',
              isSelected
                ? 'border-[#1A1714] shadow-[0_4px_24px_rgba(26,23,20,0.12)]'
                : unlocked
                ? 'border-[#EBEBEB] hover:border-[#1A1714]/30 hover:shadow-[0_4px_16px_rgba(26,23,20,0.08)] cursor-pointer'
                : 'border-[#EBEBEB] cursor-not-allowed opacity-60',
            ].join(' ')}
            style={{ transform: isSelected ? 'scale(1.02)' : 'scale(1)' }}
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
                <div className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-full bg-[#1A1714] flex items-center justify-center z-10 shadow-lg">
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
                  <span className="shrink-0 text-[10px] font-bold text-white bg-[#1A1714] px-2 py-0.5 rounded-full mt-0.5">
                    Selected
                  </span>
                )}
              </div>

              <p className="text-[12px] text-[#8A8682] leading-relaxed mb-3">
                {template.description}
              </p>

              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span className="text-[11px] font-medium text-[#0D9488]">
                  {template.bestFor}
                </span>
              </div>
            </div>

            {/* Locked overlay */}
            {!unlocked && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 rounded-[12px]">
                <div className="w-10 h-10 bg-[#F5F5F3] border border-[#EBEBEB] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#ADADAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <span className="text-[12px] font-medium text-[#ADADAD]">Upgrade to unlock</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
