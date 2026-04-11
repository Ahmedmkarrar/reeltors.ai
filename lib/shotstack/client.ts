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
  audioUrl?: string;
  callbackUrl?: string;
}

export interface GenerateMixedMediaOptions {
  mediaItems: MediaItem[];
  templateKey?: string;
  listingAddress?: string;
  listingPrice?: string;
  agentName?: string;
  brandName?: string;
  email?: string;
  phone?: string;
  format?: 'vertical' | 'square' | 'horizontal';
  audioUrl?: string;
  callbackUrl?: string;
}

// ── Internal timeline types ───────────────────────────────────────────────────

interface ShotstackClip {
  asset: Record<string, unknown>;
  start: number;
  length: number;
  effect?: string;
  filter?: string;
  transition?: { in?: string; out?: string };
  position?: string;
  offset?: { x?: number; y?: number };
  opacity?: number;
}

interface ShotstackTimeline {
  background: string;
  tracks: { clips: ShotstackClip[] }[];
}

// ── Design System ─────────────────────────────────────────────────────────────

// Luxury palette: champagne gold + near-black overlay + warm cream for details
// Chosen to read as aspirational without being garish on bright listing photos
const PALETTE = {
  GOLD:          '#C9A96E',   // champagne gold — replaces the old flat yellow
  SILVER:        '#D4D4D4',   // cool silver accent for modern/minimal
  TIKTOK_RED:    '#FF3B5C',   // high-contrast for short-form social
  STORY_BLUE:    '#4A9FD4',   // trustworthy blue for before/after
  NEAR_BLACK:    '#0A0A0A',
  WHITE:         '#FFFFFF',
  SOFT_WHITE:    'rgba(255,255,255,0.80)',
  CREAM:         '#E8DCC8',   // warm cream for agent name tag
  OVERLAY_DARK:  'rgba(6,6,6,0.72)',      // lower-third background panel
  OVERLAY_COOL:  'rgba(15,15,15,0.76)',   // modern-minimal variant
  OVERLAY_DEEP:  'rgba(0,0,0,0.82)',      // TikTok high-contrast variant
} as const;

// Google Fonts import — loaded at render time in Shotstack's headless browser
// Playfair Display: serif authority for price/headlines
// Montserrat: geometric humanist for addresses, details, agent name
const FONTS_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');";

// ── Template Configuration ────────────────────────────────────────────────────

interface TemplateConfig {
  accentColor:    string;
  overlayColor:   string;
  priceFont:      string;    // CSS font-family value
  detailFont:     string;    // CSS font-family value
  introLength:    number;
  clipLength:     number;
  mediaEffects:   string[];  // cycled across clips
  clipTransIn:    string;
  clipTransOut:   string;
  textTransIn:    string;    // Shotstack transition for text track entrance
  audioFadeAt:    number;    // seconds — cap for audio track before fadeOut fires
}

