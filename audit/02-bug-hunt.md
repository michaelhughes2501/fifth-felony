# 02 — Bug Hunt

## Confirmed bugs

### B1 — `.gitignore` Windows separator
- **File:** `.gitignore`
- **Fix:** POSIX slash. **Applied in this pass.**

### B2 — 12 dated `daily-code-check-*.md` reports tracked
- **Files:** `daily-code-check-2026-06-16.md` … `daily-code-check-2026-07-01.md` (12 files)
- **Symptom:** These are outputs of the `daily-code-check` skill — dated ephemera, not source. They accumulate on every run and clutter the root.
- **Fix:** Delete + gitignore. **Applied in this pass.**

### B3 — `lint` script does not lint
- **File:** `package.json` (line 9)
- **Symptom:** `"lint": "tsc --noEmit"` — same pattern as siblings. Next.js apps get `eslint-config-next` free; here it's missing.
- **Fix:** Add `eslint` + `eslint-config-next`; rename current script to `typecheck`. Not applied.

## Latent bugs

### L1 — Three plausible SQL schema files
- **Files:** `20240520000000_setup_schema.sql` (root), `supabase/schema.sql`, `supabase/migrations/*` (folder contents unknown from shallow read).
- **Symptom:** Ambiguity — which is canonical? Root has the Supabase migration-timestamp naming (`20240520000000_...`) but should live under `supabase/migrations/`. `supabase/schema.sql` is a common "current state" artefact. If they diverge, applying any one produces a different DB.
- **Fix:** Move the root file into `supabase/migrations/`. Verify against `supabase/schema.sql`. Not applied — moving a schema file without owner sign-off is risky.

### L2 — `_commit.ps1`, `_verify.ps1` at root
- **Files:** `_commit.ps1`, `_verify.ps1`
- **Symptom:** Windows-specific PowerShell dev utilities. Not part of the app; not needed on CI Linux runners. Underscore prefix suggests "private / dev only".
- **Fix:** Move to `scripts/dev/` or delete. Not applied — could be intentional local workflow.

### L3 — No ESLint config
- **Files:** none (missing)
- **Symptom:** `eslint-config-next` is not installed. Contributors get no hook-rule enforcement, no Next.js-specific lint (e.g. `<Link>` vs `<a href>`), no unused-import warnings.
- **Fix:** Add. Not applied.

### L4 — `agent-reports/*.json` tracked
Same smell as siblings.

### L5 — `node --test` runs no tests today
- **File:** `package.json` (line 12)
- **Symptom:** `node --test` runs Node's built-in test runner. If no `*.test.js`/`*.test.ts` files exist under `src/`, it exits 0 (silent green). Verify.

## Not-a-bug

- **`middleware.ts` placeholder detection** — deliberately keeps dev running without Supabase envs. Do not "clean up".
- **`overrides.next.postcss`** in package.json — deliberate Next 16 workaround. Do not remove.
- **`postinstall: node scripts/patch-postcss.mjs`** — deliberate. Do not remove.

## Nothing else surfaced

Middleware, RBAC lib, controllers/models split all look intentional and well-commented on shallow read. Any real bug hunt requires reading `src/app/` route handlers + the OpenAI integration path.
