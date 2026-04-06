/**
 * Creatomate API client — wraps the Render API.
 * Modifications must be sent as a plain object { "element-name": "value" }
 * not as an array. The API returns status "planned" not "queued".
 */

// ─── Types ───────────────────────────────────────────────────────────────────

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

  if (req.webhookUrl) payload.webhook_url = req.webhookUrl;
  if (req.metadata)   payload.metadata    = req.metadata;

  const res = await fetch('https://api.creatomate.com/v1/renders', {
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

  // API returns an array with one item
  const json = await res.json() as CreatomateRenderResponse[];
  const render = json[0];

  if (!render?.id) {
    throw new CreatomateError('Creatomate returned an empty response');
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

export function buildModifications(opts: {
  photos?: string[];
  address?: string;
  price?: string;
  agentName?: string;
  brandName?: string;
}): Record<string, string> {
  const mods: Record<string, string> = {};

  if (opts.photos) {
    opts.photos.forEach((url, i) => {
      if (url) mods[`photo-${i + 1}`] = url;
    });
  }

  if (opts.address)   mods['Addresstext'] = opts.address;
  if (opts.price)     mods['Pricetext']   = opts.price;
  if (opts.agentName) mods['Agent-Name']  = opts.agentName;
  if (opts.brandName) mods['Brand-Name']  = opts.brandName;

  return mods;
}
