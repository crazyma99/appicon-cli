import type { Request, Response, NextFunction } from 'express';
import { validateApiKey } from '../db.js';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    res.status(401).json({ error: 'Missing X-API-Key header' });
    return;
  }

  if (!validateApiKey(apiKey)) {
    res.status(403).json({ error: 'Invalid or disabled API key' });
    return;
  }

  next();
}
