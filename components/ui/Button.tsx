'use client';

import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'btn-gold font-bold active:brightness-95',
  secondary:
    'bg-transparent text-[#C8C4BC] border border-[#2E2B27] hover:border-[#4A4744] hover:bg-[#1A1714] hover:text-[#FAFAF8]',
  danger:
    'bg-[#FF5500] text-white font-bold hover:bg-[#e64d00] active:bg-[#cc4400]',
  ghost:
    'bg-transparent text-[#8A8682] border border-[#2E2B27] hover:border-[#F0B429]/40 hover:text-[#F0B429]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded',
  md: 'px-6 py-3 text-sm rounded',
  lg: 'px-8 py-4 text-base rounded',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F0B429] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAF8]',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size={size} />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

function Spinner({ size }: { size: Size }) {
  const s = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <svg className={`${s} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
