'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '#proof',        label: 'Results' },
  { href: '#how-it-works', label: 'How it Works' },
  { href: '#pricing',      label: 'Pricing' },
];

export function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[#0D0B08]/95 backdrop-blur-md border-b border-[#1E1C18] shadow-[0_1px_0_rgba(240,180,41,0.06)]'
            : 'bg-transparent',
        ].join(' ')}
      >
        <div className="max-w-6xl mx-auto px-4 h-[62px] flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-6 h-6 bg-[#F0B429] rounded-[4px] flex items-center justify-center shadow-[0_0_12px_rgba(240,180,41,0.4)] group-hover:shadow-[0_0_20px_rgba(240,180,41,0.6)] transition-shadow">
              <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="font-syne font-extrabold text-[17px] tracking-tight text-[#FAFAF8]">
              Reeltor<span className="text-[#F0B429]">.</span>ai
            </span>
          </Link>

          {/* ── Nav links — desktop ── */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-[13px] text-[#6B6760] hover:text-[#FAFAF8] transition-colors"
              >
                {label}
              </a>
            ))}
            <Link
              href="/login"
              className="text-[13px] text-[#6B6760] hover:text-[#FAFAF8] transition-colors"
            >
              Login
            </Link>
          </div>

          {/* ── Right side ── */}
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 bg-[#F0B429] hover:bg-[#F5C842] text-[#080808] font-bold text-sm px-4 py-2 rounded-[5px] transition-all shadow-[0_0_16px_rgba(240,180,41,0.15)] hover:shadow-[0_0_28px_rgba(240,180,41,0.3)]"
            >
              Get Started
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-[#6B6760] hover:text-[#1A1714] transition-colors p-1"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile dropdown menu ── */}
      {mobileOpen && (
        <div className="fixed top-[62px] left-0 right-0 z-40 bg-[#0D0B08] border-b border-[#1E1C18] md:hidden animate-fade-in-up">
          <div className="px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 text-sm text-[#6B6760] hover:text-[#FAFAF8] hover:bg-[#1A1714] rounded-[6px] transition-colors"
              >
                {label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-3 text-sm text-[#6B6760] hover:text-[#FAFAF8] hover:bg-[#1A1714] rounded-[6px] transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
