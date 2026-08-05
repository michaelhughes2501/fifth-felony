# 01 — Deep Engineering Audit

## Snapshot

| Dimension | State |
|-----------|-------|
| Framework | Next.js `^16.2.9` with app-directory routing |
| React / TS | React 19.2.7, TypeScript 6.0.3 |
| Backend | Supabase SSR (`@supabase/ssr` 0.12) + `@supabase/supabase-js` 2.110 |
| AI | `openai` 6.45 (server-side, per package private structure) |
| CSS | Tailwind v4 (`tailwindcss` 4.3.2 + `@tailwindcss/postcss` 4.3.2) |
| Validation | Zod 4.4.3 |
| Middleware | `middleware.ts` — real security headers, placeholder-detection to keep dev running without Supabase |
| Layering | `src/{app, components, controllers, models, lib, types}` — real MVC-ish split |
| Deploy | `Dockerfile`, `Dockerfile.dev`, `docker-compose.yml` |
| Gateway | `gateway/next-core.mjs` — portable Next-flavoured gateway |
| CI | 5 workflows — `ci`, `security-scan`, `dependency-check`, `build-production`, `pr-agent`. No CodeQL, no Codacy, no DevSkim. |
| Docs | `README.md`, `START_HERE.md`, `SECURITY.md`, `GATEWAY.md`. |

## What works well

- **Security headers set in `middleware.ts`** — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS. All correct values, all applied per-request. Best security posture in the sweep for header hygiene.
- **Placeholder detection** in `middleware.ts`: when `NEXT_PUBLIC_SUPABASE_URL` matches `placeholder|REPLACE|your-project`, auth/RBAC are skipped so dev doesn't 500. The comment explains WHY (a 7-second connect timeout otherwise). This is genuinely thoughtful defensive engineering.
- **Real layering** — controllers, models, lib, types are separate directories. Not just the app-router folder.
- **`START_HERE.md`** — the right file to land on as a new dev. Rare and valuable.
- **`middleware.ts` uses RBAC helpers** (`normalizeRole`, `roleAtLeast` from `@/lib/rbac`) — role model is centralised.
- **`.env.local.example` in addition to `.env.example`** — the Next.js pattern for local overrides is explicit.
- **`overrides.next.postcss`** in `package.json` — pins postcss to work around a Next 16 issue. Real engineering.
- **`postinstall` runs `patch-postcss.mjs`** — same theme.

## Concrete gaps

### G1 — 12 dated `daily-code-check-*.md` files tracked
Rev noise. Deleted this pass.

### G2 — `.gitignore` Windows separator
Fixed this pass.

### G3 — Root `20240520000000_setup_schema.sql` overlaps with `supabase/migrations/` and `supabase/schema.sql`
Three plausible schema files. See [02-bug-hunt.md#l1](./02-bug-hunt.md). Owner decision needed; not fixed inline.

### G4 — `_commit.ps1` and `_verify.ps1` at root
Windows dev utilities. May be intentional (project runs from `C:\FeloniousApps\1main` per the daily-check reports). Not fixed inline; flagged.

### G5 — `lint` script is `tsc --noEmit`
Same anti-pattern as siblings. There is no ESLint / Biome configured. Real Next.js apps ship with `eslint-config-next` — add it.

### G6 — No CodeQL / Codacy / DevSkim workflows
Compared to siblings, missing static-analysis coverage. Add `codeql.yml` at minimum.

### G7 — `test` script is `node --test`
Node's built-in test runner. Works. No test files visible in `src/` from a shallow read. Verify.

### G8 — `agent-reports/*.json` tracked
Same smell as siblings.

## Verdict

Structurally the most advanced app in the sweep — Next.js 16 app-directory, real middleware security headers, layered MVC, gateway. What's needed is CI parity (add CodeQL / ESLint workflows) and the schema-location decision.