function getTemplateConfig(templateKey?: string): TemplateConfig {
  switch (templateKey) {
    case 'LUXURY_REVEAL':
    case 'LUXURY_MANSION':
      // Slow burn: zoomIn on intro coordinates with price sliding up
      return {
        accentColor:   PALETTE.GOLD,
        overlayColor:  PALETTE.OVERLAY_DARK,
        priceFont:     "'Playfair Display', Georgia, serif",
        detailFont:    "'Montserrat', Arial, sans-serif",
        introLength:   5.5,
        clipLength:    4.5,
        mediaEffects:  ['zoomIn', 'zoomOut', 'zoomIn', 'zoomOut', 'zoomIn', 'zoomOut'],
        clipTransIn:   'fade',
        clipTransOut:  'fade',
        textTransIn:   'slideUp',
        audioFadeAt:   15,
      };

    case 'CINEMATIC':
      // Ken Burns alternating with directional slides for visual variety
      return {
        accentColor:   PALETTE.GOLD,
        overlayColor:  PALETTE.OVERLAY_DARK,
        priceFont:     "'Playfair Display', Georgia, serif",
        detailFont:    "'Montserrat', Arial, sans-serif",
        introLength:   5,
        clipLength:    4,
        mediaEffects:  ['zoomIn', 'slideLeft', 'zoomOut', 'slideRight', 'zoomIn', 'slideLeft'],
        clipTransIn:   'fade',
        clipTransOut:  'fade',
        textTransIn:   'slideUp',
        audioFadeAt:   15,
      };

    case 'MODERN_MINIMAL':
      // Clean directional slides — no zooming, cooler silver accent
      return {
        accentColor:   PALETTE.SILVER,
        overlayColor:  PALETTE.OVERLAY_COOL,
        priceFont:     "'Montserrat', Arial, sans-serif",
        detailFont:    "'Montserrat', Arial, sans-serif",
        introLength:   4.5,
        clipLength:    3.5,
        mediaEffects:  ['slideLeft', 'slideRight', 'slideLeft', 'slideRight', 'slideLeft', 'slideRight'],
        clipTransIn:   'fade',
        clipTransOut:  'fade',
        textTransIn:   'slideLeft',
        audioFadeAt:   15,
      };

    case 'TIKTOK_FAST':
      // Fast wipes, bold contrast, 2s clips for hook-first pacing
      return {
        accentColor:   PALETTE.TIKTOK_RED,
        overlayColor:  PALETTE.OVERLAY_DEEP,
        priceFont:     "'Montserrat', Arial, sans-serif",
        detailFont:    "'Montserrat', Arial, sans-serif",
        introLength:   2.5,
        clipLength:    2,
        mediaEffects:  ['slideLeft', 'slideRight', 'slideLeft', 'slideRight', 'slideLeft', 'slideRight'],
        clipTransIn:   'wipeLeft',
        clipTransOut:  'wipeLeft',
        textTransIn:   'slideLeft',
        audioFadeAt:   12,
      };

    case 'STORY':
      // Hook → before → after pacing; blue accent reads as trustworthy
      return {
        accentColor:   PALETTE.STORY_BLUE,
        overlayColor:  PALETTE.OVERLAY_DARK,
        priceFont:     "'Playfair Display', Georgia, serif",
        detailFont:    "'Montserrat', Arial, sans-serif",
        introLength:   4,
        clipLength:    3.5,
        mediaEffects:  ['zoomIn', 'zoomOut', 'slideLeft', 'slideRight', 'zoomIn', 'zoomOut'],
        clipTransIn:   'fade',
        clipTransOut:  'fade',
        textTransIn:   'slideUp',
        audioFadeAt:   15,
      };

    default:
      // Falls through to luxury gold — safe default for any unknown key
      return {
        accentColor:   PALETTE.GOLD,
        overlayColor:  PALETTE.OVERLAY_DARK,
        priceFont:     "'Playfair Display', Georgia, serif",
        detailFont:    "'Montserrat', Arial, sans-serif",
        introLength:   5,
        clipLength:    4,
        mediaEffects:  ['zoomIn', 'zoomOut', 'zoomIn', 'zoomOut', 'slideLeft', 'slideRight'],
        clipTransIn:   'fade',
        clipTransOut:  'fade',
        textTransIn:   'slideUp',
        audioFadeAt:   15,
      };
  }
}

const FORMAT_SIZES: Record<string, { width: number; height: number }> = {
  vertical:   { width: 1080, height: 1920 },
  square:     { width: 1080, height: 1080 },
  horizontal: { width: 1920, height: 1080 },
};

// ── Timeline Builders ─────────────────────────────────────────────────────────

