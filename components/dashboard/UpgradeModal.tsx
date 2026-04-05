'use client';

import { useState } from 'react';
import { PLANS } from '@/lib/stripe/plans';
import toast from 'react-hot-toast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLAN_ORDER = ['starter', 'growth', 'pro'] as const;

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState('');

  if (!isOpen) return null;

  async function handleUpgrade(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const { url, error } = await res.json();
      if (error) { toast.error(error); return; }
      window.location.href = url;
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[680px] rounded-[16px] border border-[#2A2622] shadow-2xl overflow-hidden"
        style={{ background: '#141210' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-[#2A2622]">
          <div>
            <h2 className="text-lg font-bold text-[#F0EDE8] leading-tight">Upgrade your plan</h2>
            <p className="text-[13px] text-[#5A5652] mt-1">Unlock more videos and premium features.</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#484440] hover:text-[#E8E4DE] transition-colors p-1 mt-0.5 rounded hover:bg-[#1C1A17]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-6">
          {PLAN_ORDER.map((key) => {
            const plan = PLANS[key];
            const isPopular = key === 'growth';
            const isLoading = loading === key;

            return (
              <div
                key={key}
                className="relative flex flex-col rounded-[10px] border p-4 transition-all duration-150"
                style={{
                  borderColor: isPopular ? 'rgba(240,180,41,0.40)' : '#2A2622',
                  background:  isPopular ? 'rgba(240,180,41,0.04)' : '#1C1A17',
                  boxShadow:   isPopular ? '0 0 24px rgba(240,180,41,0.06)' : 'none',
                }}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F0B429] text-[#1A1714] text-[9px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap tracking-wide">
                    MOST POPULAR
                  </div>
                )}

                <p className="text-[13px] font-bold text-[#E8E4DE] mb-0.5">{plan.name}</p>
                <p className="text-[10px] text-[#484440] mb-3 leading-snug">{plan.tagline}</p>

                <div className="flex items-baseline gap-0.5 mb-4">
                  <span
                    className="text-[26px] font-extrabold leading-none"
                    style={{ color: isPopular ? '#F0B429' : '#6A6662' }}
                  >
                    ${plan.price}
                  </span>
                  <span className="text-[11px] text-[#484440] ml-0.5">/mo</span>
                </div>

                <ul className="space-y-1.5 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-[#7A7672]">
                      <svg
                        className="w-3 h-3 mt-0.5 shrink-0"
                        style={{ color: isPopular ? '#F0B429' : '#484440' }}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={!!loading}
                  className={[
                    'w-full py-2 rounded-[6px] text-[12px] font-semibold transition-all duration-150',
                    isPopular
                      ? 'bg-[#F0B429] text-[#1A1714] hover:bg-[#E8AC22] active:bg-[#D9A01E]'
                      : 'border border-[#2E2A24] text-[#8A8682] hover:border-[#F0B429]/30 hover:text-[#E8E4DE]',
                    loading ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  {isLoading ? 'Redirecting…' : `Get ${plan.name} →`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-[#3A3632] pb-5 -mt-1">
          Secure checkout via Stripe · Cancel anytime
        </p>
      </div>
    </div>
  );
}
