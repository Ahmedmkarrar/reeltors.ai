import { FadeIn } from '@/components/ui/FadeIn';

const stats = [
  { value: '60 sec',  label: 'avg creation time',                accent: true },
  { value: '3',       label: 'platforms per video',              accent: false },
  { value: '403%',    label: 'more buyer inquiries with video*', accent: true },
  { value: '$19',     label: 'to get started',                   accent: false },
  { value: '30 day',  label: 'money-back guarantee',             accent: false },
];

export function StatsStrip() {
  return (
    <section className="relative py-14 px-4 overflow-hidden border-y border-[#1E1C18]">
      <div className="absolute inset-0 bg-[#111010]" />
      <div className="absolute inset-0 dot-grid opacity-15" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-[#F0B429] opacity-[0.06] rounded-full blur-[80px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5">
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 70} direction="none">
              <div className={`flex flex-col items-center text-center py-4 px-3 ${i < stats.length - 1 ? 'md:border-r border-[#1E1C18]' : ''} ${i === 1 ? 'border-b md:border-b-0 border-[#1E1C18]' : ''}`}>
                <div
                  className="font-syne font-extrabold leading-none mb-2"
                  style={{
                    fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
                    color: s.accent ? '#F0B429' : '#C8C4BC',
                    textShadow: s.accent ? '0 0 40px rgba(240,180,41,0.3)' : 'none',
                  }}
                >
                  {s.value}
                </div>
                <div className="text-[11px] text-[#4A4744] tracking-wide leading-tight">{s.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
        <p className="text-center text-[10px] text-[#4A4744] mt-4 font-mono">* NAR Research 2024</p>
      </div>
    </section>
  );
}
