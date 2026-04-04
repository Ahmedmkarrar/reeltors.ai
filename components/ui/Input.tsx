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
          <label htmlFor={inputId} className="text-sm font-medium text-[#3A3733]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full bg-white border rounded px-3 py-2.5 text-sm text-[#1A1714]',
            'placeholder:text-[#B8B4AE]',
            'focus:outline-none focus:border-[#F0B429] focus:ring-1 focus:ring-[#F0B429]/40',
            'transition-colors duration-150',
            // Fix browser autofill dark background
            '[&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-[#1A1714]',
            '[&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset]',
            error ? 'border-red-400' : 'border-[#D8D4CC] hover:border-[#B8B4AE]',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
