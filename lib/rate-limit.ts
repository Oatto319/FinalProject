import { NextRequest } from 'next/server';

const buckets = new Map<string, { count: number; resetAt: number }>();

/** In-memory fixed-window rate limiter (per server process). Returns true if the call is allowed. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Opportunistic cleanup so the map doesn't grow unbounded over a long-running process.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Best-effort client IP. On Vercel uses x-vercel-forwarded-for (set by infra, not user-controllable).
 *  Elsewhere takes the LAST IP in X-Forwarded-For (added by our edge, not user-supplied). */
export function getClientIp(req: NextRequest): string {
  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0].trim();
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((s) => s.trim());
    return ips[ips.length - 1];
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}
