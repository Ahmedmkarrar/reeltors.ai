import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PaywallModal } from '@/components/dashboard/PaywallModal';
import { MobileNav } from '@/components/dashboard/MobileNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  // getUser() validates the JWT with Supabase Auth — prevents stale session false positives
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen" style={{ background: '#FAFAF8' }}>
      <PaywallModal />
      <Sidebar />

      <MobileNav />

      {/* Main content — mobile-nav-padding adds safe-area-aware pb on mobile, reset on md+ via globals.css */}
      <main className="flex-1 min-w-0 overflow-x-hidden mobile-nav-padding">
        {children}
      </main>
    </div>
  );
}
