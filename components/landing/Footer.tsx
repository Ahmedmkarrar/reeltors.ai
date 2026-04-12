import Link from 'next/link';
import { LogoIcon } from '@/components/ui/LogoIcon';

const LINKS = {
  Product: [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Templates', href: '#showcase' },
    { label: 'ROI Calculator', href: '#roi' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: 'mailto:hello@reeltors.ai' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'DMCA', href: '/dmca' },
  ],
};

const STATS = [
  { n: '60s',   label: 'Avg. Render Time' },
  { n: '403%',  label: 'More Buyer Inquiries' },
  { n: '3',     label: 'Platforms Per Video' },
  { n: '$49',   label: 'To Start' },
];

export function Footer() {
  return (
    <footer className="bg-[#1A1714] text-[#C8C4BC]">
      {/* Top bar — value stats */}
      <div className="border-b border-[#2E2B27]">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ n, label }) => (
            <div key={label} className="text-center">
              <div className="font-syne font-extrabold text-[#F0B429] text-xl md:text-2xl leading-none mb-0.5">{n}</div>
              <div className="text-[11px] text-[#6B6760] uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">

          {/* Brand col */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
              <LogoIcon className="w-9 h-9 drop-shadow-[0_0_10px_rgba(240,180,41,0.4)]" />
              <span className="font-syne font-extrabold text-[20px] text-[#FAFAF8] group-hover:text-[#F0B429] transition-colors">
                ReeltorsAI
              </span>
            </Link>
            <p className="text-sm text-[#8A8682] leading-relaxed max-w-[240px] mb-6">
              Turn listing photos into cinematic, scroll-stopping TikToks and Reels in 60 seconds. Built for real estate agents who want more leads.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {[
                { label: 'TikTok', path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z' },
                { label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                { label: 'Twitter/X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
              ].map(({ label, path }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 rounded-[5px] bg-[#252220] border border-[#333028] flex items-center justify-center text-[#6B6760] hover:text-[#F0B429] hover:border-[#F0B429]/30 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-[11px] font-bold text-[#6B6760] uppercase tracking-[0.15em] mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-[#8A8682] hover:text-[#FAFAF8] transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#2E2B27]">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#4A4744]">
            © 2026 Reeltors.ai · All rights reserved.
          </p>
          <p className="text-[11px] text-[#4A4744]">
            Built for real estate agents who want more leads
          </p>
        </div>
      </div>
    </footer>
  );
}
