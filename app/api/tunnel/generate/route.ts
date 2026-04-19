import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateVideo, ShotstackError } from '@/lib/shotstack/client';
import { TEMPLATE_IDS } from '@/lib/shotstack/templates';
import { runAbuseChecks, getAbuseBlockMessage } from '@/lib/tunnel/abuse';
import { rateLimit, getIp } from '@/lib/rate-limit';

export const maxDuration = 60;

const VALID_TEMPLATE_KEYS = new Set(Object.keys(TEMPLATE_IDS));

interface GenerateBody {
  sessionToken: string;
  templateKey: string;
  imageUrls: string[];
  email: string;
  deviceFingerprint: string;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(`tunnel-generate:${getIp(req)}`, 5, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { sessionToken, templateKey, imageUrls, email, deviceFingerprint } = body;

  const SESSION_TOKEN_REGEX = /^[a-zA-Z0-9_-]{8,128}$/;
  if (!sessionToken || !SESSION_TOKEN_REGEX.test(sessionToken)) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 400 });
  }
  if (!templateKey || !VALID_TEMPLATE_KEYS.has(templateKey)) {
    return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
  }
  if (!Array.isArray(imageUrls) || imageUrls.length < 1 || imageUrls.length > 15) {
    return NextResponse.json({ error: 'imageUrls must be 1–15 URLs' }, { status: 400 });
  }
  if (imageUrls.some((url) => typeof url !== 'string' || !url.startsWith('http'))) {
    return NextResponse.json({ error: 'All imageUrls must be valid HTTP URLs' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }
  if (!deviceFingerprint || typeof deviceFingerprint !== 'string') {
    return NextResponse.json({ error: 'deviceFingerprint is required' }, { status: 400 });
  }

  const ipAddress = getClientIp(req);
  const normalizedEmail = email.trim().toLowerCase();
  const admin = getSupabaseAdmin();

  // Run abuse checks before creating a session record
  const abuseResult = await runAbuseChecks({
    email: normalizedEmail,
    ipAddress,
    deviceFingerprint,
  });

  if (abuseResult.isBlocked) {
    // Record the blocked attempt for audit
    await admin.from('tunnel_sessions').insert({
      session_token:       sessionToken,
      email:               normalizedEmail,
      ip_address:          ipAddress,
      device_fingerprint:  deviceFingerprint,
      status:              'blocked',
      abuse_blocked_reason: abuseResult.reason,
    });

    return NextResponse.json(
      { error: getAbuseBlockMessage(abuseResult.reason ?? ''), code: 'BLOCKED' },
      { status: 429 }
    );
  }

  // Create tunnel session record
  const { data: session, error: insertError } = await admin
    .from('tunnel_sessions')
    .insert({
      session_token:      sessionToken,
      email:              normalizedEmail,
      ip_address:         ipAddress,
      device_fingerprint: deviceFingerprint,
      template_id:        templateKey,
      source_images:      imageUrls,
      status:             'generating',
    })
    .select('id')
    .single();

  if (insertError || !session) {
    console.error('Failed to create tunnel session:', insertError);
    return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const isPublic = appUrl.startsWith('https://');
  let callbackUrl: string | undefined;
  if (isPublic) {
    const url = new URL(`${appUrl}/api/webhooks/shotstack`);
    if (process.env.WEBHOOK_SECRET) url.searchParams.set('token', process.env.WEBHOOK_SECRET);
    url.searchParams.set('tunnel_session_id', session.id);
    callbackUrl = url.toString();
  }

  let render;
  try {
    render = await generateVideo({
      templateKey,
      images: imageUrls,
      callbackUrl,
    });
  } catch (err) {
    await admin
      .from('tunnel_sessions')
      .update({ status: 'failed' })
      .eq('id', session.id);

    if (err instanceof ShotstackError) {
      console.error('Shotstack error (tunnel):', err.message);
      return NextResponse.json({ error: 'Video render failed. Please try again.' }, { status: 502 });
    }
    return NextResponse.json({ error: 'Failed to start video generation' }, { status: 500 });
  }

  await admin
    .from('tunnel_sessions')
    .update({ render_id: render.id })
    .eq('id', session.id);

  return NextResponse.json({ sessionId: session.id });
}
