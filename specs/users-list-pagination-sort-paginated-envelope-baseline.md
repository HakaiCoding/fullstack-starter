# Feature Spec (Core Change)

## Feature/Change Name
- name: Users list pagination + sorting query contract and paginated envelope baseline

## Date
- yyyy-mm-dd: 2026-04-29

## Status
- Accepted
- lifecycle note:
  - accepted contract baseline and implementation status are both established.
  - repo evidence confirms implemented behavior in API/users route+service, shared contracts, API e2e coverage, and web client contract usage.

## Problem
- accepted docs previously deferred pagination/filter/sort query contracts and paginated envelope/meta contract for `GET /api/v1/users`.
- this spec now records reconciliation of that prior deferred status against current repo implementation evidence.
- objective is to keep status wording aligned with implemented baseline behavior without expanding scope.

## Non-Goals
- no runtime/API behavior expansion beyond the accepted baseline.
- no user registration or admin provisioning scope.
- no auth/session/JWT/RBAC semantic changes.
- no persistence schema/entity/migration changes.
- no UI feature rollout beyond contract impact planning.
- no filtering behavior rollout in this slice.
- no new stable non-baseline error-status families (for example `404/409/422/500`) in this slice.

## Behavior Rules
- implemented baseline behavior:
  - `GET /api/v1/users` remains admin-only (`401` unauthenticated, `403` authenticated non-admin, `200` admin).
  - success envelope is `{ users: UserListItem[], pagination: UsersListPagination }`.
- implemented query contract:
  - `page` (optional): integer, minimum `1`, default `1`.
  - `pageSize` (optional): integer, minimum `1`, maximum `100`, default `25`.
  - `sortBy` (optional): enum with accepted key set `createdAt` only for this baseline.
  - `sortDir` (optional): enum `asc | desc`, default `desc`.
- accepted sorting rules:
  - primary sort key is `createdAt` with caller-selected direction (`asc` or `desc`).
  - deterministic tie-break remains `id ASC` regardless of `sortDir`.
- accepted filtering policy for this baseline:
  - filtering is explicitly deferred.
  - no filter fields/operators are accepted in this slice.
