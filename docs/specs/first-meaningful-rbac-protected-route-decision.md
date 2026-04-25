# Feature Spec (Core Change)

## Feature/Change Name
- name: First live RBAC-protected route - admin-only users listing baseline

## Date
- yyyy-mm-dd: 2026-04-25

## Status
- In Progress

## Repository Verification Snapshot (as of 2026-04-25)
- existing API route inventory:
  - `GET /api/v1`
  - `GET /api/v1/health/db`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- reusable RBAC primitives are implemented:
  - `Roles(...)` metadata decorator
  - `RolesGuard` with `401` (unauthenticated/invalid auth user shape) and `403` (insufficient role)
- auth and persistence baseline is implemented:
  - `users.role` exists (`admin` | `user`) with default/constraint enforcement
  - JWT access token role claim is issued from persisted role and validated at request time
- no current runtime route is wired with live `Roles(...)` metadata

## Approved Route Decision
- route: `GET /api/v1/users`
- purpose: minimal admin-only user administration baseline for the starter application
- rationale:
  - leverages existing `users` persistence, role model, auth/session infrastructure, and RBAC primitives
  - provides a real infrastructure-administration use case without inventing product-domain scope
- policy:
  - unauthenticated -> `401`
  - authenticated `user` -> `403`
  - authenticated `admin` -> `200`
- ownership:
  - deferred; this route is admin-only list access, not self-service

## Problem
- route-level RBAC remains pending in `docs/auth-security-baseline.md`
- without one real protected endpoint, RBAC remains only primitive-level and not validated end-to-end on a live feature route

## Non-Goals
- product-domain features beyond admin-only user listing baseline
- full user management UI
- create/update/delete user endpoints
- permissions matrix or expanded IAM model
- ownership/self-access policy rollout
- JWT/session/auth-flow redesign
- persistence model redesign
- adding new roles

## Behavior Rules
- introduce one route only for this slice: `GET /api/v1/users`
- authorization policy for this route is fixed:
  - no auth -> `401`
  - auth role `user` -> `403`
  - auth role `admin` -> `200`
- ownership rules are out of scope for this route
- role source-of-truth and token-role claim semantics remain unchanged from existing baseline
- `200` response contract for this slice is explicit:
  - JSON object shape: `{ users: UserListItem[] }`
  - `UserListItem` fields: `id`, `email`, `displayName`, `role`
  - forbidden in payload: `passwordHash`, refresh/session token artifacts, or other secret/internal auth data
- list semantics for this slice are explicit:
  - no pagination/filter/sort query contract is introduced in this slice
  - route returns the full list visible to `admin` for the current baseline
  - ordering is deterministic: `createdAt DESC`, tie-breaker `id ASC`
- error response contract is explicit:
  - status code is the required public contract for `401` and `403`
  - response-body schema for `401`/`403` remains framework-default and is intentionally not a stable API contract in this slice

## Forbidden Behavior
- demo-only or fake protected endpoints unrelated to this approved route
- protecting health/readiness endpoints to claim RBAC completion
- introducing role-specific hardcoded exceptions outside declared policy
- implementing ownership rules in this slice
- changing JWT algorithm/session strategy/persistence schema as part of this scope
- placing durable authorization policy in UI or unrelated utility layers

## Affected Domains/Modules
- domains:
  - API transport authorization
  - user-read administration behavior (minimal baseline)
- modules/files likely affected in later implementation:
  - `apps/api/src/app/users/*` (new module/controller/service for listing)
  - `apps/api/src/app/app.module.ts` (module registration)
  - `apps/api/src/app/auth/*` only for guard/decorator usage wiring on the new route (no behavior redesign)
  - `apps/api-e2e/src/api/*` (allow/deny and payload assertions)
- docs likely affected after implementation:
  - `docs/auth-security-baseline.md`
  - `docs/implementation-baseline.md` (if baseline endpoint inventory/testing highlights change)
  - `docs/specs/role-persistence-jwt-claim-rbac-baseline.md` (deferred item closure reference)

## Design Placement Summary
- where logic should live and why:
  - controller in API transport layer for `GET /users` route mapping and guard/decorator application
  - service in API domain layer for user listing orchestration and output shaping
  - data access through TypeORM user repository/entity in persistence layer
- where logic should not live:
  - web app components/templates
  - auth/session core flow implementation (except reuse of existing guards/decorators)
  - shared utils as a home for RBAC/domain policy

## Relevant Local Skills
- skills inspected:
  - `nestjs-best-practices`
  - `jwt-security`
  - `typeorm`
- skills used:
  - `nestjs-best-practices`
  - `jwt-security`
  - `typeorm`
- why each used skill is relevant:
  - `nestjs-best-practices`: reinforces guard-based authorization and explicit response DTO/serialization boundaries to avoid sensitive-field leakage
  - `jwt-security`: preserves secure auth boundaries while keeping claims minimal and avoiding sensitive data exposure
  - `typeorm`: supports explicit deterministic ordering and bounded query behavior for a baseline list endpoint
