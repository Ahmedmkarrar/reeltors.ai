function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#E8E4DC] ${className}`} />;
}

export default function CreateLoading() {
  return (
    <div className="p-6 md:p-8 max-w-3xl">
      {/* Step header */}
      <Pulse className="h-3 w-24 mb-3" />
      <Pulse className="h-8 w-56 mb-2" />
      <div className="flex gap-2 mb-2">
        <div className="h-1 w-8 rounded-full bg-[#F0B429] animate-pulse" />
        <Pulse className="h-1 w-8 rounded-full" />
        <Pulse className="h-1 w-8 rounded-full" />
      </div>
      <Pulse className="h-4 w-80 mb-8" />

      {/* Photo strip area */}
      <div className="min-h-[172px] flex items-center justify-center">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[72px] animate-pulse rounded bg-[#E8E4DC]" style={{ aspectRatio: '9/16' }} />
          ))}
        </div>
      </div>

      {/* Prompt bar */}
      <Pulse className="h-[88px] w-full rounded-[8px]" />
    </div>
  );
}
