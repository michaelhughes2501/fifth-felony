# Daily Code Check — 2026-06-21 (Fifth_felony)

**Headline:** Confirmed the **root cause** of the recurring `next` downgrade — `npm audit fix --force` resolves the transitive `postcss<8.5.10` advisory by installing **`next@9.3.3`** (a major breaking downgrade). This run also produced direct evidence: `npm audit` explicitly prints *"Will install next@9.3.3, which is a breaking change."* That is the same regression that broke the 06-19/06-20 tree. The auto-dep agent (`depagent` / `.github/workflows/dependency-check.yml`) almost certainly invoked `--force` and triggered it. Source manifests are still correct (`next@^16.2.9`), but `node_modules/next` remains a broken husk that this sandbox cannot repair (Windows-mount denies `unlink`/`rename`). A native `npm ci` on Windows is required to finish recovery; long-term fix is to guard against `audit fix --force` ever running.

---

## 1. Git status (start of run)
Branch `master`, up to date with `origin/master`. No new commits since last run.

Working tree changes are unchanged from yesterday's run: `package.json` / `package-lock.json` already restored to the known-good committed `next@16.2.9` state (no diff vs HEAD). Pre-existing in-progress modifications still present in `src/**`, controllers, models, `lib/supabase-server.ts`, `proxy.ts`, `middleware.ts` (untouched), plus the agent scaffolding (`buildagent/`, `depagent/`, `pragent/`, `scanner/`, related `.github/workflows/`, `GATEWAY.md`).

The **stale `.git/index.lock`** (dated Jun 16) is still present and still cannot be removed from the sandbox (Windows mount denies the unlink). Clear it natively when no `git` process is running.

## 2. Type check — still blocked by broken `node_modules/next`
`npx tsc --noEmit` again produced ~60 errors, all of the same two kinds:
- `TS2307: Cannot find module 'next/server' | 'next/headers' | 'next/types.js' | 'next/link' | 'next/navigation' | 'next'` — across `middleware.ts`, every `src/app/api/**/route.ts`, layout/pages, components.
- `TS2591: Cannot find name 'process'. ... install '@types/node'` — pulled in as a cascade of the missing `next` types (the project does declare `@types/node@^25.9.3`; these errors disappear once `next` is reinstalled and the bundled triple-slash references resolve again).
- One real but unrelated type error remained surfaced: `src/app/dashboard/page.tsx(19,15): error TS18047: 'user' is possibly 'null'.` Left untouched this run since the rest of the type signal is still polluted by the missing-`next` cascade; will revisit once the tree is repaired.

`node_modules/next/` is still a partial husk: `app.js`, `dist/`, `font/`, and a stray nested `node_modules/postcss/` are present, but **`node_modules/next/package.json` is missing**, so Node/TypeScript resolution fails for every `next/*` subpath.

## 3. Dependencies — `npm outdated` and the smoking gun in `npm audit`
`npm outdated` (run despite the broken tree):
```
Package      Current  Wanted  Latest
@types/node   25.9.3  25.9.4  26.0.0
next         MISSING  16.2.9  16.2.9    ← node_modules/next has no package.json
openai        6.42.0  6.44.0  6.44.0
```

`npm audit` confirmed the regression mechanism:
```
postcss <8.5.10 — moderate (CVE GHSA-qx2v-qp2m-jg93)
  fix available via `npm audit fix --force`
  Will install next@9.3.3, which is a breaking change
  node_modules/next/node_modules/postcss
    next  9.3.4-canary.0 - 16.3.0-canary.5
```

That is exactly the downgrade that originally broke the tree: the only advisory is a transitive `postcss` pulled in by Next 16, and the only "fix" npm offers is to roll `next` all the way back to `9.3.3` — which any agent running `npm audit fix --force` will do automatically.

No upgrades or removals were applied this run — the tree is still mid-repair, so layering changes on top is unsafe.

## 4. Unused-dependency scan (static)
Cross-checked every declared dep against actual imports in `src/`, `middleware.ts`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`:
- **All declared deps are in use.** `@tailwindcss/postcss` + `autoprefixer` are wired through `postcss.config.mjs`; `react-dom` is required by Next at runtime; `postcss`/`tailwindcss`/`typescript` are toolchain peers. Nothing safe to remove.

## 5. Build — not run
`next build` cannot run while `node_modules/next` is broken (next CLI isn't installed). Will retry after the native install.

## 6. Why the sandbox still can't repair `node_modules`
- **Desktop Commander connector is not available** this run (no `mcp__desktop-commander__*` tools surfaced), so the preferred native execution path is offline.
- Inside the Linux sandbox against the Windows 9p mount, `npm install` **fails with `ENOTEMPTY` on `rename node_modules/next → node_modules/.next-XXXX`** (npm's atomic-install dance), and `rm -rf node_modules/next` returns `Operation not permitted` on every nested file — the mount denies unlink on directory contents. The same ENOTEMPTY scenario the scheduled-task brief warns about.
- A partial install did happen mid-run (new `app.js`, `font/` appeared inside `node_modules/next/`), but it never reached the final rename step, so `package.json` is still missing and the tree is still broken.

## 7. Left for the user / next native run
1. **Native install + verify** (PowerShell/CMD in `C:\FeloniousApps\1main\Fifth_felony`, or via Desktop Commander next run):
   ```
   rmdir /s /q node_modules\next     # or: Remove-Item -Recurse -Force node_modules\next
   npm ci                            # restores next@16.2.9 cleanly; manifests are already correct
   npx tsc --noEmit                  # expect ~1 real error: dashboard/page.tsx 'user is possibly null'
   npm run build                     # expect success on port 3002
   ```
2. **Stop the auto-downgrade loop.** Guard against `npm audit fix --force` ever running unattended:
   - Audit/`depagent/`, `.github/workflows/dependency-check.yml`, and Dependabot config for any `audit fix --force` invocation; replace with `audit fix` (no `--force`) which won't apply major downgrades.
   - Optionally add a CI guard: fail the workflow if `npm ls next` ever resolves to anything other than `next@16.x`.
   - Consider pinning `next` to an exact version (`"next": "16.2.9"`) until the bot is fenced.
3. **Clear `.git\index.lock`** (Jun 16 leftover; safe to delete when no git process is running).
4. **Fix the one real type error** surfaced this run: `src/app/dashboard/page.tsx:19` — narrow `user` before dereferencing (e.g., `if (!user) redirect('/login'); ...` or non-null assertion if already guaranteed upstream).
5. **Standing items (unchanged):** the 2 moderate `postcss` advisories will persist until Next ships a 16.x patch that bumps its bundled `postcss`. Do **not** "fix" them with `--force`. `@types/node` 26 major and the trivial `25.9.3 → 25.9.4` patch are still optional.

**No commits, pushes, deletions, or config changes were made.** Only non-destructive reads, the (failed) recovery `npm install` attempt, and this report.
