// Lightweight in-memory limiter for a single Next.js instance.
// For multi-instance production deployments, replace the store with a shared
// Redis/Edge Config implementation.

type RateLimitEntry = { count: number; resetTime: number };

const requestCounts = new Map<string, RateLimitEntry>();
const MAX_ENTRIES = 10_000;

function evictExpired(now = Date.now()): void {
  for (const [key, entry] of requestCounts) {
    if (now >= entry.resetTime) requestCounts.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  maxRequests = 100,
  windowMs = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now >= entry.resetTime) {
    if (requestCounts.size >= MAX_ENTRIES) evictExpired(now);
    if (requestCounts.size >= MAX_ENTRIES) return false;
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count += 1;
  return true;
}

export function getRateLimitStatus(
  key: string,
  maxRequests = 100,
  windowMs = 15 * 60 * 1000
): { remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = requestCounts.get(key);
  if (!entry || now >= entry.resetTime) {
    return { remaining: maxRequests, resetTime: now + windowMs };
  }

  return {
    remaining: Math.max(0, maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}
