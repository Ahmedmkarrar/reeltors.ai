import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: session, error } = await admin
    .from('tunnel_sessions')
    .select('status, output_url, thumbnail_url, abuse_blocked_reason')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    status:      session.status,
    outputUrl:   session.output_url ?? null,
    thumbnailUrl: session.thumbnail_url ?? null,
  });
}
