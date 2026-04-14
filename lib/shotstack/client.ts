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
  logoUrl?: string;
  callbackUrl?: string;
  apiKey?: string;
  env?: ShotstackEnv;
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
  logoUrl?: string;
  callbackUrl?: string;
  apiKey?: string;
  env?: ShotstackEnv;
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
  scale?: number;
}

interface ShotstackTimeline {
  background: string;
  tracks: { clips: ShotstackClip[] }[];
}

// ── Design System ─────────────────────────────────────────────────────────────

const PALETTE = {
  GOLD:          '#C9A96E',
  SILVER:        '#D4D4D4',
  TIKTOK_RED:    '#FF3B5C',
  STORY_BLUE:    '#4A9FD4',
  NEAR_BLACK:    '#0A0A0A',
  WHITE:         '#FFFFFF',
  SOFT_WHITE:    'rgba(255,255,255,0.80)',
  CREAM:         '#E8DCC8',
  OVERLAY_DARK:  'rgba(6,6,6,0.72)',
  OVERLAY_COOL:  'rgba(15,15,15,0.76)',
  OVERLAY_DEEP:  'rgba(0,0,0,0.82)',
} as const;

const FONTS_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');";

// ── Template Configuration ────────────────────────────────────────────────────

interface TemplateConfig {
  accentColor:    string;
  overlayColor:   string;
  priceFont:      string;
  detailFont:     string;
  introLength:    number;
  clipLength:     number;
  mediaEffects:   string[];
  clipTransIn:    string;
  clipTransOut:   string;
  textTransIn:    string;
  audioFadeAt:    number;
}

function getTemplateConfig(templateKey?: string): TemplateConfig {
  switch (templateKey) {
    case 'LUXURY_REVEAL':
    case 'LUXURY_MANSION':
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
      effect:     item.type === 'image' ? config.mediaEffects[idx % config.mediaEffects.length] : undefined,
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
  logoUrl?:      string;
  config:        TemplateConfig;
  format?:       'vertical' | 'square' | 'horizontal';
}): ShotstackClip[] {
  const { totalDuration, address, price, agentName, logoUrl, config } = opts;
  const isHorizontal = opts.format === 'horizontal';
  const isSquare     = opts.format === 'square';

  // Scale overlay canvas to the output resolution
  const lowerThirdWidth  = isHorizontal ? 1600 : isSquare ? 900 : 880;
  const lowerThirdHeight = isHorizontal ? 190  : isSquare ? 210 : 230;
  const priceFontSize    = isHorizontal ? 44   : 62;
  const addressFontSize  = isHorizontal ? 20   : 22;
  const agentWidth       = isHorizontal ? 900  : 500;

  const clips: ShotstackClip[] = [];

  if (address || price) {
    clips.push({
      asset: {
        type: 'html',
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
          `.price{font-family:${config.priceFont};color:${PALETTE.WHITE};font-size:${priceFontSize}px;font-weight:700;letter-spacing:-0.5px;line-height:1;margin-bottom:10px;text-shadow:0 2px 16px rgba(0,0,0,0.5)}`,
          `.address{font-family:${config.detailFont};color:${PALETTE.SOFT_WHITE};font-size:${addressFontSize}px;font-weight:400;letter-spacing:1.4px;text-transform:uppercase}`,
        ].join(''),
        width:  lowerThirdWidth,
        height: lowerThirdHeight,
      },
      start:      0,
      length:     totalDuration,
      position:   'bottomLeft',
      offset:     { x: 0.04, y: 0.07 },
      transition: { in: config.textTransIn },
    });
  }

  if (agentName) {
    clips.push({
      asset: {
        type: 'html',
        html: `<div class="wrap"><span class="dot"></span><p class="name">${agentName}</p></div>`,
        css: [
          FONTS_IMPORT,
          `*{margin:0;padding:0;box-sizing:border-box}`,
          `.wrap{font-family:${config.detailFont};display:flex;align-items:center;gap:8px}`,
          `.dot{width:5px;height:5px;border-radius:50%;background:${config.accentColor};flex-shrink:0}`,
          `.name{color:${PALETTE.CREAM};font-size:20px;font-weight:500;letter-spacing:0.8px;white-space:nowrap;text-shadow:0 1px 8px rgba(0,0,0,0.6)}`,
        ].join(''),
        width:  agentWidth,
        height: 44,
      },
      start:    0,
      length:   totalDuration,
      position: 'topRight',
      offset:   { x: -0.04, y: -0.04 },
    });
  }

  if (logoUrl) {
    clips.push({
      asset: { type: 'image', src: logoUrl },
      start:    0,
      length:   totalDuration,
      position: 'topLeft',
      offset:   { x: 0.04, y: -0.04 },
      opacity:  0.95,
      scale:    0.07,
    });
  }

  return clips;
}

function buildAudioTrack(audioUrl: string, totalDuration: number, fadeAt: number): { clips: ShotstackClip[] } {
  const audioDuration = Math.min(totalDuration, fadeAt);
  return {
    clips: [{
      asset: {
        type:   'audio',
        src:    audioUrl,
        trim:   0,
        volume: 0.45,
        effect: 'fadeOut',
      },
      start:  0,
      length: audioDuration,
    }],
  };
}

function buildTimeline(
  mediaItems: MediaItem[],
  opts: {
    address?:     string;
    price?:       string;
    agentName?:   string;
    templateKey?: string;
    audioUrl?:    string;
    logoUrl?:     string;
    format?:      'vertical' | 'square' | 'horizontal';
  },
): ShotstackTimeline {
  const config        = getTemplateConfig(opts.templateKey);
  const mediaClips    = buildMediaClips(mediaItems, config);
  const totalDuration = getTotalDuration(mediaItems, config);
  const textClips     = buildTextClips({
    totalDuration,
    address:   opts.address,
    price:     opts.price,
    agentName: opts.agentName,
    logoUrl:   opts.logoUrl,
    config,
    format:    opts.format,
  });

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

const MOCK_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4';

export async function createRender(opts: {
  timeline:     ShotstackTimeline;
  format?:      'vertical' | 'square' | 'horizontal';
  callbackUrl?: string;
  apiKey?: string;
  env?: ShotstackEnv;
}): Promise<ShotstackRenderResponse> {
  if (process.env.MOCK_AI === 'true') {
    return { id: `mock_${Date.now()}`, status: 'queued' };
  }

  const apiKey = (opts.apiKey ?? process.env.SHOTSTACK_API_KEY ?? '').trim();
  if (!apiKey) throw new ShotstackError('SHOTSTACK_API_KEY is not set');

  const env = (opts.env ?? getEnv()).trim() as ShotstackEnv;

  const body: Record<string, unknown> = {
    timeline: opts.timeline,
    output: {
      format: 'mp4',
      size:   FORMAT_SIZES[opts.format ?? 'vertical'],
    },
  };
  if (opts.callbackUrl) body.callback = opts.callbackUrl;

  const res = await fetch(`${BASE_URL}/${env}/render`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body:    JSON.stringify(body),
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

  const apiKey = (process.env.SHOTSTACK_API_KEY ?? '').trim();
  if (!apiKey) throw new ShotstackError('SHOTSTACK_API_KEY is not set');

  const res = await fetch(`${BASE_URL}/${getEnv().trim()}/render/${renderId}`, {
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
    logoUrl:     opts.logoUrl,
    format:      opts.format ?? 'vertical',
  });
  return createRender({
    timeline,
    format:      opts.format ?? 'vertical',
    callbackUrl: opts.callbackUrl,
    apiKey:      opts.apiKey,
    env:         opts.env,
  });
}
