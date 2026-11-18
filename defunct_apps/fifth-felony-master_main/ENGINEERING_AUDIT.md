# Engineering Security Audit

## Scope and provenance

This implementation pass used the supplied `fifth-felony-master.zip` snapshot. It contains no Git metadata, so its relationship to `engineering-upgrade-2026-08`, `engineering-audit-phase2-2026-08`, PR #10, and PR #12 could not be verified. The audit should be rebased onto the current remote branch before merge.

## Changes in this pass

- Added strict Zod request schemas for jobs, housing, legal resources, community posts/replies, and applications; IDs are UUID-validated and server-managed fields are rejected.
- Restricted jobs, housing, and legal writes backed by the service-role client to authenticated `admin` or `provider` profiles.
- Kept application and community writes on the cookie-bound Supabase client; routes now reject malformed bodies and IDs before database work.
- Chat requests now accept user-authored messages only, with per-message and aggregate size bounds.
- Added a profile-role trigger, column-level update grants, owner-only profile reads, and a forward migration so users cannot promote themselves through direct PostgREST updates.
- Added admin/provider role checks for the admin page and made the profile API return only the authenticated user's profile.
- Marked server Supabase access as server-only and require a real service-role key before creating a privileged client.
- Sanitized PostgREST search terms, fixed lint/typecheck script semantics, added regression tests, and pinned CI actions to commit SHAs.

## Remaining review items

- Verify the admin/provider role model and migration against the live Supabase project before deployment.
- Review deployment-specific chat rate limiting: the current limiter is in-memory and relies on proxy headers; it is not a distributed abuse control.
- Check knowledge-base RPC grants and privacy expectations in the deployed database.
- Reconcile this snapshot with the latest branches/PRs before applying or publishing the changes.

## Validation record

Validation results are recorded in the handoff accompanying this document. Do not infer a successful check from its presence in CI configuration; only recorded command output counts.
