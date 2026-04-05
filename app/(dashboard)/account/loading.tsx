function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#E8E4DC] ${className}`} />;
}

export default function AccountLoading() {
  return (
    <div className="p-6 md:p-8 max-w-2xl">
      {/* Header */}
      <Pulse className="h-3 w-16 mb-3" />
      <Pulse className="h-8 w-28 mb-8" />

      {/* Profile card */}
      <div className="bg-white border border-[#E8E4DC] rounded-[10px] p-5 mb-4">
        <div className="flex items-center gap-4 mb-5">
          <Pulse className="w-12 h-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Pulse className="h-4 w-40" />
            <Pulse className="h-3 w-56" />
          </div>
        </div>
        <div className="space-y-3">
          <Pulse className="h-10 w-full rounded-[6px]" />
          <Pulse className="h-10 w-full rounded-[6px]" />
        </div>
      </div>

      {/* Plan card */}
      <div className="bg-white border border-[#E8E4DC] rounded-[10px] p-5">
        <Pulse className="h-3 w-16 mb-4" />
        <div className="flex justify-between items-center mb-3">
          <Pulse className="h-5 w-24" />
          <Pulse className="h-7 w-20 rounded-[6px]" />
        </div>
        <Pulse className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}
