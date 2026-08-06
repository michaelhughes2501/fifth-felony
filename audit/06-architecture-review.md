# 06 — Architecture Review

## Current shape

```
fifth-felony/                     (Next.js 16 app-directory)
├── middleware.ts                 ← security headers + auth guard
├── next.config.mjs
├── next-env.d.ts
├── proxy.ts                      ← (at root, not sure of role)
│
├── src/
│   ├── app/                      ← Next.js route handlers + pages
│   ├── components/               ← shared UI
│   ├── controllers/              ← business logic (uncommon in Next.js)
│   ├── models/                   ← domain models
│   ├── lib/                      ← utilities (incl. rbac.ts)
│   ├── types/
│   └── proxy.ts (?)              ← (verify)
│
├── supabase/
│   ├── migrations/
│   ├── schema.sql
│   └── seed.sql
│
├── 20240520000000_setup_schema.sql  ← ambiguous (see B/L1)
│
├── gateway/next-core.mjs         ← Next-flavoured gateway
│
├── Dockerfile / Dockerfile.dev / docker-compose.yml
│
├── buildagent/ depagent/ pragent/ scanner/  ← meta-tooling
│
└── scripts/patch-postcss.mjs     ← postinstall workaround
```

## Notable design choice — controllers + models

Most Next.js apps put business logic in server-actions or route handlers. This app has explicit `controllers/` and `models/` directories, MVC-style. That's a defensible choice — it means route handlers stay thin and testable — but it's not idiomatic Next.js. Anyone joining should know.

## Cross-cutting

- **Security headers in middleware** — the right place.
- **RBAC in `lib/rbac.ts`** — centralised.
- **Placeholder detection** — dev-friendly.
- **Meta-tooling** — same shape as siblings.

## Recommendations

1. Consolidate the three plausible schema files.
2. Document the controllers/models convention in README (or CLAUDE.md if you add one).
3. Add CSP to middleware.
4. Verify `proxy.ts` (at both root and src?) — is it duplicated?

## Verdict

Most sophisticated app in the sweep. The one architectural clarification worth doing is documenting the controllers/models convention so newcomers understand why they exist.
