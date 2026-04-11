function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#E8E4DC] ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 max-w-4xl animate-page-enter">
      {/* Greeting */}
      <Pulse className="h-3 w-20 mb-3" />
      <Pulse className="h-8 w-56 mb-1" />
      <Pulse className="h-4 w-40 mb-8" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-[#E8E4DC] rounded-[10px] p-4">
            <Pulse className="h-3 w-16 mb-3" />
            <Pulse className="h-7 w-10" />
          </div>
        ))}
      </div>

      {/* Section label */}
      <Pulse className="h-3 w-24 mb-4" />

      {/* Video card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-[#E8E4DC] rounded-[10px] overflow-hidden">
            <Pulse className="h-40 w-full rounded-none" />
            <div className="p-3 space-y-2">
              <Pulse className="h-3 w-3/4" />
              <Pulse className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
