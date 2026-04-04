const CREATOMATE_API_URL = 'https://api.creatomate.com/v1';

function getApiKey(): string {
  const key = process.env.CREATOMATE_API_KEY;
  if (!key) throw new Error('CREATOMATE_API_KEY environment variable is not set');
  return key;
}

export const TEMPLATES = [
  {
    id: 'cinematic-listing',
    name: 'Cinematic Listing',
    description: 'Smooth cinematic Ken Burns effect on your photos',
    thumbnail: '/templates/cinematic.jpg',
    duration: 30,
    bestFor: 'Luxury homes & social feeds',
  },
  {
    id: 'quick-reel',
    name: 'Quick Reel',
    description: 'Fast-cut energetic reel with trending transitions',
    thumbnail: '/templates/quick.jpg',
    duration: 15,
    bestFor: 'TikTok & Instagram Reels',
  },
  {
    id: 'luxury-showcase',
    name: 'Luxury Showcase',
    description: 'Elegant slow reveal with premium typography',
    thumbnail: '/templates/luxury.jpg',
    duration: 45,
    bestFor: 'High-end properties & YouTube',
  },
];

export interface GenerateVideoParams {
  templateId: string;
  images: string[];
  listingAddress?: string;
  listingPrice?: string;
  agentName?: string;
  format?: 'vertical' | 'square' | 'horizontal';
  webhookUrl?: string;
  metadata?: Record<string, string>; // passed back in webhook payload
}

export interface CreatomateRender {
  id: string;
  status: 'planned' | 'waiting' | 'transcribing' | 'rendering' | 'succeeded' | 'failed';
  url?: string;
  snapshot_url?: string;
  error_message?: string;
}

export async function generateVideo(params: GenerateVideoParams): Promise<CreatomateRender> {
  const { templateId, images, listingAddress, listingPrice, agentName, format = 'vertical', webhookUrl, metadata } = params;

  const outputFormat = {
    vertical:   { width: 1080, height: 1920 },
    square:     { width: 1080, height: 1080 },
    horizontal: { width: 1920, height: 1080 },
  }[format];

  const modifications: Record<string, string | number> = {};

  images.slice(0, 10).forEach((url, i) => {
    modifications[`Photo-${i + 1}.source`] = url;
  });

  if (listingAddress) modifications['Address.text'] = listingAddress;
  if (listingPrice)   modifications['Price.text']   = listingPrice;
  if (agentName)      modifications['Agent-Name.text'] = agentName;

  modifications['Output-Width']  = outputFormat.width;
  modifications['Output-Height'] = outputFormat.height;

  const body: Record<string, unknown> = {
    template_id: templateId,
    modifications,
  };

  if (webhookUrl)  body.webhook_url = webhookUrl;
  if (metadata)    body.metadata    = metadata;

  return retryWithBackoff(() => callCreatomate('/renders', body), { attempts: 3, baseMs: 1000 });
}

export async function getRenderStatus(renderId: string): Promise<CreatomateRender> {
  return retryWithBackoff(() => callCreatomate(`/renders/${renderId}`), { attempts: 2, baseMs: 500 });
}

async function callCreatomate(path: string, body?: unknown): Promise<CreatomateRender> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${CREATOMATE_API_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new CreatomateError(`Creatomate API error ${response.status}: ${errorText}`, response.status);
    }

    const data = await response.json();
    // Creatomate returns an array for POST /renders
    return Array.isArray(data) ? data[0] : data;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

interface RetryOptions {
  attempts: number;
  baseMs: number;
}

async function retryWithBackoff<T>(fn: () => Promise<T>, { attempts, baseMs }: RetryOptions): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Don't retry client errors (4xx)
      if (err instanceof CreatomateError && err.status && err.status < 500) throw err;
      if (i < attempts - 1) {
        await sleep(baseMs * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class CreatomateError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'CreatomateError';
    this.status = status;
  }
}
