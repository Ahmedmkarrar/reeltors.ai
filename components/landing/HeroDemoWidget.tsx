'use client';
import { useState, useEffect } from 'react';

const PHOTOS = [
  { bg: 'from-slate-700 to-slate-900',   label: 'Living Rm' },
  { bg: 'from-emerald-900 to-slate-900', label: 'Kitchen' },
  { bg: 'from-amber-900 to-slate-900',   label: 'Master' },
  { bg: 'from-blue-900 to-slate-900',    label: 'Exterior' },
];

const STAGE_DURATIONS = [2800, 2400, 2200, 3200]; // ms

type Stage = 0 | 1 | 2 | 3;

function Screen({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}

function UploadScreen({ active }: { active: boolean }) {
  return (
    <Screen visible={active}>
      <div className="p-4">
        <p className="text-[10px] text-[#555555] font-mono uppercase tracking-wider mb-3">Step 1 — Upload photos</p>
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {PHOTOS.map((p, i) => (
            <div
              key={p.label}
              className={`aspect-square rounded bg-gradient-to-br ${p.bg} flex items-end p-1 relative overflow-hidden`}
              style={{
                opacity: active ? 1 : 0,
                transform: active ? 'scale(1)' : 'scale(0.8)',
                transition: `opacity 0.3s ease ${i * 150}ms, transform 0.3s ease ${i * 150}ms`,
              }}
            >
              <span className="text-[7px] text-white/40">{p.label}</span>
              <div
                className="absolute top-1 right-1 w-3 h-3 bg-[#F0B429] rounded-full flex items-center justify-center"
                style={{ transitionDelay: `${i * 150 + 200}ms` }}
              >
                <span className="text-[6px] text-black font-bold">✓</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] border-dashed rounded px-3 py-2 flex items-center gap-2">
          <span className="text-[#333333] text-sm">⬆</span>
          <span className="text-[10px] text-[#444444]">4 photos ready</span>
          <span className="ml-auto text-[9px] text-[#F0B429] font-semibold">✓ Uploaded</span>
        </div>
      </div>
    </Screen>
  );
}

function DetailsScreen({ active }: { active: boolean }) {
  return (
    <Screen visible={active}>
      <div className="p-4">
        <p className="text-[10px] text-[#555555] font-mono uppercase tracking-wider mb-3">Step 2 — 3 fields. That&apos;s it.</p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Address', value: '2847 Oak Drive, Austin TX', delay: 0 },
            { label: 'Price',   value: '$485,000',                  delay: 200 },
            { label: 'Agent',   value: 'Sarah K.',                  delay: 400 },
          ].map(({ label, value, delay }) => (
            <div key={label}>
              <p className="text-[9px] text-[#444444] mb-1">{label}</p>
              <div
                className="bg-[#0d0d0d] border border-[#F0B429]/30 rounded px-2.5 py-2"
                style={{
                  opacity: active ? 1 : 0,
                  transition: `opacity 0.3s ease ${delay}ms`,
                }}
              >
                <span className="text-[11px] text-[#F0B429] font-mono">{value}</span>
                <span className="inline-block w-px h-3 bg-[#F0B429] ml-0.5 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function GeneratingScreen({ active }: { active: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) { setProgress(0); return; }
    const start = Date.now();
    const duration = 1800;
    let raf: number;
    const tick = () => {
      const p = Math.min(((Date.now() - start) / duration) * 100, 100);
      setProgress(p);
      if (p < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <Screen visible={active}>
      <div className="p-4">
        <p className="text-[10px] text-[#555555] font-mono uppercase tracking-wider mb-4">Generating your video...</p>

        {/* Template selected */}
        <div className="flex gap-1.5 mb-4">
          {['Cinematic', 'Quick Reel', 'Luxury'].map((t, i) => (
            <div
              key={t}
              className={`flex-1 rounded py-1.5 text-center border text-[8px] font-semibold ${
                i === 0 ? 'border-[#F0B429] bg-[#F0B429]/10 text-[#F0B429] shadow-[0_0_12px_rgba(240,180,41,0.15)]' : 'border-[#1a1a1a] text-[#333333]'
              }`}
            >
              {['🎬','⚡','✨'][i]} {t}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-[#111111] rounded-full h-1.5 mb-2 overflow-hidden">
          <div
            className="h-full bg-[#F0B429] rounded-full shadow-[0_0_8px_rgba(240,180,41,0.5)] transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-[#555555]">Applying cinematic effects...</span>
          <span className="text-[9px] text-[#F0B429] font-mono">{Math.round(progress)}%</span>
        </div>

        {/* Steps */}
        <div className="mt-3 flex flex-col gap-1.5">
          {[
            { label: 'Motion effects applied', done: progress > 30 },
            { label: 'Music synced',           done: progress > 60 },
            { label: 'Branding overlaid',      done: progress > 85 },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] shrink-0 transition-colors ${done ? 'bg-[#F0B429] text-black' : 'bg-[#1a1a1a] text-[#333333]'}`}>
                {done ? '✓' : '·'}
              </div>
              <span className={`text-[9px] transition-colors ${done ? 'text-[#888888]' : 'text-[#333333]'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function ReadyScreen({ active }: { active: boolean }) {
  return (
    <Screen visible={active}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-[#F0B429] flex items-center justify-center">
            <span className="text-[9px] text-black font-bold">✓</span>
          </div>
          <span className="text-[11px] font-semibold text-[#F0B429]">Video ready in 58 seconds</span>
        </div>

        {/* Phone preview inline */}
        <div className="flex gap-3 items-start mb-3">
          <div className="relative w-[60px] h-[106px] bg-[#0d0d0d] rounded-[10px] border border-[#F0B429]/30 overflow-hidden shrink-0 shadow-[0_0_20px_rgba(240,180,41,0.12)]">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-700 via-emerald-950 to-slate-900" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-[#F0B429] rounded-full flex items-center justify-center shadow-[0_0_16px_rgba(240,180,41,0.5)]">
                <svg className="w-2.5 h-2.5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80">
              <div className="h-0.5 bg-[#F0B429]/70 rounded w-3/4 mb-0.5" />
              <div className="h-0.5 bg-white/20 rounded w-1/2" />
            </div>
            <div className="absolute inset-0 rounded-[10px] border border-[#F0B429]/20 animate-border-pulse" />
          </div>

          <div className="flex flex-col gap-1.5 flex-1 justify-center">
            {[
              { icon: '⚡', value: '58s',     label: 'total time' },
              { icon: '📱', value: '3',        label: 'platforms ready' },
              { icon: '🎬', value: '9:16',     label: 'TikTok format' },
            ].map(({ icon, value, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[10px]">{icon}</span>
                <span className="text-[10px] font-bold text-[#F0B429] font-syne">{value}</span>
                <span className="text-[9px] text-[#444444]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Download row */}
        <div className="flex gap-1.5">
          {['TikTok ↗', 'Reels ↗', 'YouTube ↗'].map((p) => (
            <div key={p} className="flex-1 bg-[#111111] border border-[#1a1a1a] rounded py-1.5 text-center">
              <span className="text-[8px] text-[#888888]">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

export function HeroDemoWidget() {
  const [stage, setStage] = useState<Stage>(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const advance = (current: Stage) => {
      const next = ((current + 1) % 4) as Stage;
      timeout = setTimeout(() => {
        setStage(next);
        advance(next);
      }, STAGE_DURATIONS[next]);
    };
    timeout = setTimeout(() => {
      setStage(1);
      advance(1);
    }, STAGE_DURATIONS[0]);
    return () => clearTimeout(timeout);
  }, []);

  const stageLabels: Record<Stage, string> = {
    0: 'Upload',
    1: 'Details',
    2: 'Generating',
    3: 'Ready ✓',
  };

  return (
    <div className="w-full relative">
      {/* Outer glow ring */}
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-[#F0B429]/25 via-[#F0B429]/08 to-transparent pointer-events-none" style={{ borderRadius: 13 }} />
      <div className="absolute -inset-[8px] rounded-2xl bg-[#F0B429] opacity-[0.14] blur-[24px] pointer-events-none" />

      <div className="relative w-full bg-[#0d0d0d] border border-[#F0B429]/20 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.18),0_0_0_1px_rgba(240,180,41,0.08)] overflow-hidden animate-float">

        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#111111] border-b border-[#1a1a1a]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 mx-3 bg-[#1a1a1a] rounded-md px-3 py-1.5 text-[10px] text-[#444444] font-mono">
            reeltors.ai/create
          </div>
          {/* Stage indicator pills */}
          <div className="flex gap-1">
            {([0, 1, 2, 3] as Stage[]).map((s) => (
              <div
                key={s}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ background: stage === s ? '#F0B429' : stage > s ? '#7A5200' : '#222222' }}
              />
            ))}
          </div>
        </div>

        {/* Stage label bar */}
        <div className="flex border-b border-[#111111]">
          {([0, 1, 2, 3] as Stage[]).map((s) => (
            <div
              key={s}
              className={`flex-1 py-2 text-center text-[9px] font-semibold transition-colors ${stage === s ? 'text-[#F0B429] bg-[#F0B429]/05' : stage > s ? 'text-[#7A5200]' : 'text-[#2a2a2a]'}`}
            >
              {stageLabels[s]}
            </div>
          ))}
        </div>

        {/* Animated content area */}
        <div className="relative" style={{ height: 200 }}>
          <UploadScreen     active={stage === 0} />
          <DetailsScreen    active={stage === 1} />
          <GeneratingScreen active={stage === 2} />
          <ReadyScreen      active={stage === 3} />
        </div>
      </div>
    </div>
  );
}
