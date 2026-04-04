<<<<<<< HEAD
/**
 * Creatomate API client — wraps the Render API.
 */
=======
const CREATOMATE_API_URL = 'https://api.creatomate.com/v1';
>>>>>>> 40fcd39 (fix: AI drone shot pipeline (v1 API, output_format, default indices))

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreatomateRenderRequest {
  templateId: string;
  modifications: Array<{ find: string; value: string }>;
  webhookUrl?: string;
  metadata?: Record<string, string>;
}

export interface CreatomateRenderResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  outputUrl?: string;
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
  modifications: Array<{ find: string; value: string }>;
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
    payload.metadata = req.metadata;
  }

  const res = await fetch('https://api.creatomate.com/v1/renders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new CreatomateError(`HTTP ${res.status}: ${text}`, res.status);
  }

  const json = (await res.json()) as {
    id: string;
    status: string;
    output?: { url: string };
    error?: string;
  };

  return {
    id: json.id,
    status: json.status as CreatomateRenderResponse['status'],
    outputUrl: json.output?.url,
    error: json.error,
  };
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

  const json = (await res.json()) as {
    id: string;
    status: string;
    output?: { url: string };
    error?: string;
  };

  return {
    id: json.id,
    status: json.status as CreatomateRenderResponse['status'],
    outputUrl: json.output?.url,
    error: json.error,
  };
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
  const modifications = buildModifications({
    photos:    opts.images,
    address:   opts.listingAddress,
    price:     opts.listingPrice,
    agentName: opts.agentName,
  });

  return createRender({
    templateId:  opts.templateId,
    modifications,
    webhookUrl:  opts.webhookUrl,
    metadata:    opts.metadata,
  });
}

export async function generateMixedMediaVideo(opts: GenerateMixedMediaOptions): Promise<CreatomateRenderResponse> {
  const templateId = process.env.CREATOMATE_TEMPLATE_CINEMATIC ?? '';
  if (!templateId) throw new CreatomateError('CREATOMATE_TEMPLATE_CINEMATIC is not set');

  const modifications = buildModifications({
    photos:    opts.mediaItems.map((m) => m.url),
    address:   opts.listingAddress,
    price:     opts.listingPrice,
    agentName: opts.agentName,
  });

  return createRender({
    templateId,
    modifications,
    webhookUrl: opts.webhookUrl,
    metadata:   opts.metadata,
  });
}

// ─── Build modifications from user inputs ──────────────────────────────────

/** Maps user input to Creatomate dynamic element names */
export function buildModifications(opts: {
  photos?: string[];         // photo-1, photo-2, ...
  address?: string;
  price?: string;
  agentName?: string;
  brandName?: string;
}): Array<{ find: string; value: string }> {
  const mods: Array<{ find: string; value: string }> = [];

  if (opts.photos) {
    opts.photos.forEach((url, i) => {
      if (url) mods.push({ find: `photo-${i + 1}`, value: url });
    });
  }

  if (opts.address)  mods.push({ find: 'Addresstext', value: opts.address });
  if (opts.price)    mods.push({ find: 'Pricetext',   value: opts.price });
  if (opts.agentName) mods.push({ find: 'Agent-Name', value: opts.agentName });
  if (opts.brandName)  mods.push({ find: 'Brand-Name',  value: opts.brandName });

  return mods;
}
