// Rate-limit window tests — run offline with `node --test`.
//
// Mirrors the fixed-window logic in src/lib/rate-limit.ts (TS, so not
// directly importable here without a TS loader — see rbac.test.mjs note).
// Uses an injectable clock so the window can be advanced without real waits.

import { test } from "node:test";
import assert from "node:assert/strict";

function makeLimiter() {
  const hits = new Map();
  // now() is injected so tests are deterministic.
  function checkRateLimit(key, max, windowMs, now) {
    const entry = hits.get(key);
    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= max) return false;
    entry.count += 1;
    return true;
  }
  return { checkRateLimit };
}

test("allows up to max within the window", () => {
  const { checkRateLimit } = makeLimiter();
  const t0 = 1000;
  for (let i = 0; i < 3; i++) {
    assert.equal(checkRateLimit("k", 3, 1000, t0), true, `hit ${i}`);
  }
  assert.equal(checkRateLimit("k", 3, 1000, t0), false, "4th blocked");
});

test("resets after the window elapses", () => {
  const { checkRateLimit } = makeLimiter();
  const t0 = 1000;
  assert.equal(checkRateLimit("k", 1, 1000, t0), true);
  assert.equal(checkRateLimit("k", 1, 1000, t0), false);
  // advance past the window
  assert.equal(checkRateLimit("k", 1, 1000, t0 + 1001), true);
});

test("keys are independent", () => {
  const { checkRateLimit } = makeLimiter();
  const t0 = 1000;
  assert.equal(checkRateLimit("a", 1, 1000, t0), true);
  assert.equal(checkRateLimit("a", 1, 1000, t0), false);
  assert.equal(checkRateLimit("b", 1, 1000, t0), true);
});
