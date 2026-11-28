// Fixed-window rate limiter for Next.js route handlers.
// This store is process-local; use a shared store (Redis/Upstash/etc.) for
// multi-instance production deployments.

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

function normalizeLimit(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

export function checkRateLimit(
  key: string,
  maxRequests = 100,
  windowMs = 15 * 60 * 1000,
): boolean {
  const safeMax = normalizeLimit(maxRequests, 100);
  const safeWindow = normalizeLimit(windowMs, 15 * 60 * 1000);
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now >= entry.resetTime) {
    if (requestCounts.size >= MAX_ENTRIES) {
      evictExpired(now);
      // If every entry is still active, drop the oldest key rather than
      // allowing unbounded memory growth under a spoofed-key attack.
      if (requestCounts.size >= MAX_ENTRIES) {
        const oldest = requestCounts.keys().next().value;
        if (typeof oldest === "string") requestCounts.delete(oldest);
      }
    }
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
  const safeMax = normalizeLimit(maxRequests, 100);
  const safeWindow = normalizeLimit(windowMs, 15 * 60 * 1000);
  const entry = requestCounts.get(key);

  if (!entry) {
    return { remaining: safeMax, resetTime: Date.now() + safeWindow };
  }

  return {
    remaining: Math.max(0, entry.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}
