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

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, annual, embedded: true }),
    });
    const { clientSecret, error: err } = await res.json();
    if (err) { setError(err); return ''; }
    return clientSecret as string;
  }, [plan, annual]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,11,8,0.9)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE8E2] shrink-0">
          <span className="font-syne font-extrabold text-[15px] text-[#1A1714]">
            Reeltors<span className="text-[#F0B429]">.</span>ai — Subscribe
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0EDE6] text-[#6B6760] hover:text-[#1A1714] transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Stripe Embedded Checkout */}
        <div className="overflow-y-auto flex-1 p-2">
          {error ? (
            <div className="p-6 text-center text-red-600 text-sm font-mono">{error}</div>
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
