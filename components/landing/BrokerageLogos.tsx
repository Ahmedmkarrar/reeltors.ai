const row1 = ['Keller Williams', 'RE/MAX', 'Compass', 'eXp Realty', 'Coldwell Banker', 'Century 21', 'Sotheby\'s', 'Douglas Elliman'];
const row2 = ['Berkshire Hathaway', 'Better Homes', 'ERA Real Estate', 'Engel & Völkers', 'John L. Scott', 'Long & Foster', 'Howard Hanna', 'NextHome'];

function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden relative">
      <div
        className={reverse ? 'animate-ticker-reverse' : 'animate-ticker'}
        style={{ display: 'flex', width: 'max-content' }}
      >
        {doubled.map((name, i) => (
          <div
            key={i}
            className="mx-2 shrink-0 flex items-center justify-center px-5 py-2.5 bg-[#141210] border border-[#2E2B27] rounded-[4px] opacity-50 hover:opacity-80 transition-opacity cursor-default"
          >
            <span className="font-syne font-bold text-[11px] text-[#6B6760] tracking-wide whitespace-nowrap uppercase">
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrokerageLogos() {
  return (
    <section className="py-10 border-b border-[#1E1C18] overflow-hidden bg-[#0D0B08]">
      <p className="text-center text-[10px] font-mono text-[#4A4744] uppercase tracking-widest mb-6">
        Built for agents at every brokerage
      </p>
      <div className="flex flex-col gap-3">
        <MarqueeRow items={row1} />
        <MarqueeRow items={row2} reverse />
      </div>
    </section>
  );
}
