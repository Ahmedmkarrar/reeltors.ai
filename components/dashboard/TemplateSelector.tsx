'use client';

import { TEMPLATES } from '@/lib/creatomate/client';
import type { PlanKey } from '@/types';

interface TemplateSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
  plan: PlanKey;
}

const TEMPLATE_META = [
  {
    gradient: 'linear-gradient(135deg, #0d1117 0%, #1a1a2e 60%, #0a0a1a 100%)',
    accent:   '#6366f1',
    emoji:    '🎬',
    tag:      '30s',
    formats:  ['9:16', '16:9'],
  },
  {
    gradient: 'linear-gradient(135deg, #0a0f0a 0%, #0d1f0d 60%, #0a0a0a 100%)',
    accent:   '#22c55e',
    emoji:    '⚡',
    tag:      '15s',
    formats:  ['9:16', '1:1'],
  },
  {
    gradient: 'linear-gradient(135deg, #1a0d00 0%, #2e1500 60%, #0d0800 100%)',
    accent:   '#f59e0b',
    emoji:    '✨',
    tag:      '45s',
    formats:  ['16:9', '9:16'],
  },
];

export function TemplateSelector({ selected, onSelect, plan }: TemplateSelectorProps) {
  function canUse(i: number) {
    if (plan === 'free') return i === 0;
    if (plan === 'starter') return i <= 2;
    return true;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {TEMPLATES.map((template, i) => {
        const unlocked   = canUse(i);
        const isSelected = selected === template.id;
        const meta       = TEMPLATE_META[i];

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => unlocked && onSelect(template.id)}
            className={[
              'relative text-left rounded-[10px] border overflow-hidden transition-all duration-200 group',
              isSelected
                ? 'border-[#C8FF00] shadow-[0_0_30px_rgba(200,255,0,0.12)]'
                : unlocked
                ? 'border-[#1a1a1a] hover:border-[#282828] cursor-pointer'
                : 'border-[#111111] cursor-not-allowed',
            ].join(' ')}
            style={{
              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {/* Thumbnail */}
            <div
              className="relative w-full aspect-video flex items-center justify-center overflow-hidden"
              style={{ background: meta.gradient }}
            >
              {/* Accent glow */}
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: `radial-gradient(ellipse at center, ${meta.accent} 0%, transparent 70%)` }}
              />

              {/* Fake video content */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="text-3xl">{meta.emoji}</div>
                {isSelected && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#080808] text-sm font-bold shadow-lg"
                    style={{ background: '#C8FF00', boxShadow: '0 0 16px rgba(200,255,0,0.5)' }}
                  >
                    ✓
                  </div>
                )}
              </div>

              {/* Duration badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-[#888888] font-mono">
                {meta.tag}
              </div>

              {/* Format badges */}
              <div className="absolute bottom-2 right-2 flex gap-1">
                {meta.formats.map((f) => (
                  <span key={f} className="px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-[#555555] font-mono">
                    {f}
                  </span>
                ))}
              </div>

              {/* Selected border glow */}
              {isSelected && (
                <div className="absolute inset-0 border border-[#C8FF00]/30 rounded-t-[9px]" />
              )}
            </div>

            {/* Card body */}
            <div className="p-3.5 bg-[#111111]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-semibold text-[13px] text-[#E0E0DB]">{template.name}</h3>
                {isSelected && (
                  <span className="text-[10px] font-bold text-[#C8FF00]">Selected</span>
                )}
              </div>
              <p className="text-[11px] text-[#555555] leading-relaxed mb-2.5">{template.description}</p>
              <div
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px]"
                style={{
                  background: `${meta.accent}12`,
                  border: `1px solid ${meta.accent}20`,
                  color: meta.accent,
                }}
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                {template.bestFor}
              </div>
            </div>

            {/* Locked overlay */}
            {!unlocked && (
              <div className="absolute inset-0 bg-[#080808]/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 rounded-[10px]">
                <div className="w-10 h-10 bg-[#1a1a1a] border border-[#222222] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#444444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <span className="text-[11px] text-[#555555]">Upgrade to unlock</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
