# 07 — Refactor Plan

## Phase A — Hygiene

### A1. (Done) Delete 12 dated `daily-code-check-*.md` reports
Done in this pass.

### A2. (Done) Fix `.gitignore` Windows separator + ignore `daily-code-check-*.md`
Done in this pass.

### A3. Move `20240520000000_setup_schema.sql` into `supabase/migrations/`
- Effort: 15 min + owner sign-off.

### A4. Move `_commit.ps1`, `_verify.ps1` under `scripts/dev/` (or delete)
- Effort: 5 min.

### A5. Add ESLint + `eslint-config-next`; rename `lint` → `typecheck`; new `lint` runs eslint
- Effort: 30 min.

### A6. Untrack `agent-reports/*.json`
- Effort: 10 min.

## Phase B — Security parity

### B1. Add CSP header in `middleware.ts`
- Effort: 45 min. Starter policy `default-src 'self'; script-src 'self' 'unsafe-inline';` — refine iteratively.

### B2. Add CodeQL, Codacy, DevSkim workflows (parity with siblings)
- Effort: 30 min.

### B3. Wire `@sentry/nextjs`
- Effort: 45 min.

## Phase C — Tests

### C1. Add Vitest + @testing-library/react + msw
- Effort: 45 min.

### C2. Write tests for `lib/rbac`, middleware, and OpenAI wrapper
- Effort: 4 hrs.

## Phase D — Docs

### D1. Add CLAUDE.md matching sibling conventions
- Effort: 1 hr.

### D2. Add docs/RUNBOOK.md
- Effort: 45 min.

## Effort estimate

| Phase | Steps | Effort |
|-------|-------|--------|
| A | 6 | ~1.5 hrs |
| B | 3 | ~2 hrs |
| C | 2 | ~5 hrs |
| D | 2 | ~2 hrs |
| **Total** | **13 PRs** | **~10 hrs** |

## Non-goals

- **Remove `controllers/models/`.** Deliberate MVC layering.
- **Downgrade Next 16 / React 19 / TS 6.** Cutting-edge stack is deliberate.
- **Move to Pages Router.** App directory is the shape.