- conflicts/tensions with project docs/spec:
  - `jwt-security` generally recommends asymmetric signing by default; project baseline is HS256-based and accepted in docs/code
- project-compatible decision:
  - keep JWT/session baseline unchanged; implement only route-level RBAC on approved endpoint

## Edge Cases
- empty users table should still return `200` with an empty list for `admin`
- response must not include sensitive data such as password hashes
- stale token-role behavior follows current baseline:
  - token role remains effective until expiry; role changes apply on next token issuance (already defined in accepted RBAC baseline spec)
- invalid token/auth context on this route should produce `401`, not `403`
- users with identical `createdAt` timestamps still return in deterministic order via `id ASC` tie-breaker

## Risks
- risk 1 and mitigation:
  - risk: scope creep into user-management product features
  - mitigation: strict non-goals (read-only listing only; no CRUD/UI/ownership rollout)
- risk 2 and mitigation:
  - risk: security regression by leaking sensitive user fields
  - mitigation: explicit response-shaping rule and e2e payload assertions
- risk 3 and mitigation:
  - risk: accidental auth baseline changes while adding route guards
  - mitigation: keep auth/session behavior unchanged and run auth/security gates + regressions

## Test Plan
- unit tests:
  - controller/service coverage for admin-only list behavior
  - guard integration on route enforces role metadata as intended
- integration/e2e tests:
  - required allow/deny matrix for `GET /api/v1/users`:
    - no bearer token -> `401`
    - authenticated bearer for role `user` -> `403`
    - authenticated bearer for role `admin` -> `200`
  - payload assertions on `200`:
    - body shape is `{ users: [...] }`
    - each user item contains only: `id`, `email`, `displayName`, `role`
    - list order is deterministic (`createdAt DESC`, `id ASC` tie-break)
    - sensitive fields are excluded (at minimum `passwordHash` and session/token artifacts)
  - payload assertions on `401`/`403`:
    - assert status code contract (`401`/`403`)
    - do not require exact framework error-body text
- regression coverage:
  - existing auth flow behavior remains intact:
    - login / refresh / logout / `auth/me`
- anti-hack coverage for behavior changes (general rule coverage, not only the shown example):
  - reject example-specific patches
  - reject hardcoded special cases when the real rule is broader
  - reject wrong-layer business-rule placement

## Required Gates
Use commands from [`../commands-reference.md`](../commands-reference.md).
- tiny/local gates (if applicable):
  - n/a for later implementation (core change)
- normal implementation gates (if applicable):
  - n/a for later implementation (core change)
- core gates:
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e`
  - `npx nx e2e web-e2e` only if web behavior/contracts become impacted
- additional domain gates (if applicable):
  - auth/security overlay:
    - `npx nx run api:lint`
    - `npx nx run api:test`
    - `npx nx run api:build`
    - `npx nx e2e api-e2e`
- manual/proposed checks:
  - confirm placement against `docs/ARCHITECTURE.md`
  - confirm policy/spec compliance against `docs/AI_CONTRACT.md`
  - confirm no JWT/session/persistence redesign was introduced
  - explicitly report any skipped gates

## Acceptance Checks
- `GET /api/v1/users` exists and is the first live RBAC-protected route
- allow/deny matrix is proven in e2e:
  - unauthenticated `401`
  - authenticated `user` `403`
  - authenticated `admin` `200`
- route remains read-only list baseline and does not include ownership logic
- `200` response shape is `{ users: UserListItem[] }` with `UserListItem = { id, email, displayName, role }`
- deterministic ordering is enforced (`createdAt DESC`, `id ASC` tie-break)
- response excludes sensitive fields
- `401`/`403` behavior contract is status-code based; no strict error-body contract is required in this slice
- no non-goal scope (CRUD/UI/permissions-matrix/IAM redesign) is introduced

## Explicit Deferrals (Not In This Slice)
- query-parameter contract for pagination/filtering/sorting
- paginated envelope/meta contract
- strict custom error-body schema for `401`/`403`
- if any of the above is needed now, update this spec before implementation rather than deciding during coding

## Documentation Updates Needed
- docs to update during/after implementation:
  - `docs/auth-security-baseline.md` (route-level RBAC pending gap status)
  - `docs/specs/role-persistence-jwt-claim-rbac-baseline.md` (deferred live-route item closure linkage)
  - `docs/implementation-baseline.md` (test/endpoint baseline highlights as needed)

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - yes
- required implementation-step action:
  - add/update a decision entry documenting:
    - selection of `GET /api/v1/users` as first live RBAC route
    - admin-only listing policy (`401`/`403`/`200` matrix)
    - ownership deferral for this slice
