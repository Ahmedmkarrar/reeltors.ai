'use client';

import { useState } from 'react';
import { UpgradeModal } from './UpgradeModal';

/** Inline text-link trigger — use inside paragraphs */
export function UpgradeLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <UpgradeModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Full button trigger — use for banners / CTAs */
export function UpgradeButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <UpgradeModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
