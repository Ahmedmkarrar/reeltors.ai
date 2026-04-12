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
          <label htmlFor={inputId} className="text-sm font-medium text-[#1A1714]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            // 16px prevents iOS auto-zoom; min-h ensures 44px touch target
            'w-full min-h-[44px] bg-white border rounded-[10px] px-4 py-3',
            'text-[16px] text-[#1A1714] placeholder:text-[#ADADAD]',
            'focus:outline-none focus:border-[#1A1714]/30 transition-colors duration-150',
            '[&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-[#1A1714]',
            '[&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset]',
            error ? 'border-red-400' : 'border-[#EBEBEB] hover:border-[#D0CECA]',
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