function buildMediaClips(mediaItems: MediaItem[], config: TemplateConfig): ShotstackClip[] {
  let cursor = 0;
  return mediaItems.map((item, idx) => {
    const length = idx === 0 ? config.introLength : config.clipLength;
    const start  = cursor;
    cursor += length;

    return {
      asset: item.type === 'video'
        ? { type: 'video', src: item.url, trim: 0, volume: 0 }
        : { type: 'image', src: item.url },
      start,
      length,
      // zoomIn on the intro clip so the background movement coordinates with
      // the price text sliding up — creates a single unified reveal motion
      effect:     item.type === 'image'
        ? config.mediaEffects[idx % config.mediaEffects.length]
        : undefined,
      filter:     item.type === 'image' ? 'boost' : undefined,
      transition: { in: config.clipTransIn, out: config.clipTransOut },
    };
  });
}

function getTotalDuration(mediaItems: MediaItem[], config: TemplateConfig): number {
  return config.introLength + Math.max(0, mediaItems.length - 1) * config.clipLength;
}

function buildTextClips(opts: {
  totalDuration: number;
  address?:      string;
  price?:        string;
  agentName?:    string;
  config:        TemplateConfig;
}): ShotstackClip[] {
  const { totalDuration, address, price, agentName, config } = opts;
  const clips: ShotstackClip[] = [];

  if (address || price) {
    // Semi-transparent black panel (overlay) behind the price + address block.
    // The dark background ensures readability regardless of whether the shot
    // behind it is a bright exterior or dark interior — critical for MLS listings
    // where we have no control over photo exposure.
    clips.push({
      asset: {
        type:   'html',
        html: [
          '<div class="wrap">',
          '  <div class="panel">',
          '    <div class="accent-bar"></div>',
          price   ? `    <p class="price">${price}</p>` : '',
          address ? `    <p class="address">${address}</p>` : '',
          '  </div>',
          '</div>',
        ].join(''),
        css: [
          FONTS_IMPORT,
          `*{margin:0;padding:0;box-sizing:border-box}`,
          `.wrap{width:100%;font-family:${config.detailFont}}`,
          `.panel{background:${config.overlayColor};padding:18px 36px 26px 40px;border-top:1px solid ${hexToRgba(config.accentColor, 0.4)}}`,
          `.accent-bar{width:44px;height:2px;background:${config.accentColor};margin-bottom:14px}`,
          `.price{font-family:${config.priceFont};color:${PALETTE.WHITE};font-size:62px;font-weight:700;letter-spacing:-0.5px;line-height:1;margin-bottom:10px;text-shadow:0 2px 16px rgba(0,0,0,0.5)}`,
          `.address{font-family:${config.detailFont};color:${PALETTE.SOFT_WHITE};font-size:22px;font-weight:400;letter-spacing:1.4px;text-transform:uppercase}`,
        ].join(''),
        width:  880,
        height: 230,
      },
      start:      0,
      length:     totalDuration,
      position:   'bottomLeft',
      offset:     { x: 0.04, y: 0.07 },
      transition: { in: config.textTransIn },
    });
  }

  if (agentName) {
    // Agent name: top-right corner, cream text on transparent background.
    // Kept deliberately subtle — the listing should be the hero.
    clips.push({
      asset: {
        type:   'html',
        html:   `<div class="wrap"><span class="dot"></span><p class="name">${agentName}</p></div>`,
        css: [
          FONTS_IMPORT,
          `*{margin:0;padding:0;box-sizing:border-box}`,
          `.wrap{font-family:${config.detailFont};display:flex;align-items:center;gap:8px}`,
          `.dot{width:5px;height:5px;border-radius:50%;background:${config.accentColor};flex-shrink:0}`,
          `.name{color:${PALETTE.CREAM};font-size:20px;font-weight:500;letter-spacing:0.8px;white-space:nowrap;text-shadow:0 1px 8px rgba(0,0,0,0.6)}`,
        ].join(''),
        width:  500,
        height: 44,
      },
      start:    0,
      length:   totalDuration,
      position: 'topRight',
      offset:   { x: -0.04, y: -0.04 },
    });
  }

  return clips;
}

