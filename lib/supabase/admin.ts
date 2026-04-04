import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Singleton admin client — service role, bypasses RLS
// Only use in server-side code (API routes, webhooks, crons)
// Never import in client components or expose to browser

let _admin: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Supabase admin credentials not configured');
    }

    _admin = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _admin;
}