- accepted paginated response envelope contract for successful admin requests:

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "admin@example.com",
      "displayName": "Admin",
      "role": "admin"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false,
    "sortBy": "createdAt",
    "sortDir": "desc"
  }
}
```

- pagination semantics:
  - `totalPages = 0` when `totalItems = 0`; otherwise `totalPages = ceil(totalItems / pageSize)`.
  - syntactically valid but out-of-range page numbers (for example `page` greater than `totalPages` when `totalPages > 0`) return `200` with empty `users` and consistent `pagination` metadata.
- validation and error behavior:
  - query validation uses DTO/class-validator transport validation per accepted global ValidationPipe baseline.
  - unknown query params (including deferred filter params) return `400` with stable code `REQUEST_UNKNOWN_FIELD`.
  - invalid query param values (type/range/enum violations) return `400` with stable code `REQUEST_VALIDATION_FAILED`.
  - existing `401`/`403` behavior and stable error-envelope/code policy remain unchanged for auth/RBAC failures.
- shared-contract placement expectations:
  - reusable external pagination/sorting contract types for API/web belong in `libs/shared/contracts`.
  - API request-validation DTOs remain app-local in `apps/api/src/app/features/users/*` and must not be moved into shared contracts.

## Forbidden Behavior
- changing auth/session/RBAC semantics while adding pagination/sort contract behavior.
- adding filter behavior under this contract without a follow-up accepted spec/decision.
- introducing endpoint-specific one-off query behavior not captured by this spec.
- placing durable query-policy logic in web UI or unrelated utilities.
- exporting API-internal DTO/validation/filter implementation details as shared contracts.

## Affected Domains/Modules
- domains:
  - API transport request validation (query params).
  - users list domain orchestration and data-access pagination/sort behavior.
  - shared API/web external contract typing.
- repo evidence (implemented):
  - `apps/api/src/app/features/users/users.controller.ts`
  - `apps/api/src/app/features/users/users.service.ts`
  - `apps/api/src/app/features/users/*dto*`
  - `apps/api-e2e/src/api/users.spec.ts`
  - `apps/web/src/app/core/auth/auth-api.service.ts`
  - `apps/web/src/app/core/auth/auth.types.ts`
  - `apps/web/src/app/core/auth/auth-api.service.spec.ts`
  - `libs/shared/contracts/src/lib/contracts.ts`
  - `libs/shared/contracts/src/lib/contracts.spec.ts`

## Design Placement Summary
- where logic should live and why:
  - query DTO validation belongs to API transport layer in the users feature.
  - pagination/sort orchestration and repository query composition belong to users service/domain layer.
  - public cross-app query/response contract types belong in `libs/shared/contracts`.
- where logic should not live:
  - durable pagination/sorting policy in web components/services.
  - shared contracts containing API-internal DTO/class-validator or repository details.
  - auth module logic changes for this scope.

## Relevant Local Skills
- policy authority: [`../AI_SKILLS.md`](../AI_SKILLS.md)
- skills inspected:
  - `nestjs-best-practices`
  - `typeorm`
  - `nx-workspace-patterns`
- skills used:
  - `nestjs-best-practices`
  - `typeorm`
  - `nx-workspace-patterns`
- why each skill is relevant:
  - `nestjs-best-practices`: transport DTO validation + route/service boundary discipline.
  - `typeorm`: deterministic ordering and pagination query patterns.
  - `nx-workspace-patterns`: cross-project gate discipline and shared-contract blast-radius awareness.
- conflicts/tensions with project docs/spec:
  - none unresolved for this scope.
- project-compatible decision:
  - keep DTO validation app-local, keep shared contracts external-only, and keep auth semantics unchanged.

## Edge Cases
- `pageSize` greater than `100` returns `400` (`REQUEST_VALIDATION_FAILED`).
- `page`, `pageSize`, `sortBy`, or `sortDir` with invalid type/value returns `400` (`REQUEST_VALIDATION_FAILED`).
- unknown query keys (including deferred filter keys) return `400` (`REQUEST_UNKNOWN_FIELD`).
- empty users dataset returns `200` with `users: []` and `pagination.totalItems = 0`, `pagination.totalPages = 0`.
- out-of-range but syntactically valid `page` returns `200` with empty `users` and consistent metadata.

## Risks
- risk 1 and mitigation:
  - risk: contract drift between API and web due cross-module changes.
  - mitigation: define shared external contract placement and require e2e + web consumer updates in same implementation slice.
- risk 2 and mitigation:
  - risk: silent behavior expansion into filtering scope.
  - mitigation: explicit filtering deferral and unknown-field rejection for filter params in this baseline.
- risk 3 and mitigation:
  - risk: breaking strict consumers expecting only `{ users: [...] }`.
  - mitigation: backward-compatible additive envelope preserving top-level `users` while adding `pagination`.

## Unresolved Questions
- should this baseline remain sort-key-minimal (`createdAt` only) after first implementation, or should additional sort keys be introduced in a dedicated follow-up slice after initial rollout stability is verified?
- should out-of-range `page` eventually become a stable validation error instead of `200` empty-list behavior, or remain as accepted in this baseline for client resilience?

## Test Plan
- unit tests:
  - users query DTO validation for defaults, bounds, enum constraints, and unknown-field rejection.
  - users service query composition for pagination window and deterministic ordering.
- integration/e2e tests:
  - `GET /api/v1/users` retain `401`/`403` behavior and stable error envelope/codes.
  - admin `200` response includes both `users` and `pagination` with correct metadata.
  - pagination boundary behavior (empty dataset, out-of-range page, max page size).
  - sort direction behavior (`asc` and `desc`) with deterministic tie-break verification.
- regression coverage:
  - existing auth flow (`login/refresh/logout/me`) remains unchanged.
  - existing users RBAC allow/deny matrix remains intact.
- anti-hack coverage for behavior changes (general rule coverage, not only the shown example):
  - reject example-specific patches.
  - reject hardcoded special cases when the real rule is broader.
  - reject wrong-layer business-rule placement.

## Required Gates
Use commands from [`../docs/commands-reference.md`](../docs/commands-reference.md).
- tiny/local gates (if applicable):
  - docs-only reconciliation pass may skip runtime gates per section `8.1`.
- normal implementation gates (if applicable):
  - n/a.
- core gates (for later implementation slice):
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e`
  - `npx nx e2e web-e2e`
- additional domain gates (if applicable):
  - e2e-relevant overlay (`8.6`) applies because API contract and cross-app behavior are affected.
  - auth/security overlay (`8.4`) should be run if protected-route auth behavior is touched beyond unchanged baseline semantics.
- manual/proposed checks:
  - confirm no scope creep into registration/auth-policy/UI-feature work.
  - confirm shared-contract boundaries remain architecture-compliant.

## Acceptance Checks
- implemented baseline checks:
  - accepted query contract for pagination/sorting on `GET /api/v1/users` is implemented.
  - accepted paginated success envelope shape is implemented with top-level `users` preserved.
  - validation/error behavior is implemented and aligned to existing accepted error-envelope/code policy.
  - shared-contract and placement boundaries are implemented as documented.
  - filtering remains explicitly deferred and unknown/deferred filter-like query keys remain rejected (`REQUEST_UNKNOWN_FIELD`).
- unresolved follow-up checks (remain deferred/unresolved):
  - behavior tests prove general rules for defaults/bounds/sorting/pagination metadata.
  - existing `401`/`403` semantics remain unchanged.
  - no example-specific patches, hardcoded special cases, or wrong-layer business-rule placement introduced.

## Documentation Updates Needed
- docs to update:
  - reconcile stale "deferred implementation" wording in this spec and `DECISIONS.md`.
- guidance:
  - preserve the distinction that filtering remains deferred/out of scope.
  - preserve unresolved follow-up questions without treating them as resolved.

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - updated in this pass to reconcile accepted-vs-implemented status wording for this baseline.
  - no new decision entry required for this docs-only reconciliation.