function buildAudioTrack(audioUrl: string, totalDuration: number, fadeAt: number): { clips: ShotstackClip[] } {
  // Cap the audio clip at `fadeAt` seconds (default 15s) so the fadeOut fires
  // at a predictable point rather than dragging through the full video duration.
  // For videos shorter than fadeAt, the clip naturally ends with the video.
  const audioDuration = Math.min(totalDuration, fadeAt);

  return {
    clips: [{
      asset: {
        type:   'audio',
        src:    audioUrl,
        trim:   0,
        volume: 0.45,   // subtle underscore — voice/address should be primary
        effect: 'fadeOut',
      },
      start:  0,
      length: audioDuration,
    }],
  };
}

function buildTimeline(
  mediaItems:  MediaItem[],
  opts: {
    address?:    string;
    price?:      string;
    agentName?:  string;
    templateKey?: string;
    audioUrl?:   string;
  },
): ShotstackTimeline {
  const config      = getTemplateConfig(opts.templateKey);
  const mediaClips  = buildMediaClips(mediaItems, config);
  const totalDuration = getTotalDuration(mediaItems, config);
  const textClips   = buildTextClips({
    totalDuration,
    address:   opts.address,
    price:     opts.price,
    agentName: opts.agentName,
    config,
  });

  // Track order: text overlays (top) → media (bottom)
  const tracks: { clips: ShotstackClip[] }[] = [];
  if (textClips.length > 0) tracks.push({ clips: textClips });
  if (opts.audioUrl) tracks.push(buildAudioTrack(opts.audioUrl, totalDuration, config.audioFadeAt));
  tracks.push({ clips: mediaClips });

  return { background: PALETTE.NEAR_BLACK, tracks };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── API Calls ─────────────────────────────────────────────────────────────────

// Sample video returned in mock mode — real estate exterior clip
const MOCK_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4';

export async function createRender(opts: {
  timeline:    ShotstackTimeline;
  format?:     'vertical' | 'square' | 'horizontal';
  callbackUrl?: string;
}): Promise<ShotstackRenderResponse> {
  if (process.env.MOCK_AI === 'true') {
    return { id: `mock_${Date.now()}`, status: 'queued' };
  }

  const apiKey = process.env.SHOTSTACK_API_KEY;
  if (!apiKey) throw new ShotstackError('SHOTSTACK_API_KEY is not set');

  const body: Record<string, unknown> = {
    timeline: opts.timeline,
    output: {
      format: 'mp4',
      size:   FORMAT_SIZES[opts.format ?? 'vertical'],
    },
  };
  if (opts.callbackUrl) body.callback = opts.callbackUrl;

  const res = await fetch(`${BASE_URL}/${getEnv()}/render`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key':    apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ShotstackError(`HTTP ${res.status}: ${text}`, res.status);
  }

  const json = await res.json() as {
    success:  boolean;
    response: { id: string; message: string };
  };

  if (!json.success || !json.response?.id) {
    throw new ShotstackError(`Unexpected Shotstack response: ${JSON.stringify(json)}`);
  }

  return { id: json.response.id, status: 'queued' };
}

export async function getRenderStatus(renderId: string): Promise<ShotstackRenderResponse> {
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
    success:  boolean;
    response: {
      id:         string;
      status:     ShotstackStatus;
      url?:       string;
      thumbnail?: string | null;
      error?:     string;
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

// ── High-Level Helpers ────────────────────────────────────────────────────────

export async function generateVideo(opts: GenerateVideoOptions): Promise<ShotstackRenderResponse> {
  const mediaItems: MediaItem[] = opts.images.map((url) => ({ type: 'image', url }));
  return generateMixedMediaVideo({ ...opts, mediaItems });
}

export async function generateMixedMediaVideo(opts: GenerateMixedMediaOptions): Promise<ShotstackRenderResponse> {
  const timeline = buildTimeline(opts.mediaItems, {
    address:     opts.listingAddress,
    price:       opts.listingPrice,
    agentName:   opts.agentName,
    templateKey: opts.templateKey,
    audioUrl:    opts.audioUrl,
  });
  return createRender({
    timeline,
    format:      opts.format ?? 'vertical',
    callbackUrl: opts.callbackUrl,
  });
}
