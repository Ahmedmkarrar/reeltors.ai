import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#F0F0EB]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full bg-[#111111] border rounded px-3 py-2.5 text-sm text-[#F0F0EB]',
            'placeholder:text-[#555555]',
            'focus:outline-none focus:border-[#F0B429] focus:ring-1 focus:ring-[#F0B429]',
            'transition-colors duration-150',
            error ? 'border-[#FF5500]' : 'border-[#222222] hover:border-[#333333]',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-[#FF5500]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
