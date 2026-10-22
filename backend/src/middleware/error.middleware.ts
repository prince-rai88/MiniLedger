import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  if (err instanceof Error) {
    console.error(`[Error] ${err.message}`);
    res.status(500).json({ error: err.message || 'Internal server error' });
    return;
  }

  console.error('[Unknown Error]', err);
  res.status(500).json({ error: 'Internal server error' });
}
