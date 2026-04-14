import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const rawSecret = process.env.WEBHOOK_SECRET ?? '';
  const cleanSecret = rawSecret.replace(/[^\x20-\x7E]/g, '');
  if (secret !== cleanSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const apiKey = (process.env.SHOTSTACK_API_KEY ?? '').trim();
  const env    = (process.env.SHOTSTACK_ENV ?? 'stage').trim();
  const webhookSecret = cleanSecret;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim();
  const vercelUrl = process.env.VERCEL_URL ?? '';

  // Match exactly what generate/route.ts does after the fix
  const processUrl = appUrl.startsWith('https://')
    ? `${appUrl}/api/videos/process`
    : `http://localhost:${process.env.PORT ?? '3000'}/api/videos/process`;

  // 1. Test process route auth
  let processAuthResult: unknown;
  try {
    const r = await fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`,
      },
      body: JSON.stringify({ videoId: 'debug-test', userId: 'debug', images: [], aiIndices: [], templateId: 'CINEMATIC', isPaidPlan: false, isFree: true }),
    });
    processAuthResult = { status: r.status, ok: r.ok, body: await r.json().catch(() => null) };
  } catch (err) {
    processAuthResult = { error: err instanceof Error ? err.message : String(err) };
  }

  // 2. Check latest failed video for clues
  let lastFailedVideo: unknown;
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from('videos')
      .select('id, status, render_id, created_at, source_images')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    lastFailedVideo = data;
  } catch (err) {
    lastFailedVideo = { error: err instanceof Error ? err.message : String(err) };
  }

  return NextResponse.json({
    env: {
      apiKeyPrefix:   apiKey ? apiKey.slice(0, 8) + '...' : 'NOT SET',
      shotstack_env:  env,
      appUrl,
      vercelUrl,
      processUrl,
      webhookSecretSet: !!webhookSecret,
      webhookSecretRawLen: rawSecret.length,
      webhookSecretCleanLen: cleanSecret.length,
    },
    processRouteAuth: processAuthResult,
    lastFailedVideo,
  });
}
