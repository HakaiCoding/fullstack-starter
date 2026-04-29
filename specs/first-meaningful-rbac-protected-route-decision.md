# Feature Spec (Core Change)

## Feature/Change Name
- name: First live RBAC-protected route - admin-only users listing baseline

## Date
- yyyy-mm-dd: 2026-04-25

## Status
- Accepted
- lifecycle note:
  - this spec records both the accepted route decision and the implemented baseline behavior on `GET /api/v1/users`.
  - accepted decision is logged in [`../DECISIONS.md`](../DECISIONS.md) (`2026-04-25 - Use GET /api/v1/users as first live RBAC route`).
  - covered `401/403` error-envelope stability is now defined globally by [`stable-api-error-response-contract-baseline.md`](./stable-api-error-response-contract-baseline.md).

## Problem
- before this slice, RBAC existed as primitives but lacked one real protected endpoint with end-to-end allow/deny verification.
- without a live protected route, RBAC correctness could be claimed without proving route-level behavior.
### Current accepted state
- `GET /api/v1/users` is the first live RBAC-protected route.
- route policy is implemented and verified: unauthenticated `401`, authenticated `user` `403`, authenticated `admin` `200`.
- response contract is implemented and verified: `{ users: UserListItem[] }` with fields `id`, `email`, `displayName`, `role`.
- deterministic ordering is implemented and verified: `createdAt DESC`, tie-breaker `id ASC`.

## Non-Goals
- product-domain features beyond admin-only user listing baseline.
- full user management UI.
- create/update/delete user endpoints.
- permissions matrix or expanded IAM model.
- ownership/self-access policy rollout.
- JWT/session/auth-flow redesign.
- persistence model redesign.
- adding new roles.
- query-parameter contract for pagination/filtering/sorting in this slice.
- paginated envelope/meta contract in this slice.
- strict custom `401`/`403` error-body schema in this slice.

## Behavior Rules
- route scope for this slice: `GET /api/v1/users`.
- authorization policy:
  - no auth -> `401`
  - auth role `user` -> `403`
  - auth role `admin` -> `200`
- ownership rules remain out of scope for this route.
- role source-of-truth and token-role claim semantics remain unchanged from existing baseline.
- `200` response contract:
  - body shape is `{ users: UserListItem[] }`.
  - `UserListItem` contains only `id`, `email`, `displayName`, `role`.
  - sensitive fields (including `passwordHash` and auth/session artifacts) are excluded.
- list semantics:
  - no pagination/filter/sort query contract is introduced in this slice.
  - route returns full list visible to `admin` for this baseline.
  - ordering is deterministic (`createdAt DESC`, `id ASC` tie-breaker).
- error response contract:
  - status codes `401` and `403` are the required public contract.
  - response body for covered baseline `401`/`403` cases follows the stable global error envelope contract.

## Forbidden Behavior
- demo-only or fake protected endpoints unrelated to this approved route.
- protecting health/readiness endpoints to claim RBAC completion.
- role-specific hardcoded exceptions outside declared policy.
- implementing ownership rules in this slice.
- changing JWT algorithm/session strategy/persistence schema as part of this scope.
- placing durable authorization policy in UI or unrelated utility layers.

## Affected Domains/Modules
- domains:
  - API transport authorization.
  - user-read administration behavior (minimal baseline).
- modules/files likely affected:
  - `apps/api/src/app/features/users/*`
  - `apps/api/src/app/app.module.ts`
  - `apps/api/src/app/features/auth/*` (guard/decorator reuse only; no auth-flow redesign)
  - `apps/api-e2e/src/api/*` (allow/deny, payload-shape, ordering assertions)
- related docs:
  - `DECISIONS.md`
  - `ARCHITECTURE.md`
  - `specs/role-persistence-jwt-claim-rbac-baseline.md`

## Design Placement Summary
- where logic should live and why:
  - controller in API transport layer for route mapping + guard/decorator application.
  - service in API domain layer for user listing orchestration + output shaping.
  - data access in persistence layer through TypeORM user repository/entity.
- where logic should not live:
  - web app components/templates.
  - auth/session core flow (except existing guard/decorator reuse).
  - shared utils as a home for RBAC/domain policy.

## Relevant Local Skills
- skills inspected:
  - `nestjs-best-practices`
  - `jwt-security`
  - `typeorm`
