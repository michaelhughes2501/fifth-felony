# 03 — Dependency Audit

## Runtime

- `next ^16.2.9` — cutting-edge (v16 is very recent).
- `react`, `react-dom` `19.2.7` — current stable.
- `@supabase/ssr 0.12.0`, `@supabase/supabase-js 2.110.0` — matched pair for SSR auth.
- `openai 6.45.0` — server-side only per structure. v6 is the current OpenAI SDK line.
- `@tailwindcss/postcss 4.3.2` — Tailwind v4 pipeline.
- `zod 4.4.3` — current v4.

## Dev

- `@types/node 26.0.1` — same "Node 26 types + CI on 22" anomaly as siblings; reconcile.
- `@types/react`, `@types/react-dom` — matched.
- `autoprefixer 10.5.2`, `postcss 8.5.16`, `tailwindcss 4.3.2` — Tailwind v4 baseline.
- `typescript 6.0.3` — cutting-edge.

## Missing

- **`eslint` + `eslint-config-next`** — no ESLint at all. Add.
- **`@testing-library/react` + `jest`/`vitest`** — no test framework declared. `node --test` runs but no test files visible.
- **`@sentry/nextjs`** — no crash reporter.

## Overrides

`overrides.next.postcss = "8.5.16"` — deliberate. Do not remove.

## Actions

1. Add ESLint + eslint-config-next.
2. Add Vitest + @testing-library/react.
3. Reconcile `@types/node` version with CI runtime.
4. Confirm Next 16 + TS 6 + Tailwind v4 build passes cleanly on CI.
5. Consider `@sentry/nextjs` before real launch.
