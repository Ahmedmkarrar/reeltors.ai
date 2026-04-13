'use client';

import { useEffect } from 'react';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-[#FFF5F5] border border-red-100 rounded-[12px] flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="font-syne font-bold text-[18px] text-[#1A1714] mb-2">Something went wrong</h2>
        <p className="text-sm text-[#ADADAD] mb-6 leading-relaxed">
          {error.message || 'An unexpected error occurred. Your videos are safe.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-[#1A1714] hover:bg-[#2A2420] text-white font-semibold px-5 py-2.5 rounded-[10px] text-sm transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
