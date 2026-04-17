// fal.ai image-to-video client
// Uses Kling v1.6 Standard for cinematic drone shots.
// All calls go through fal.ai's queue REST API — no SDK dependency needed.

const FAL_QUEUE_BASE = 'https://queue.fal.run';
const FAL_MODEL      = 'fal-ai/kling-video/v1.6/standard/image-to-video';

export const MAX_AI_VIDEOS = 3;

const FORMAT_TO_ASPECT_RATIO: Record<string, string> = {
  vertical:   '9:16',
  square:     '1:1',
  horizontal: '16:9',
};

export const DRONE_SHOT_PROMPT =
  'Smooth cinematic camera push slowly forward toward the property. ' +
  'Photorealistic architectural real estate photography, golden hour lighting. ' +
  'Ultra-stable motion, razor-sharp focus throughout, natural soft shadows. ' +
  'High-end property showcase with professional composition. ' +
  'Strict structural integrity — no morphing, no melting, no warping of walls or windows.';

const DRONE_SHOT_NEGATIVE_PROMPT =
  'blurry, low quality, pixelated, distorted, warped walls, melting architecture, ' +
  'wobbly motion, camera shake, flickering, overexposed, underexposed, ' +
  'lens flare artifacts, color banding, compression artifacts, watermark, text overlay.';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FalQueueSubmitResponse {
  request_id: string;
  status?: string;
  status_url: string;
  response_url: string;
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  error?: string;
}

interface FalResultResponse {
  video: {
    url: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
  };
}

export class FalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FalError';
  }
}

// ─── Key helper ───────────────────────────────────────────────────────────────

function getFalKey(): string {
  const key = process.env.FAL_KEY;
  if (!key) throw new FalError('FAL_KEY environment variable is not set');
  return key;
}

// ─── Core: submit one image → get back a video URL (polling) ─────────────────

// Sample vertical real-estate clip used when MOCK_AI=true
const MOCK_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4';

export async function generateDroneShot(
  imageUrl: string,
  customPrompt?: string,
  format: string = 'vertical',
  timeoutMs = 180_000,
): Promise<string> {
  if (process.env.MOCK_AI === 'true') {
    return MOCK_VIDEO_URL;
  }

  const key = getFalKey();

  const prompt = customPrompt
    ? `${customPrompt.trim()}. ${DRONE_SHOT_PROMPT}`
    : DRONE_SHOT_PROMPT;

  const aspectRatio = FORMAT_TO_ASPECT_RATIO[format] ?? '9:16';

  // 1. Submit to fal.ai queue
  const submitRes = await fetch(`${FAL_QUEUE_BASE}/${FAL_MODEL}`, {
    method:  'POST',
    headers: {
      Authorization:  `Key ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url:       imageUrl,
      prompt,
      negative_prompt: DRONE_SHOT_NEGATIVE_PROMPT,
      duration:        '5',
      aspect_ratio:    aspectRatio,
      cfg_scale:       0.5,
    }),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => submitRes.statusText);
    throw new FalError(`fal.ai submit error ${submitRes.status}: ${text}`);
  }

  const { request_id, status_url, response_url } = (await submitRes.json()) as FalQueueSubmitResponse;
  if (!request_id || !status_url || !response_url) {
    throw new FalError('fal.ai returned incomplete queue URLs');
  }

  // 2. Poll until COMPLETED or FAILED
  return pollForResult(request_id, status_url, response_url, key, timeoutMs);
}

// ─── Parallel: generate multiple drone shots, returns URL per index ───────────

export async function generateDroneShotsForIndices(
  images: string[],
  aiVideoIndices: number[],
  customPrompt?: string,
  format: string = 'vertical',
): Promise<Map<number, string>> {
  const clamped = clampAiIndices(aiVideoIndices, images.length);

  const results = await Promise.allSettled(
    clamped.map(async (idx) => {
      const videoUrl = await generateDroneShot(images[idx], customPrompt, format);
      return { idx, videoUrl };
    }),
  );

  const map = new Map<number, string>();
  for (const result of results) {
    if (result.status === 'fulfilled') {
      map.set(result.value.idx, result.value.videoUrl);
    } else {
      console.error('fal.ai generation failed for one index:', result.reason);
      // Non-fatal: indices that fail stay as images
    }
  }
  return map;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Enforce max AI_VIDEOS limit, dedupe, and keep only valid indices */
export function clampAiIndices(indices: number[], imageCount: number): number[] {
  return Array.from(new Set(indices))
    .filter((i) => Number.isInteger(i) && i >= 0 && i < imageCount)
    .sort((a, b) => a - b)
    .slice(0, MAX_AI_VIDEOS);
}

const FETCH_TIMEOUT_MS = 15_000;

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

async function pollForResult(
  requestId: string,
  statusUrl: string,
  responseUrl: string,
  key: string,
  timeoutMs: number,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  const POLL_MS  = 4_000;

  while (Date.now() < deadline) {
    await sleep(POLL_MS);

    let statusRes: Response;
    try {
      statusRes = await fetchWithTimeout(statusUrl, {
        headers: { Authorization: `Key ${key}` },
      });
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      console.warn(`fal.ai status fetch ${isAbort ? 'timed out' : 'failed'} for ${requestId}, retrying…`);
      continue;
    }

    if (!statusRes.ok) {
      console.warn(`fal.ai status poll ${statusRes.status} for ${requestId}, retrying…`);
      continue;
    }

    const statusData = (await statusRes.json()) as FalStatusResponse;

    if (statusData.status === 'COMPLETED') {
      const resultRes = await fetchWithTimeout(responseUrl, {
        headers: { Authorization: `Key ${key}` },
      });
      if (!resultRes.ok) {
        throw new FalError(`fal.ai result fetch failed ${resultRes.status} for ${requestId}`);
      }
      const resultData = (await resultRes.json()) as FalResultResponse;
      const url = resultData?.video?.url;
      if (!url) throw new FalError(`fal.ai returned no video URL for ${requestId}`);
      return url;
    }

    if (statusData.status === 'FAILED') {
      throw new FalError(
        `fal.ai generation failed for request ${requestId}: ${statusData.error ?? 'unknown error'}`,
      );
    }

    // IN_QUEUE or IN_PROGRESS — keep waiting
  }

  throw new FalError(`fal.ai timed out after ${timeoutMs / 1000}s for request ${requestId}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
