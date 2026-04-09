/**
 * Creatomate API client — wraps the Render API.
 * Modifications must be sent as a plain object { "element-name": "value" }
 * not as an array. The API returns status "planned" not "queued".
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreatomateRenderRequest {
  templateId: string;
  modifications: Record<string, string>;
  webhookUrl?: string;
  metadata?: Record<string, string> | string;
}


export interface CreatomateRenderResponse {
  id: string;
  status: 'planned' | 'waiting' | 'transcribing' | 'rendering' | 'succeeded' | 'failed';
  url?: string;
  snapshot_url?: string;
  error?: string;
}

// ─── Error ──────────────────────────────────────────────────────────────────

export class CreatomateError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'CreatomateError';
  }
}

// ─── Render ─────────────────────────────────────────────────────────────────

export async function createRender(req: {
  templateId: string;
  modifications: Record<string, string>;
  webhookUrl?: string;
  metadata?: Record<string, string>;
}): Promise<CreatomateRenderResponse> {
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) throw new CreatomateError('CREATOMATE_API_KEY is not set');

  const payload: Record<string, unknown> = {
    template_id: req.templateId,
    modifications: req.modifications,
  };

  if (req.webhookUrl) {
    payload.webhook_url = req.webhookUrl;
  }
  if (req.metadata) {
    payload.metadata = JSON.stringify(req.metadata);
  }

  const res = await fetch('https://api.creatomate.com/v2/renders', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new CreatomateError(`HTTP ${res.status}: ${text}`, res.status);
  }

  // v1 API returns an array [{}], v2 API returns a single object {}
  const json = await res.json();
  const render = (Array.isArray(json) ? json[0] : json) as CreatomateRenderResponse;

  if (!render?.id) {
    throw new CreatomateError(`Creatomate returned an empty response: ${JSON.stringify(json)}`);
  }

  return render;
}

// ─── Fetch render status ────────────────────────────────────────────────────

export async function getRenderStatus(renderId: string): Promise<CreatomateRenderResponse> {
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) throw new CreatomateError('CREATOMATE_API_KEY is not set');

  const res = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new CreatomateError(`HTTP ${res.status}: ${text}`, res.status);
  }

  return res.json() as Promise<CreatomateRenderResponse>;
}

// ─── Higher-level helpers ────────────────────────────────────────────────────

export interface MediaItem {
  type: 'video' | 'image';
  url: string;
}

export interface GenerateVideoOptions {
  templateId: string;
  images: string[];
  listingAddress?: string;
  listingPrice?: string;
  agentName?: string;
  format?: 'vertical' | 'square' | 'horizontal';
  webhookUrl?: string;
  metadata?: Record<string, string>;
}

export interface GenerateMixedMediaOptions {
  mediaItems: MediaItem[];
  listingAddress?: string;
  listingPrice?: string;
  agentName?: string;
  format?: 'vertical' | 'square' | 'horizontal';
  webhookUrl?: string;
  metadata?: Record<string, string>;
}

export async function generateVideo(opts: GenerateVideoOptions): Promise<CreatomateRenderResponse> {
  return createRender({
    templateId:  opts.templateId,
    modifications: buildModifications({
      photos:    opts.images,
      address:   opts.listingAddress,
      price:     opts.listingPrice,
      agentName: opts.agentName,
    }),
    webhookUrl: opts.webhookUrl,
    metadata:   opts.metadata,
  });
}

export async function generateMixedMediaVideo(opts: GenerateMixedMediaOptions): Promise<CreatomateRenderResponse> {
  const templateId = process.env.CREATOMATE_TEMPLATE_CINEMATIC;
  if (!templateId) throw new CreatomateError('CREATOMATE_TEMPLATE_CINEMATIC is not set');

  return createRender({
    templateId,
    modifications: buildModifications({
      photos:    opts.mediaItems.map((m) => m.url),
      address:   opts.listingAddress,
      price:     opts.listingPrice,
      agentName: opts.agentName,
    }),
    webhookUrl: opts.webhookUrl,
    metadata:   opts.metadata,
  });
}

// ─── Build modifications object ───────────────────────────────────────────────

// Number of photo slots in the current template.
const TEMPLATE_PHOTO_SLOTS = 6;

export function buildModifications(opts: {
  photos?: string[];
  address?: string;
  price?: string;
  agentName?: string;
  brandName?: string;
  email?: string;
  phone?: string;
}): Record<string, string> {
  const mods: Record<string, string> = {};

  // Distribute photos across all template slots.
  // Fewer than 6 → loop/repeat; more than 6 → use the first 6.
  if (opts.photos && opts.photos.length > 0) {
    for (let i = 0; i < TEMPLATE_PHOTO_SLOTS; i++) {
      const url = opts.photos[i % opts.photos.length];
      if (url) mods[`photo-${i + 1}.source`] = url;
    }
  }

  if (opts.address)               mods['Addresstext.text']  = opts.address;
  if (opts.price)                 mods['Text.text']         = opts.price;
  const brand = opts.brandName ?? opts.agentName;
  if (brand)                      mods['Brand-Name.text']   = brand;
  if (opts.email)                 mods['Email.text']        = opts.email;
  if (opts.phone)                 mods['Phone-Number.text'] = opts.phone;

  return mods;
}
