import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PLAN_LIMITS } from '@/lib/stripe/plans';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { plan } = await req.json() as { plan: string };
  const validPlans = ['free', 'starter', 'growth', 'pro'];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('profiles')
    .update({
      plan,
      videos_limit: PLAN_LIMITS[plan] ?? 1,
      subscription_status: plan === 'free' ? 'free' : 'active',
    })
    .eq('id', params.id);

  if (error) {
    console.error('[ADMIN_UPDATE_USER]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();

  // Delete videos first, then profile
  await admin.from('videos').delete().eq('user_id', params.id);
  const { error } = await admin.from('profiles').delete().eq('id', params.id);

  if (error) {
    console.error('[ADMIN_DELETE_USER]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
