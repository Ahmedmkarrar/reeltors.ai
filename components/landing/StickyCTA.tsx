'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (dismissed) return;
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div
      className={[
        'fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 md:hidden',
        visible ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
    >
      <div className="bg-[#141210] border-t border-[#2E2B27] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#FAFAF8]">Start from $49.99.99/month</p>
          <p className="text-[10px] text-[#6B6760]">30-day money back · Ready in 60 seconds</p>
        </div>
        <Link href="/signup" className="shrink-0">
          <Button variant="primary" size="sm" className="text-xs font-bold px-4">
            Get Started →
          </Button>
        </Link>
        <button
          onClick={() => { setDismissed(true); setVisible(false); }}
          className="text-[#4A4744] hover:text-[#FAFAF8] text-lg leading-none shrink-0 p-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}
