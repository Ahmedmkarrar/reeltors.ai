import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PaywallModal } from '@/components/dashboard/PaywallModal';
import { MobileNav } from '@/components/dashboard/MobileNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  // getUser() validates the JWT with Supabase Auth — prevents stale session false positives
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen" style={{ background: '#FAFAF8' }}>
      <PaywallModal />
      <Sidebar />

      <MobileNav />

      {/* Main content — pb-20 on mobile accounts for bottom nav + safe area; create page has no nav */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-x-hidden" style={{ paddingBottom: 'max(5rem, calc(56px + env(safe-area-inset-bottom)))' }}>
        {children}
      </main>
    </div>
  );
}
