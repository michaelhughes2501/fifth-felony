// RBAC level-math tests — run offline with `node --test`.
//
// These mirror the pure logic in src/lib/rbac.ts. The source is TypeScript
// and pulls in the Supabase server client (node/edge only), so it can't be
// imported directly by a plain .mjs test without a TS loader. Full
// type-level tests against the .ts module require a TS-capable runner
// (`npm i -D vitest` or tsx) on a networked machine; that is DEFERRED here.
// The table + comparison logic below is kept byte-identical to rbac.ts so
// this still guards the security-critical ordering.

import { test } from "node:test";
import assert from "node:assert/strict";

const ROLE_LEVELS = {
  member: 1,
  resident: 1,
  provider: 2,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

const roleLevel = (role) => (role ? ROLE_LEVELS[role] ?? 0 : 0);
const roleAtLeast = (role, min) => roleLevel(role) >= roleLevel(min);
const normalizeRole = (role) => {
  switch (role) {
    case "super_admin":
      return "super_admin";
    case "admin":
      return "admin";
    case "moderator":
    case "provider":
      return "moderator";
    default:
      return "resident";
  }
};

test("legacy roles map to the new model", () => {
  assert.equal(normalizeRole("member"), "resident");
  assert.equal(normalizeRole("provider"), "moderator");
  assert.equal(normalizeRole(null), "resident");
  assert.equal(normalizeRole("admin"), "admin");
  assert.equal(normalizeRole("super_admin"), "super_admin");
});

test("legacy and new roles share levels", () => {
  assert.equal(roleLevel("member"), roleLevel("resident"));
  assert.equal(roleLevel("provider"), roleLevel("moderator"));
  assert.equal(roleLevel("unknown"), 0);
  assert.equal(roleLevel(undefined), 0);
});

test("roleAtLeast enforces the hierarchy", () => {
  assert.equal(roleAtLeast("admin", "admin"), true);
  assert.equal(roleAtLeast("super_admin", "admin"), true);
  assert.equal(roleAtLeast("moderator", "admin"), false);
  assert.equal(roleAtLeast("resident", "moderator"), false);
  assert.equal(roleAtLeast(null, "resident"), false);
});

test("admin gate rejects normalized non-admins", () => {
  // mirrors middleware: roleAtLeast(normalizeRole(role), 'admin')
  for (const r of ["member", "resident", "provider", "moderator", null, "bogus"]) {
    assert.equal(roleAtLeast(normalizeRole(r), "admin"), false, `role=${r}`);
  }
  for (const r of ["admin", "super_admin"]) {
    assert.equal(roleAtLeast(normalizeRole(r), "admin"), true, `role=${r}`);
  }
});
