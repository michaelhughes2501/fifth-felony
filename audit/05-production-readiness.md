# 05 — Production-Readiness Review

## Checklist

| # | Requirement | State |
|---|-------------|-------|
| Reproducible install | `package-lock.json` present. |
| Env config docs | `.env.example` + `.env.local.example` — good. |
| Env config enforced | Placeholder detection in `middleware.ts` — creative. |
| Dependencies audited | Dependabot present. |
| Minimum test bar | `node --test` script; test files not audited. |
| CI enforcing tests | `ci.yml` present. |
| Observability | None (no Sentry). |
| Rate limiting | Not verified. |
| Security headers | **Excellent.** Six headers set in middleware. CSP missing. |
| Backup / restore | Supabase managed. Doc missing. |
| Migrations | Ambiguous — three possible schema locations (see B/L1). |
| Runbook | Absent. |

## Deploy

- **`Dockerfile` + `Dockerfile.dev` + `docker-compose.yml`** — full container story.
- **Next.js 16 app-directory** — Vercel is the canonical target; Docker path works too.

## Missing

- **CSP header.**
- **Sentry.**
- **CodeQL / Codacy / DevSkim workflows.**
- **Schema-location decision.**
- **Runbook.**

## Verdict

Strong deploy shape. Needs Sentry, CSP, and CI parity with siblings.
