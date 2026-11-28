// NOTE: express-rate-limit is an Express middleware and cannot be used
// directly in Next.js App Router routes. The in-memory checkRateLimit
// function below is what the Next.js API routes actually use.

/** Rate limit store for in-memory tracking (suitable for single-instance deployment)
 * For production with multiple instances, use Redis.
 */
type RateLimitEntry = {
  count: number;
  resetTime: number;
  maxRequests: number;
};

const requestCounts = new Map<string, RateLimitEntry>();
const MAX_ENTRIES = 10_000;

function evictExpired(now = Date.now()) {
  for (const [key, entry] of requestCounts) {
    if (now >= entry.resetTime) requestCounts.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  maxRequests = 100,
  windowMs = 15 * 60 * 1000,
): boolean {
  const safeMax = Math.max(1, Math.floor(maxRequests));
  const safeWindow = Math.max(1, Math.floor(windowMs));
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now >= entry.resetTime) {
    if (requestCounts.size >= MAX_ENTRIES) evictExpired(now);
    requestCounts.set(key, {
      count: 1,
      resetTime: now + safeWindow,
      maxRequests: safeMax,
    });
    return true;
  }

  if (entry.count >= entry.maxRequests) return false;

  entry.count += 1;
  return true;
}

export function getRateLimitStatus(
  key: string,
  maxRequests = 100,
  windowMs = 15 * 60 * 1000,
): { remaining: number; resetTime: number } {
  const safeMax = Math.max(1, Math.floor(maxRequests));
  const safeWindow = Math.max(1, Math.floor(windowMs));
  const entry = requestCounts.get(key);

  if (!entry) {
    return { remaining: safeMax, resetTime: Date.now() + safeWindow };
  }

  return {
    remaining: Math.max(0, entry.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}
