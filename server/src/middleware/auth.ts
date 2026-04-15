import type { Request, Response, NextFunction } from 'express';

// matches the x-internal-secret pattern used by the Next.js app
export function requireInternalSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = (process.env.WEBHOOK_SECRET ?? '').replace(/[^\x20-\x7E]/g, '');

  if (!secret) {
    res.status(500).json({ error: 'Server misconfiguration: WEBHOOK_SECRET not set' });
    return;
  }

  const provided = req.headers['x-internal-secret'];

  if (!provided || provided !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
