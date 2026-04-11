function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#F0EDE8] ${className}`} />;
}

export default function SubscriptionLoading() {
  return (
    <div className="p-6 md:p-8 max-w-3xl animate-page-enter">
      <Pulse className="h-3 w-20 mb-3" />
      <Pulse className="h-8 w-48 mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-[#E8E4DC] rounded-xl p-5 space-y-3">
            <Pulse className="h-4 w-20" />
            <Pulse className="h-8 w-28" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3, 4].map((j) => (
                <Pulse key={j} className="h-3 w-full" />
              ))}
            </div>
            <Pulse className="h-10 w-full rounded-lg mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
