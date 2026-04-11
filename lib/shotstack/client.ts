const BASE_URL = 'https://api.shotstack.io/edit';

type ShotstackEnv = 'stage' | 'v1';

function getEnv(): ShotstackEnv {
  return (process.env.SHOTSTACK_ENV ?? 'stage') as ShotstackEnv;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShotstackStatus = 'queued' | 'fetching' | 'rendering' | 'saving' | 'done' | 'failed';

export interface ShotstackRenderResponse {
  id: string;
  status: ShotstackStatus;
  url?: string;
  thumbnail?: string;
  error?: string;
}

export class ShotstackError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ShotstackError';
  }
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface GenerateVideoOptions {
  templateKey?: string;
  images: string[];
  listingAddress?: string;
  listingPrice?: string;
  agentName?: string;
  brandName?: string;
  email?: string;
  phone?: string;
  format?: 'vertical' | 'square' | 'horizontal';
  callbackUrl?: string;
}

export interface GenerateMixedMediaOptions {
  mediaItems: MediaItem[];
  listingAddress?: string;
  listingPrice?: string;
  agentName?: string;
  brandName?: string;
  email?: string;
  phone?: string;
  format?: 'vertical' | 'square' | 'horizontal';
  callbackUrl?: string;
}

// ── Internal timeline types ───────────────────────────────────────────────────

interface ShotstackClip {
  asset: Record<string, unknown>;
  start: number;
  length: number;
  effect?: string;
  transition?: { in?: string; out?: string };
  position?: string;
  offset?: { x?: number; y?: number };
}

