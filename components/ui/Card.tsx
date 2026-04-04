interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  accent?: boolean;
}

export function Card({ children, accent, className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'bg-[#141414] rounded-[6px] p-6',
        accent
          ? 'border border-[#F0B429] shadow-[0_0_30px_rgba(240,180,41,0.08)]'
          : 'border border-[#222222]',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
