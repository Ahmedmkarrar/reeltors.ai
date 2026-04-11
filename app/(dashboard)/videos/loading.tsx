function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#E8E4DC] ${className}`} />;
}

export default function VideosLoading() {
  return (
    <div className="p-6 md:p-8 max-w-4xl animate-page-enter">
      {/* Header */}
      <Pulse className="h-3 w-16 mb-3" />
      <Pulse className="h-8 w-36 mb-6" />

      {/* Filter pills */}
      <div className="flex gap-2 mb-6">
        {[64, 52, 72, 48].map((w) => (
          <div key={w} className="h-7 animate-pulse rounded-full bg-[#E8E4DC]" style={{ width: w }} />
        ))}
      </div>

      {/* Video cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-[#E8E4DC] rounded-[10px] overflow-hidden">
            <Pulse className="h-44 w-full rounded-none" />
            <div className="p-3 space-y-2">
              <Pulse className="h-3 w-3/4" />
              <Pulse className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