interface ShotstackTimeline {
  background: string;
  tracks: { clips: ShotstackClip[] }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

// First clip is slightly longer for a dramatic opener feel
const INTRO_CLIP_LENGTH = 5;
const CLIP_LENGTH       = 4;

const FORMAT_SIZES: Record<string, { width: number; height: number }> = {
  vertical:   { width: 1080, height: 1920 },
  square:     { width: 1080, height: 1080 },
  horizontal: { width: 1920, height: 1080 },
};

// Alternate slow zoom in / zoom out — classic cinematic Ken Burns
const CINEMATIC_EFFECTS = ['zoomIn', 'zoomOut', 'zoomIn', 'zoomOut', 'slideLeft', 'slideRight'];

// ── Timeline builders ─────────────────────────────────────────────────────────

function buildMediaClips(mediaItems: MediaItem[]): ShotstackClip[] {
  let cursor = 0;
  return mediaItems.map((item, idx) => {
    const length = idx === 0 ? INTRO_CLIP_LENGTH : CLIP_LENGTH;
    const start  = cursor;
    cursor += length;

    return {
      asset: item.type === 'video'
        ? { type: 'video', src: item.url, trim: 0, volume: 0, fit: 'cover' }
        : { type: 'image', src: item.url, fit: 'cover' },
      start,
      length,
      effect:     item.type === 'image' ? CINEMATIC_EFFECTS[idx % CINEMATIC_EFFECTS.length] : undefined,
      filter:     item.type === 'image' ? 'boost' : undefined,
      transition: { in: 'fade', out: 'fade' },
    };
  });
}

function getTotalDuration(mediaItems: MediaItem[]): number {
  return INTRO_CLIP_LENGTH + Math.max(0, mediaItems.length - 1) * CLIP_LENGTH;
}

function buildTextClips(opts: {
  totalDuration: number;
  address?: string;
  price?: string;
  agentName?: string;
  format?: 'vertical' | 'square' | 'horizontal';
}): ShotstackClip[] {
  const clips: ShotstackClip[] = [];
  const isHorizontal = opts.format === 'horizontal';
  const isSquare     = opts.format === 'square';

  // scale overlay canvas to the output resolution
  const lowerThirdWidth  = isHorizontal ? 1600 : isSquare ? 900 : 860;
  const lowerThirdHeight = isHorizontal ? 180  : isSquare ? 200 : 220;
  const priceFontSize    = isHorizontal ? 44   : 52;
  const addressFontSize  = isHorizontal ? 22   : 26;
  const agentWidth       = isHorizontal ? 900  : 520;

  // cinematic lower-third: gradient bar + price + address
  if (opts.address || opts.price) {
    clips.push({
      asset: {
        type: 'html',
        html: [
          '<div class="wrap">',
          '  <div class="bar"></div>',
          opts.price   ? `  <p class="price">${opts.price}</p>` : '',
          opts.address ? `  <p class="address">${opts.address}</p>` : '',
          '</div>',
        ].join(''),
        css: [
          '*{margin:0;padding:0;box-sizing:border-box}',
          '.wrap{font-family:"Helvetica Neue",Arial,sans-serif;width:100%;padding:0 0 0 0}',
          '.bar{width:60px;height:3px;background:#F0B429;margin-bottom:12px}',
          `.price{color:#ffffff;font-size:${priceFontSize}px;font-weight:800;letter-spacing:-1px;line-height:1;margin-bottom:8px;text-shadow:0 2px 12px rgba(0,0,0,0.6)}`,
          `.address{color:rgba(255,255,255,0.82);font-size:${addressFontSize}px;font-weight:400;letter-spacing:0.2px}`,
        ].join(''),
        width:  lowerThirdWidth,
        height: lowerThirdHeight,
      },
      start:    0,
      length:   opts.totalDuration,
      position: 'bottomLeft',
      offset:   { x: 0.05, y: 0.1 },
    });
  }

  // agent name: top-right, subtle
  if (opts.agentName) {
    clips.push({
      asset: {
        type: 'html',
        html: `<div class="wrap"><span class="dot"></span><p class="name">${opts.agentName}</p></div>`,
        css: [
          '*{margin:0;padding:0;box-sizing:border-box}',
          '.wrap{font-family:"Helvetica Neue",Arial,sans-serif;display:flex;align-items:center;gap:8px}',
          '.dot{width:6px;height:6px;border-radius:50%;background:#F0B429;flex-shrink:0}',
          '.name{color:rgba(255,255,255,0.9);font-size:22px;font-weight:500;letter-spacing:0.5px;white-space:nowrap}',
        ].join(''),
        width:  agentWidth,
        height: 50,
      },
      start:    0,
      length:   opts.totalDuration,
      position: 'topRight',
      offset:   { x: -0.04, y: -0.04 },
    });
  }

  return clips;
}

function buildTimeline(
  mediaItems: MediaItem[],
  opts: { address?: string; price?: string; agentName?: string; format?: 'vertical' | 'square' | 'horizontal' },
): ShotstackTimeline {
  const mediaClips    = buildMediaClips(mediaItems);
  const totalDuration = getTotalDuration(mediaItems);
  const textClips   = buildTextClips({ totalDuration, format: opts.format, ...opts });

  // tracks[0] is the top layer in Shotstack
  const tracks: { clips: ShotstackClip[] }[] = [];
  if (textClips.length > 0) tracks.push({ clips: textClips });
  tracks.push({ clips: mediaClips });

  return { background: '#000000', tracks };
}

// ── API calls ─────────────────────────────────────────────────────────────────

// Sample video returned in mock mode — real estate exterior clip
const MOCK_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4';

export async function createRender(opts: {
  timeline: ShotstackTimeline;
  format?: 'vertical' | 'square' | 'horizontal';
  callbackUrl?: string;
}): Promise<ShotstackRenderResponse> {
  // MOCK_AI=true: skip API, return a fake queued render immediately
  if (process.env.MOCK_AI === 'true') {
    return { id: `mock_${Date.now()}`, status: 'queued' };
  }

  const apiKey = process.env.SHOTSTACK_API_KEY;
  if (!apiKey) throw new ShotstackError('SHOTSTACK_API_KEY is not set');

  const body: Record<string, unknown> = {
    timeline: opts.timeline,
    output: {
      format: 'mp4',
      size: FORMAT_SIZES[opts.format ?? 'vertical'],
    },
  };
  if (opts.callbackUrl) body.callback = opts.callbackUrl;

  const res = await fetch(`${BASE_URL}/${getEnv()}/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ShotstackError(`HTTP ${res.status}: ${text}`, res.status);
  }

  const json = await res.json() as {
    success: boolean;
    response: { id: string; message: string };
  };

  if (!json.success || !json.response?.id) {
    throw new ShotstackError(`Unexpected Shotstack response: ${JSON.stringify(json)}`);
  }

  return { id: json.response.id, status: 'queued' };
}

export async function getRenderStatus(renderId: string): Promise<ShotstackRenderResponse> {
  // MOCK_AI=true: immediately return done with a sample video URL
  if (process.env.MOCK_AI === 'true') {
    return { id: renderId, status: 'done', url: MOCK_VIDEO_URL };
  }

  const apiKey = process.env.SHOTSTACK_API_KEY;
  if (!apiKey) throw new ShotstackError('SHOTSTACK_API_KEY is not set');

  const res = await fetch(`${BASE_URL}/${getEnv()}/render/${renderId}`, {
    headers: { 'x-api-key': apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ShotstackError(`HTTP ${res.status}: ${text}`, res.status);
  }

  const json = await res.json() as {
    success: boolean;
    response: {
      id: string;
      status: ShotstackStatus;
      url?: string;
      thumbnail?: string | null;
      error?: string;
    };
  };

  const r = json.response;
  return {
    id:        r.id,
    status:    r.status,
    url:       r.url,
    thumbnail: r.thumbnail ?? undefined,
    error:     r.error,
  };
}

// ── High-level helpers ────────────────────────────────────────────────────────

export async function generateVideo(opts: GenerateVideoOptions): Promise<ShotstackRenderResponse> {
  const mediaItems: MediaItem[] = opts.images.map((url) => ({ type: 'image', url }));
  return generateMixedMediaVideo({ ...opts, mediaItems });
}

export async function generateMixedMediaVideo(opts: GenerateMixedMediaOptions): Promise<ShotstackRenderResponse> {
  const timeline = buildTimeline(opts.mediaItems, {
    address:   opts.listingAddress,
    price:     opts.listingPrice,
    agentName: opts.agentName,
    format:    opts.format ?? 'vertical',
  });
  return createRender({
    timeline,
    format:      opts.format ?? 'vertical',
    callbackUrl: opts.callbackUrl,
  });
}
