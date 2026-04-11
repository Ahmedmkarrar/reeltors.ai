import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PaywallModal } from '@/components/dashboard/PaywallModal';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  // getSession reads the JWT from cookie — no network call, instant
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen" style={{ background: '#FAFAF8' }}>
      <PaywallModal />
      <Sidebar />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E2DED6]" style={{ background: '#F5F3EF' }}>
        <div className="flex">
          {[
            {
              href: '/dashboard', label: 'Home',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
            },
            {
              href: '/create', label: 'Create', accent: true,
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
            },
            {
              href: '/videos', label: 'Videos',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>,
            },
            {
              href: '/account', label: 'Account',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
            },
          ].map(({ href, label, icon, accent }) => (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={[
                'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors',
                accent ? 'text-[#F0B429]' : 'text-[#8A8682] hover:text-[#888888]',
              ].join(' ')}
            >
              {icon}
              <span className="text-[9px] font-medium tracking-wide">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
