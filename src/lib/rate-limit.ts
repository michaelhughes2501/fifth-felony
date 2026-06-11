// NOTE: express-rate-limit is an Express middleware and cannot be used
// directly in Next.js App Router routes. The in-memory checkRateLimit
// function below is what the Next.js API routes actually use.

/**
 * Rate limit store for in-memory tracking (suitable for single-instance deployment)
 * For production with multiple instances, use Redis
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count < maxRequests) {
    entry.count++;
    return true;
  }

  return false;
}

export function getRateLimitStatus(key: string): { remaining: number; resetTime: number } {
  const entry = requestCounts.get(key);

  if (!entry) {
    return { remaining: 100, resetTime: Date.now() + 15 * 60 * 1000 };
  }

  const remaining = Math.max(0, 100 - entry.count);
  return { remaining, resetTime: entry.resetTime };
}
