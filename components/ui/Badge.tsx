type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-[#1a1a1a] text-[#F0F0EB] border border-[#222222]',
  accent:   'bg-[#F0B429] text-[#080808] font-bold',
  success:  'bg-[#0d2b0d] text-[#3FB950] border border-[#1a4d1a]',
  warning:  'bg-[#2b1f0d] text-[#D29922] border border-[#4d3a1a]',
  danger:   'bg-[#2b0d0d] text-[#FF5500] border border-[#4d1a1a]',
  muted:    'bg-[#111111] text-[#888888] border border-[#1a1a1a]',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
