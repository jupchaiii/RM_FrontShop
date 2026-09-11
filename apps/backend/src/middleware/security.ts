import { Request, Response, NextFunction } from 'express';

/**
 * A handful of the response headers helmet would normally set. Written by
 * hand instead of pulling in the `helmet` package — this app runs on a
 * Raspberry Pi with a locked-down npm registry allowlist in some
 * environments, so keeping the dependency tree small and self-contained
 * matters more here than it would on a normal server.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  next();
}

interface RateLimitOptions {
  windowMs: number;
  limit: number;
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Minimal in-memory fixed-window rate limiter (no Redis, no extra
 * dependency — a single-instance Express process on a Pi doesn't need
 * more than this). Not meant to replace a real WAF/reverse-proxy rate
 * limit for anything internet-facing at scale, but enough to slow down
 * naive credential-stuffing against /api/auth/*.
 */
export function createRateLimiter(opts: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  // Periodic sweep so the map doesn't grow forever on a long-running process.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, opts.windowMs);
  sweep.unref();

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    res.setHeader('X-RateLimit-Limit', String(opts.limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, opts.limit - bucket.count)));

    if (bucket.count > opts.limit) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: opts.message ?? 'Too many requests, please try again later.' });
    }
    next();
  };
}
