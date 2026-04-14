import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.WEBHOOK_SECRET?.trim()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const apiKey = (process.env.SHOTSTACK_API_KEY ?? '').trim();
  const env = (process.env.SHOTSTACK_ENV ?? 'stage').trim();

  if (!apiKey) {
    return NextResponse.json({ error: 'SHOTSTACK_API_KEY is not set' }, { status: 500 });
  }

  const url = `https://api.shotstack.io/edit/${env}/render`;

  const testTimeline = {
    timeline: {
      background: '#000000',
      tracks: [{
        clips: [{
          asset: { type: 'image', src: 'https://via.placeholder.com/1080x1920.jpg' },
          start: 0,
          length: 2,
        }],
      }],
    },
    output: { format: 'mp4', size: { width: 1080, height: 1920 } },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(testTimeline),
    });

    const text = await res.text();
    let json: unknown;
    try { json = JSON.parse(text); } catch { json = text; }

    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      apiKeyPrefix: apiKey.slice(0, 8) + '...',
      env,
      url,
      response: json,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
      apiKeyPrefix: apiKey.slice(0, 8) + '...',
      env,
      url,
    }, { status: 500 });
  }
}