- skills used:
  - `nestjs-best-practices`
  - `jwt-security`
  - `typeorm`
- why each skill is relevant:
  - supported guard-based authorization, response-shape boundaries, and deterministic query behavior.
- conflicts/tensions with project docs/spec:
  - `jwt-security` generally prefers asymmetric signing; project baseline remains accepted HS256.
- project-compatible decision:
  - keep accepted JWT/session baseline unchanged and implement route-level RBAC on approved endpoint only.

## Edge Cases
- empty users table returns `200` with empty list for admin.
- response excludes sensitive data such as password hashes.
- stale token-role behavior follows accepted baseline (claim trusted until expiry; changes apply on next issuance).
- invalid token/auth context on this route returns `401`, not `403`.
- users sharing identical `createdAt` timestamps still return deterministically using `id ASC` tie-break.

## Risks
- risk 1 and mitigation:
  - risk: scope creep into broader user-management product features.
  - mitigation: strict non-goals (read-only list only; no CRUD/UI/ownership rollout).
- risk 2 and mitigation:
  - risk: sensitive user-field leakage.
  - mitigation: explicit payload-shaping rules and e2e payload assertions.
- risk 3 and mitigation:
  - risk: accidental auth baseline changes while wiring guards.
  - mitigation: keep auth/session semantics unchanged and run auth/security regressions.

## Test Plan
- unit tests:
  - controller/service coverage for admin-only list behavior.
  - guard integration coverage for required role metadata.
- integration/e2e tests:
  - allow/deny matrix for `GET /api/v1/users` (`401` unauthenticated, `403` non-admin, `200` admin).
  - payload assertions on `200`:
    - `{ users: [...] }` envelope.
    - each user item includes only `id`, `email`, `displayName`, `role`.
    - deterministic ordering (`createdAt DESC`, `id ASC` tie-break).
    - sensitive fields excluded.
  - payload assertions on `401`/`403`:
    - assert status-code contract.
    - do not lock to framework error-body text.
- regression coverage:
  - existing auth flow behavior remains intact (`login`, `refresh`, `logout`, `auth/me`).
- anti-hack coverage for behavior changes (general rule coverage, not only the shown example):
  - reject example-specific patches.
  - reject hardcoded special cases when the real rule is broader.
  - reject wrong-layer business-rule placement.

## Required Gates
Use commands from [`../docs/commands-reference.md`](../docs/commands-reference.md).
- tiny/local gates (if applicable):
  - n/a (core change implementation scope).
- normal implementation gates (if applicable):
  - n/a (core change implementation scope).
- core gates:
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e`
  - `npx nx e2e web-e2e` (if web behavior/contracts are affected)
- additional domain gates (if applicable):
  - auth/security overlay:
    - `npx nx run api:lint`
    - `npx nx run api:test`
    - `npx nx run api:build`
    - `npx nx e2e api-e2e`
- manual/proposed checks:
  - confirm placement against `ARCHITECTURE.md`.
  - confirm policy/spec compliance against `AI_CONTRACT.md`.
  - confirm no JWT/session/persistence redesign introduced.
  - explicitly report any skipped gates.
### Historical note
- gate list retained as implementation-time record for this accepted route decision.

## Acceptance Checks
- `GET /api/v1/users` exists as first live RBAC-protected route.
- e2e allow/deny matrix is proven (`401` unauthenticated, `403` user, `200` admin).
- route remains read-only list baseline with no ownership logic.
- `200` response shape is `{ users: UserListItem[] }` with `UserListItem = { id, email, displayName, role }`.
- deterministic ordering is enforced (`createdAt DESC`, `id ASC` tie-break).
- sensitive fields are excluded from response.
- `401`/`403` status behavior remains unchanged and response bodies now follow the stable global error envelope contract.
- behavior tests prove general rules rather than single examples.
- no example-specific patches, hardcoded special cases, or wrong-layer business-rule placement introduced.

## Documentation Updates Needed
- docs to update:
  - status: closed for this implementation slice.
  - implementation-related docs were updated for route-level RBAC closure:
    - `DECISIONS.md`
    - `specs/role-persistence-jwt-claim-rbac-baseline.md`
    - `ARCHITECTURE.md`

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - status: closed.
  - accepted decision entry already exists:
    - `2026-04-25 - Use GET /api/v1/users as first live RBAC route`.

