# Engineering Upgrade 09 — August 2026

## Scope
This pass reviewed the current `master` baseline and the merged production-repair work, with emphasis on browser security headers, CI permissions, dependency consistency, and production configuration.

## Applied

### Content Security Policy
`middleware.ts` now emits a baseline CSP covering:
- `default-src 'self'`
- `base-uri 'self'`
- `form-action 'self'`
- `frame-ancestors 'none'`
- `object-src 'none'`
- controlled image/font/style/script/connect sources
- Supabase HTTPS/WSS connections
- OpenAI API connections
- `upgrade-insecure-requests`

The policy retains `unsafe-inline` for compatibility with the existing Next.js/UI rendering model. A nonce-based CSP should be a later hardening step after the UI is migrated to nonce-safe rendering.

## Existing controls confirmed

- Production CI already declares least-privilege permissions.
- Security scan has `contents: read` and `pull-requests: write` because it publishes PR comments.
- API validation, rate limiting, RBAC, and ownership controls from earlier repair passes remain in place.
- Next.js was upgraded to 16.3.0 and PostCSS to 8.5.25 through the dependency update already merged.

## Remaining findings

### P1 — PostCSS override consistency
`package.json` currently declares PostCSS 8.5.25 but retains an `overrides.next.postcss` value of 8.5.16. The repository also contains `scripts/patch-postcss.mjs`, which was designed for older vulnerable nested PostCSS versions. These mechanisms should be reconciled in one dependency-only change and verified with a clean `npm ci`; this pass intentionally did not hand-edit the lockfile.

### P2 — Third-party action pinning
The production workflows use explicit read/write permissions, but several workflow actions remain on mutable major tags (`actions/checkout@v4`, `actions/setup-node@v4`, etc.). Pinning all third-party actions to immutable commit SHAs is recommended for stronger supply-chain protection. The repository already addressed this for the previously identified release action.

### P2 — Playground workflows
The security scanner previously identified missing explicit permissions in `playground/.github/workflows/build.yml` and `playground/.github/workflows/security.yml`. These are non-production playground workflows and should either be removed from the repository or brought to the same least-privilege standard before the playground is treated as deployable code.

### Verification gate
This branch must pass the repository's CI quality sequence before its changes are considered production-verified:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`

No claim of a successful production build is made until GitHub Actions reports success.
