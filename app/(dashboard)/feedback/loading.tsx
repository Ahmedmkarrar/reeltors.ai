function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#F0EDE8] ${className}`} />;
}

export default function FeedbackLoading() {
  return (
    <div className="p-6 md:p-8 max-w-2xl animate-page-enter">
      <Pulse className="h-3 w-16 mb-3" />
      <Pulse className="h-8 w-40 mb-8" />

      <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 space-y-4">
        <Pulse className="h-4 w-32" />
        <div className="flex gap-2 flex-wrap">
          {[80, 72, 96, 88, 60].map((w) => (
            <div key={w} className="h-8 animate-pulse rounded-full bg-[#F0EDE8]" style={{ width: w }} />
          ))}
        </div>
        <Pulse className="h-32 w-full rounded-lg" />
        <Pulse className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}
