# Feature Spec (Core Change)

## Feature/Change Name
- name: Users list filtering baseline (role + email)

## Date
- yyyy-mm-dd: 2026-04-29

## Status
- Accepted
- lifecycle note:
  - this spec captures accepted filtering contract details and implementation for the first narrow filtering slice.
  - scope stays intentionally narrow to role/email filtering only.

## Problem
- `GET /api/v1/users` had accepted+implemented RBAC, pagination, sorting, and paginated-envelope behavior, while filtering was deferred.
- without a narrow accepted filtering contract, API/web contract drift risk remained for users-list search behavior.

## Non-Goals
- no auth/session/RBAC semantic changes.
- no pagination/sort baseline expansion.
- no users-management product expansion (CRUD, ownership, IAM matrix).
- no database migration, index, or schema change in this slice.
- no web filtering page or visible filtering controls.

## Behavior Rules
- accepted baseline behavior retained:
  - route remains `GET /api/v1/users`, admin-only (`401`/`403` unchanged).
  - success envelope remains `{ users, pagination }`.
  - existing pagination/sort defaults/bounds/tie-break remain unchanged.
- accepted filtering contract:
  - flat optional query params only:
    - `role=<value>`
    - `email=<value>`
  - `role` filter: exact match against accepted role values (`admin | user`).
  - `email` filter: case-insensitive partial match.
  - when both filters are provided, semantics are logical AND.
- validation behavior:
  - unknown query params remain rejected with existing unknown-field behavior (`400 REQUEST_UNKNOWN_FIELD`).
  - invalid filter values return existing stable validation envelope behavior (`400 REQUEST_VALIDATION_FAILED`).
  - empty filter values for `role` and `email` are invalid in this slice.
- scope constraints:
  - no additional filter fields or nested filter syntax.
  - no generic filtering framework.

## Forbidden Behavior
- adding filters beyond `role` and `email` in this slice.
- changing accepted auth/RBAC, pagination, sorting, or envelope contracts.
- introducing migration/index/schema work in this slice.
- placing durable filtering policy in web UI or unrelated utilities.

## Affected Domains/Modules
- domains:
  - API transport query validation for users-list filters.
  - users service/domain filtering orchestration.
  - shared API/web external users-list query contract.
  - web users API client query construction.
- implemented files:
  - `apps/api/src/app/features/users/dto/list-users-query.dto.ts`
  - `apps/api/src/app/features/users/users.service.ts`
  - `libs/shared/contracts/src/lib/contracts.ts`
  - `apps/web/src/app/core/auth/auth-api.service.ts`
  - users/shared/web test files and `apps/api-e2e/src/api/users.spec.ts`

## Design Placement Summary
- where logic should live and why:
  - query validation for filter params in users feature DTO (API transport layer).
  - filtering query composition in users service (domain/data-access orchestration).
  - shared external query contract fields in `libs/shared/contracts`.
  - web query-param wiring in existing API client service.
- where logic should not live:
  - filtering policy in controller/business-unrelated layers.
  - API-internal DTO/class-validator details in shared contracts.
  - UI feature scope beyond API client wiring.

## Relevant Local Skills
- policy authority: [`../AI_SKILLS.md`](../AI_SKILLS.md)
- skills inspected:
  - `nestjs-best-practices`
  - `typeorm`
  - `postgresql-table-design`
  - `nx-workspace-patterns`
  - `angular-http`
  - `typescript-advanced-types`
- skills used:
  - `nestjs-best-practices`
  - `typeorm`
  - `nx-workspace-patterns`
  - `angular-http`
- why each skill is relevant:
  - DTO/service boundary and transport validation placement.
  - TypeORM filtering composition (`ILike`) while preserving existing paging/sorting.
  - cross-project gate discipline for Nx workspace.
  - Angular API client query wiring patterns.
- conflicts/tensions with project docs/spec:
  - none unresolved; project-approved scope takes priority.
- project-compatible decision:
  - keep filtering narrow (role/email only), no schema/index work, no UI expansion.

## Edge Cases
- `role=` and `email=` empty values are invalid.
- unknown query keys (including deferred filter-like keys) remain rejected.
- filtered empty result sets still return `200` with `users: []` and consistent pagination metadata.
- filtered requests preserve accepted out-of-range page behavior.

## Risks
- risk 1 and mitigation:
  - risk: scope creep into broader users management.
  - mitigation: strict non-goals and explicit forbidden behavior.
- risk 2 and mitigation:
  - risk: contract drift between API and web.
  - mitigation: shared `UsersListQuery` update and client wiring in same slice.
- risk 3 and mitigation:
  - risk: performance assumptions driving premature indexing changes.
  - mitigation: no migration/index changes in this slice.

## Test Plan
- unit tests:
  - DTO validation for `role`/`email`, invalid values, empty values, unknown-field rejection.
  - users service query composition for role exact, email partial CI, AND semantics.
- integration/e2e tests:
  - filtered users list behavior for role/email/combined filters.
  - unchanged `401`/`403` behavior.
  - unchanged pagination/sort/envelope behavior with filters active.
  - invalid/unknown filter behavior with existing stable error envelope/codes.
- regression coverage:
  - existing users-list baseline behavior remains unchanged beyond approved filtering.
- anti-hack coverage for behavior changes (general rule coverage, not only the shown example):
  - reject example-specific patches
  - reject hardcoded special cases when the real rule is broader
  - reject wrong-layer business-rule placement

## Required Gates
Use commands from [`../docs/commands-reference.md`](../docs/commands-reference.md).
- tiny/local gates (if applicable):
  - n/a.
- normal implementation gates (if applicable):
  - n/a.
- core gates:
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e`
  - `npx nx e2e web-e2e` only if visible web behavior/UI changes.
- additional domain gates (if applicable):
  - `8.6` e2e-relevant overlay applies (API contract behavior changed).
  - `8.5` database/migration overlay does not apply (no schema/index changes).
- manual/proposed checks:
  - confirm no schema/index/migration changes were introduced.
  - confirm no UI filtering controls were introduced.

## Acceptance Checks
- role and email filters are supported with approved semantics.
- unknown query keys remain rejected.
- invalid and empty filter values return existing stable validation behavior.
- auth/RBAC, pagination, sorting, and paginated envelope baselines remain unchanged.
- no schema/index/migration and no UI filtering rollout in this slice.

## Documentation Updates Needed
- docs to update:
  - this spec status moved to accepted and implementation-aligned.
  - related decision log updated for accepted filtering baseline.
- guidance:
  - preserve deferred status for any filtering behavior beyond role/email.

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - required and completed in this pass for accepted filtering baseline.

