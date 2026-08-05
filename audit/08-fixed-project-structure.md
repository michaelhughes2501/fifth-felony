# 08 — Fixed Project Structure

```
fifth-felony/
│
├── README.md
├── START_HERE.md                  ← existing
├── CLAUDE.md                      ← added (D1)
├── SECURITY.md                    ← existing
├── GATEWAY.md                     ← existing
├── LICENSE                        ← added
│
├── .gitignore                     ← POSIX + daily-code-check-*.md (fixed this pass)
├── .env.example / .env.local.example
├── .dockerignore                  ← existing
├── .editorconfig                  ← added
│
├── package.json                   ← + eslint scripts
├── package-lock.json
├── tsconfig.json
├── next.config.mjs                ← existing
├── next-env.d.ts                  ← existing
├── middleware.ts                  ← + CSP (B1)
├── proxy.ts                       ← (verify)
├── postcss.config.js              ← generated
├── tailwind.config.mjs            ← if used
│
├── Dockerfile / Dockerfile.dev / docker-compose.yml
│
├── scripts/
│   ├── patch-postcss.mjs          ← existing
│   └── dev/
│       ├── _commit.ps1            ← moved (A4)
│       └── _verify.ps1            ← moved (A4)
│
├── supabase/
│   ├── migrations/
│   │   ├── 20240520000000_setup_schema.sql  ← moved from root (A3)
│   │   └── ...
│   ├── schema.sql
│   └── seed.sql
│
├── src/
│   ├── app/                       ← Next.js app-router
│   ├── components/
│   ├── controllers/               ← existing MVC layer
│   ├── models/                    ← existing MVC layer
│   ├── lib/                       ← incl. rbac.ts
│   ├── types/
│   └── test/                      ← added (Phase C)
│
├── gateway/
│   └── next-core.mjs              ← existing
│
├── agent-reports/                 ← gitignored (A6)
│   └── .gitkeep
│
├── docs/
│   ├── code-health/               ← if daily-code-check output ever gets committed
│   ├── RUNBOOK.md                 ← added
│   └── ARCHITECTURE.md            ← optional
│
├── buildagent/ depagent/ pragent/ scanner/  ← meta-tooling
│
└── .github/
    ├── workflows/
    │   ├── ci.yml                 ← existing
    │   ├── security-scan.yml      ← existing
    │   ├── dependency-check.yml   ← existing
    │   ├── build-production.yml   ← existing
    │   ├── pr-agent.yml           ← existing
    │   ├── codeql.yml             ← added (B2)
    │   ├── codacy.yml             ← added (B2)
    │   └── devskim.yml            ← added (B2)
    ├── dependabot.yml             ← existing
    └── instructions/
        └── codacy.instructions.md ← existing (gitignored)
```

## Call-outs

- **12 daily-code-check files** — no longer tracked (deleted this pass; gitignored going forward).
- **Root `20240520000000_setup_schema.sql`** — moved into `supabase/migrations/`.
- **`_commit.ps1`, `_verify.ps1`** — under `scripts/dev/`.
- **`agent-reports/*.json`** — untracked.
