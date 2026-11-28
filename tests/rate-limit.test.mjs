// Rate-limit behavior tests — run offline with `node --test`.

import { test } from "node:test";
import assert from "node:assert/strict";

function makeLimiter() {
  const hits = new Map();
  function checkRateLimit(key, max, windowMs, now) {
    const safeMax = Math.max(1, Math.floor(max));
    const safeWindow = Math.max(1, Math.floor(windowMs));
    const entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + safeWindow, maxRequests: safeMax });
      return true;
    }
    if (entry.count >= entry.maxRequests) return false;
    entry.count += 1;
    return true;
  }
  return { checkRateLimit };
}

test("allows up to max within the window", () => {
  const { checkRateLimit } = makeLimiter();
  const t0 = 1000;
  for (let i = 0; i < 3; i++) assert.equal(checkRateLimit("k", 3, 1000, t0), true);
  assert.equal(checkRateLimit("k", 3, 1000, t0), false);
});

test("resets after the window elapses", () => {
  const { checkRateLimit } = makeLimiter();
  const t0 = 1000;
  assert.equal(checkRateLimit("k", 1, 1000, t0), true);
  assert.equal(checkRateLimit("k", 1, 1000, t0), false);
  assert.equal(checkRateLimit("k", 1, 1000, t0 + 1001), true);
});

test("keys are independent", () => {
  const { checkRateLimit } = makeLimiter();
  const t0 = 1000;
  assert.equal(checkRateLimit("a", 1, 1000, t0), true);
  assert.equal(checkRateLimit("a", 1, 1000, t0), false);
  assert.equal(checkRateLimit("b", 1, 1000, t0), true);
});
