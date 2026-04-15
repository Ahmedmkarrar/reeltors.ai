import { Router, type Request, type Response } from 'express';
import { requireInternalSecret } from '../middleware/auth.js';
import { videoQueue } from '../queues/videoQueue.js';
import type { VideoJobPayload } from '../types/index.js';

export const generateRouter = Router();

function isValidPayload(body: unknown): body is VideoJobPayload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;

  if (typeof b.videoId !== 'string' || !b.videoId) return false;
  if (typeof b.userId !== 'string' || !b.userId) return false;
  if (!Array.isArray(b.images) || b.images.length < 1 || b.images.length > 15) return false;
  if (b.images.some((url) => typeof url !== 'string' || !url.startsWith('http'))) return false;
  if (!Array.isArray(b.aiIndices)) return false;
  if (typeof b.templateId !== 'string' || !b.templateId) return false;
  if (!['vertical', 'horizontal', 'square'].includes(b.format as string)) return false;
  if (typeof b.isPaidPlan !== 'boolean') return false;
  if (typeof b.isFree !== 'boolean') return false;

  return true;
}

generateRouter.post('/generate', requireInternalSecret, async (req: Request, res: Response) => {
  if (!isValidPayload(req.body)) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  try {
    const job = await videoQueue.add('render', req.body, {
      jobId: req.body.videoId,
    });

    res.status(202).json({ jobId: job.id });
  } catch (err) {
    console.error('[generate] failed to enqueue job:', err);
    res.status(500).json({ error: 'Failed to enqueue job' });
  }
});
