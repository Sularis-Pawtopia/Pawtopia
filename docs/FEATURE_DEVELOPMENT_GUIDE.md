# Feature Development Guide

This guide is the baseline checklist for adding new features safely in Pawtopia.

## 1) Architecture Rules (Non-Negotiable)

- Keep client components API-first.
- Do not import server actions directly in client components.
- Use `callApiAction(domain, action, args)` for client-to-server calls.
- Keep API routes (`app/api/*`) as thin handlers.
- Keep domain logic in server services (`lib/server/services/*`) when complexity grows.
- Keep server action files (`lib/actions/*`) as thin adapters (revalidation, redirects, orchestration).

## 2) API Contract Rules

- Every new domain action must be added to `lib/api/contracts.ts`.
- Add action name under the correct domain map.
- Add argument tuple typing (even if broad first).
- Prefer tightening argument types over time; avoid `unknown[]` for critical flows.
- Keep action names stable once shipped to avoid frontend regressions.

## 3) Security and Authorization Checklist

Before merging any feature, verify all of the following:

- Authentication: anonymous users cannot invoke protected operations.
- Ownership: users can only modify records they own unless role allows otherwise.
- Role checks: privileged actions enforce correct role and verification status.
- RLS: table has RLS enabled and policies match intended behavior.
- Storage policies: bucket/object policies are least-privilege.
- No public sensitive files: verification docs and IDs must never require public URLs.
- Input validation: reject malformed IDs, empty required fields, and invalid transitions.

## 4) Storage/File Upload Rules

- Sensitive files must be stored as object paths (not public URLs) in DB.
- Use private buckets for sensitive documents.
- Render sensitive files through signed or proxied authenticated URLs.
- Ensure upload path includes user ownership segment and policy enforces it.
- Validate file size/type both client-side and policy-side.

## 5) Onboarding and Role Routing Rules

- Every onboarding page must:
- Require authenticated user.
- Reject mismatched role for that onboarding route.
- Redirect verified users away from onboarding.
- Keep role-to-route mapping centralized per page or shared util.

## 6) Data and Schema Changes

- Every schema/security change must be in a new additive migration.
- Never edit old migrations after they are applied/shared.
- Include `DROP POLICY IF EXISTS` before replacing policies.
- Prefer explicit, narrow policy names and conditions.
- Run local migration replay after changes (`supabase db reset`).

## 7) Frontend State and Type Safety

- Assume API returns are untrusted until typed/narrowed.
- Guard optional fields before state updates.
- Avoid implicit `any`; use explicit types at call sites.
- Keep optimistic updates resilient to API failure.

## 8) Testing and Validation Workflow

Minimum validation before commit:

- Run TypeScript diagnostics and fix new errors.
- Smoke test key flows touched by your change.
- Verify role-based redirects and authorization edge cases.
- For migration changes, run local DB reset and policy checks.

Recommended command sequence:

1. `pnpm typecheck` (or workspace diagnostics)
2. `pnpm lint` (if configured)
3. `npx supabase db reset` (when migrations/policies changed)
4. Manual role-flow smoke test (regular user, adopter, shelter, ngo, dvmf)

## 9) Definition of Done for New Features

A feature is done only if:

- Architecture follows API-first split.
- Security checks are complete (auth, ownership, role, RLS/storage).
- Types are safe for new API calls.
- Migrations are additive and replay cleanly.
- Affected user flows are manually smoke-tested.
- Docs are updated (README or docs folder) when behavior changes.

## 10) Common Anti-Patterns to Avoid

- Client component importing from `lib/actions/*`.
- Public URL usage for private documents.
- Missing ownership checks in update/delete actions.
- Role checks only in UI but not in server logic.
- Updating old migrations instead of creating new ones.
- Broad storage SELECT policies without clear reason.

## 11) Feature PR Template (Quick Copy)

Use this in your PR description:

- Scope: what feature was added
- API changes: new domain/action names and contracts
- Security: auth/ownership/role/RLS/storage changes
- Migration(s): filenames and purpose
- UX impact: routes/components touched
- Validation: diagnostics/tests/manual checks performed
- Risks/Follow-ups: anything deferred

---

If unsure during implementation, default to the safer option:

- deny access by default,
- keep logic server-side,
- and require explicit policy/guard for each privileged action.
