import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PaywallModal } from '@/components/dashboard/PaywallModal';
import { MobileNav } from '@/components/dashboard/MobileNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  // getSession reads the JWT from cookie — no network call, instant
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

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
