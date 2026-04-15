import { Router, type Request, type Response } from 'express';
import { videoQueue } from '../queues/videoQueue.js';
import type { JobStatusResponse } from '../types/index.js';

export const statusRouter = Router();

statusRouter.get('/status/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;

  if (!jobId || typeof jobId !== 'string') {
    res.status(400).json({ error: 'jobId is required' });
    return;
  }

  try {
    const job = await videoQueue.getJob(jobId);

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const state = await job.getState();

    const response: JobStatusResponse = {
      jobId: job.id ?? jobId,
      state,
      progress: job.progress,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };

    if (state === 'completed') response.result = job.returnvalue;
    if (state === 'failed') response.failedReason = job.failedReason;

    res.status(200).json(response);
  } catch (err) {
    console.error('[status] error fetching job:', err);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});
