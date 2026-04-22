'use client';

import { useCallback, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Props {
  plan: string;
  annual: boolean;
  onClose: () => void;
}

export function EmbeddedCheckoutModal({ plan, annual, onClose }: Props) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientSecret = useCallback(async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, annual, embedded: true }),
      });
      const json = await res.json();
      if (json.error) { setError(json.error); return ''; }
      return json.clientSecret as string;
    } catch {
      setError('Failed to connect to checkout. Please try again.');
      return '';
    } finally {
      setIsLoading(false);
    }
  }, [plan, annual]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4" style={{ background: 'rgba(13,11,8,0.9)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full sm:max-w-[520px] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '95vh' }}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE8E2] shrink-0">
          <span className="font-syne font-extrabold text-[13px] tracking-[0.08em] text-[#1A1714]">
            ReeltorsAI
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0EDE6] text-[#6B6760] hover:text-[#1A1714] transition-colors text-lg"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {error ? (
            <div className="p-6 text-center text-red-600 text-sm">{error}</div>
          ) : isLoading ? (
            <div className="p-6 flex flex-col gap-3">
              <div className="h-5 w-1/2 rounded bg-[#F0EDE6] animate-pulse" />
              <div className="h-10 w-full rounded-lg bg-[#F0EDE6] animate-pulse" />
              <div className="h-10 w-full rounded-lg bg-[#F0EDE6] animate-pulse mt-1" />
              <div className="h-px w-full bg-[#EAE8E2] my-2" />
              <div className="h-5 w-1/3 rounded bg-[#F0EDE6] animate-pulse" />
              <div className="h-12 w-full rounded-lg bg-[#F0EDE6] animate-pulse" />
            </div>
          ) : (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </div>
    </div>
  );
}
