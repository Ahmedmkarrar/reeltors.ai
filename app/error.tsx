'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#080808] text-[#F0F0EB] font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-[14px] flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="font-bold text-[20px] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#6B6760] mb-8 leading-relaxed">
              {error.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 bg-white text-[#080808] font-semibold px-5 py-2.5 rounded-[10px] text-sm hover:bg-white/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
