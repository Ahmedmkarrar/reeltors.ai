'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LogoIcon } from '@/components/ui/LogoIcon';

const TAB_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: '/create',
    label: 'Create',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    href: '/videos',
    label: 'Videos',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
];

const MENU_SECTIONS = [
  {
    label: 'Studio',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        ),
      },
      {
        href: '/videos',
        label: 'My Videos',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        href: '/subscription',
        label: 'Subscription',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
        ),
      },
      {
        href: '/account',
        label: 'Account Settings',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        ),
      },
      {
        href: '/feedback',
        label: 'Feedback & Support',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        ),
      },
    ],
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName]   = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      sb.from('profiles').select('full_name, email').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          setUserName(data.full_name || '');
          setUserEmail(data.email || '');
        }
      });
    });
  }, []);

  // close drawer on navigation
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  async function handleSignOut() {
    const sb = createClient();
    await sb.auth.signOut();
    setIsOpen(false);
    router.push('/');
    router.refresh();
  }

  const isCreatePage = pathname.startsWith('/create');
  const initial = (userName || userEmail || 'R').charAt(0).toUpperCase();

  return (
    <>
      {/* Floating hamburger on create page */}
      {isCreatePage ? (
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(201,168,76,0.3)',
          }}
        >
          <svg className="w-5 h-5" style={{ color: '#1A1714' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      ) : (
        /* Bottom tab bar */
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EBEBEB]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex h-[56px]">
            {TAB_ITEMS.map(({ href, label, icon }) => {
              const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  className="flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors relative"
                >
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                      style={{ background: 'linear-gradient(90deg, #C9930A, #F0B429)' }} />
                  )}
                  <span style={{ color: isActive ? '#C9930A' : '#ADADAD' }}>{icon}</span>
                  <span className="text-[9px] font-medium tracking-wide" style={{ color: isActive ? '#C9930A' : '#ADADAD' }}>
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* Menu / hamburger tab */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors relative"
            >
              <svg className="w-[22px] h-[22px]" style={{ color: '#ADADAD' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <span className="text-[9px] font-medium tracking-wide text-[#ADADAD]">More</span>
            </button>
          </div>
        </nav>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-up drawer */}
      <div
        className={[
          'md:hidden fixed left-0 right-0 bottom-0 z-[70] transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ background: '#F5F2EC', borderRadius: '20px 20px 0 0', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-[#C9A84C]/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E2D8]">
          <div className="flex items-center gap-2.5">
            <LogoIcon className="w-6 h-6" />
            <span className="font-syne font-extrabold text-[15px] text-[#1A1714]">ReeltorsAI</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/80 border border-[#C9A84C]/20 flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-[#6B6760]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Create CTA */}
        <div className="px-4 pt-4 pb-2">
          <Link
            href="/create"
            className="btn-gold flex items-center justify-center gap-2 w-full py-3 rounded-[12px] font-bold text-[14px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Video
          </Link>
        </div>

        {/* Nav sections */}
        <div className="px-4 py-2 space-y-4 max-h-[55vh] overflow-y-auto">
          {MENU_SECTIONS.map(({ label, items }) => (
            <div key={label}>
              <p className="text-[10px] font-semibold text-[#8A8682] uppercase tracking-widest px-1 mb-1.5">{label}</p>
              <div className="bg-white/80 rounded-[14px] border border-[#C9A84C]/20 overflow-hidden divide-y divide-[#F0EDE6]">
                {items.map(({ href, label: itemLabel, icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-[#F5F2EC]"
                    >
                      <span style={{ color: isActive ? '#C9930A' : '#8A8682' }}>{icon}</span>
                      <span
                        className="text-[14px] font-medium"
                        style={{ color: isActive ? '#C9930A' : '#1A1714' }}
                      >
                        {itemLabel}
                      </span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C9930A]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User row + sign out */}
        <div className="px-4 py-4 border-t border-[#E8E2D8] mt-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: 'rgba(201,168,76,0.15)', border: '1.5px solid rgba(201,168,76,0.35)', color: '#C9930A' }}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#1A1714] truncate">{userName || 'Realtor'}</p>
            <p className="text-[11px] text-[#8A8682] truncate">{userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-[#FFD4C2] text-[#FF5500] bg-[#FFF4F0] text-[12px] font-semibold shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
