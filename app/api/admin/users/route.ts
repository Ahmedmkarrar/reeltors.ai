import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const plan   = searchParams.get('plan') ?? '';
  const page   = parseInt(searchParams.get('page') ?? '1');
  const limit  = 50;
  const offset = (page - 1) * limit;

  const admin = getSupabaseAdmin();

  let query = admin
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  if (plan)   query = query.eq('plan', plan);

  const { data, count, error } = await query;

  if (error) {
    console.error('[ADMIN_USERS]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data, total: count ?? 0, page, limit });
}
