# 04 — Security Review

## Strengths

- **`middleware.ts` sets a full security-header set** on every response:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- **No CSP** in the visible middleware — should add. See below.
- **Supabase SSR + placeholder detection** — auth is server-side; dev without Supabase creds doesn't 500.
- **RBAC helpers** (`normalizeRole`, `roleAtLeast`) — centralised. Cannot bypass by string-comparison.
- **`.env.local.example` documents the client-vs-server variable split.**

## Concerns

### C1 — Missing CSP header
Every other security header is set, but CSP is not. Next 16 supports `Content-Security-Policy` via middleware. Add a starter policy (`default-src 'self'; script-src 'self' 'unsafe-inline'`; refine over time).

### C2 — OpenAI key exposure
`openai` is a runtime dep. The SDK reads `OPENAI_API_KEY` from `process.env` on the server. Fine as long as it's never used from a `use client` component. Confirm by searching `src/` for any `'use client'` file that imports `openai`.

### C3 — Placeholder-detection is by regex
`isPlaceholder = (v) => !v || /placeholder|REPLACE|your-project/i.test(v)`. A real Supabase project URL that happens to contain "REPLACE" or "your-project" would be treated as a placeholder and skip auth. Extremely unlikely, but worth a tighter check (e.g. env var `SUPABASE_ENABLED=true`).

### C4 — No CodeQL workflow
Compared to siblings. Add.

### C5 — `_commit.ps1` and `_verify.ps1` at root
PowerShell dev utilities. Not exploitable, but they leak the maintainer's OS convention (`C:\FeloniousApps\1main`). Move under `scripts/dev/` and gitignore the local layer if desired.

## Summary

Header hygiene ahead of every sibling. Missing pieces: CSP, CodeQL, and an ESLint pipeline that catches `<a href>` vs `<Link>` regressions.
