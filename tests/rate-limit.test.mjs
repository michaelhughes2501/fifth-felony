import { test } from "node:test";
import assert from "node:assert/strict";

function makeLimiter() {
  const hits = new Map();
  function checkRateLimit(key, max, windowMs, now) {
    const entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= max) return false;
    entry.count += 1;
    return true;
  }
  return { checkRateLimit };
}

test("allows exactly max requests within the window", () => {
  const { checkRateLimit } = makeLimiter();
  const t0 = 1000;
  for (let i = 0; i < 3; i++) {
    assert.equal(checkRateLimit("k", 3, 1000, t0), true, `hit ${i}`);
  }
  assert.equal(checkRateLimit("k", 3, 1000, t0), false);
});

test("resets at the exact window boundary", () => {
  const { checkRateLimit } = makeLimiter();
  const t0 = 1000;
  assert.equal(checkRateLimit("k", 1, 1000, t0), true);
  assert.equal(checkRateLimit("k", 1, 1000, t0), false);
  assert.equal(checkRateLimit("k", 1, 1000, t0 + 1000), true);
});

test("keys are independent", () => {
  const { checkRateLimit } = makeLimiter();
  const t0 = 1000;
  assert.equal(checkRateLimit("a", 1, 1000, t0), true);
  assert.equal(checkRateLimit("a", 1, 1000, t0), false);
  assert.equal(checkRateLimit("b", 1, 1000, t0), true);
});
