# 08 — Full Engineering Audit & Upgrade Pass

## Scope

This audit covers the current `master` tree and the `production-repair-2026-08` repair branch. It focuses on production correctness, API hardening, authentication/RBAC boundaries, Supabase behavior, rate limiting, CI, tests, and maintainability.

## Findings and actions

### P0 — Production safety
- **Service-role credential handling:** `createServiceClient()` previously supplied a placeholder service-role key when the secret was absent. The repair now fails closed for service-role operations instead of constructing a privileged client with a fake credential.
- **API request validation:** Chat and assistant endpoints now validate request payloads with Zod and reject malformed/oversized input.
- **Rate-limit accounting:** The in-memory limiter now has explicit capacity behavior and consistent boundary semantics.

### P1 — Authentication / authorization
- Existing middleware protects `/dashboard`, `/admin`, and `/applications` and checks admin RBAC for `/admin`.
- Existing `lib/rbac.ts` provides normalized legacy role mapping and `requireRole()` for API guards.
- Keep authorization checks server-side; do not rely on client UI visibility.

### P1 — CI / quality gates
- CI now runs lint, typecheck, tests, and production build in sequence.
- Node 22 is used consistently in CI.
- The existing Next.js major-version guard remains in place.

### P1 — Testing
- Rate-limit tests were aligned with implementation at the exact reset boundary.
- Continue expanding coverage for RBAC, middleware, request validation, conversation ownership, and AI failure paths.

### P2 — Architecture
- Preserve the existing MVC controller/model layering; avoid a high-risk wholesale feature-folder rewrite.
- Continue extracting shared validation, authentication, and infrastructure concerns into `src/lib`.
- Keep route handlers thin and delegate domain behavior to controllers/services.

### P2 — Operational hardening
- The current in-memory limiter is appropriate only for a single runtime instance. Multi-instance production should use a shared store such as Redis/Edge Config.
- Add structured logging and external error monitoring before high-volume deployment.
- Add database migration discipline and verify RLS policies for every user-owned table.

## Remaining verification gate

The repository must not be declared fully production-verified until GitHub Actions reports successful lint, typecheck, tests, and build for the repair branch. The connector can inspect repository state and CI configuration, but the actual Actions log output is the authoritative runtime verification.

## Non-goals

- No downgrade of the deliberate Next.js 16 / React 19 / TypeScript 6 stack.
- No migration away from the App Router.
- No unnecessary replacement of the existing MVC architecture.
