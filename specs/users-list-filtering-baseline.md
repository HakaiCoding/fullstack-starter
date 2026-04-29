# Feature Spec (Core Change)

## Feature/Change Name
- name: Users list filtering baseline (design and contract proposal)

## Date
- yyyy-mm-dd: 2026-04-29

## Status
- Proposed
- lifecycle note:
  - this is a design/specification pass only.
  - runtime/API/web/contracts/tests are intentionally not implemented in this pass.

## Problem
- `GET /api/v1/users` currently has accepted+implemented RBAC, pagination, sorting, and paginated-envelope behavior, but filtering remains explicitly deferred.
- without an accepted filtering contract, implementation details (filter fields, semantics, validation policy, and query shape) remain unresolved and risk cross-app/API-contract drift.

## Non-Goals
- no implementation changes in API/web/shared contracts/tests.
- no auth/session/RBAC semantic changes.
- no pagination/sort baseline expansion beyond already accepted behavior.
- no user-management scope expansion (create/update/delete, ownership, IAM matrix).
- no schema migration in this design pass.

## Behavior Rules
- accepted current behavior (implemented, unchanged in this pass):
  - route remains `GET /api/v1/users`, admin-only (`401`/`403` unchanged).
  - current accepted query params are only `page`, `pageSize`, `sortBy`, `sortDir`.
  - unknown query params currently return `400` with `REQUEST_UNKNOWN_FIELD`, including filter-like params.
  - success envelope remains `{ users, pagination }` with existing pagination/sort semantics.
- proposed filtering slice objective (not yet accepted):
  - add a minimal, explicit filtering contract for `GET /api/v1/users` without changing existing auth, pagination, sorting, or envelope baselines.
  - preserve deterministic behavior when filtering is active (pagination and sorting still apply after filtering).

## Forbidden Behavior
- implementing filtering before unresolved contract details are accepted.
- changing accepted pagination/sort defaults or RBAC semantics as part of filtering.
- silently accepting undeclared filter params.
- placing durable filtering policy in web-only code.
- adding schema/index changes without an explicit accepted migration decision.

## Affected Domains/Modules
- domains:
  - API transport query validation for users-list filters.
  - users service/domain filtering orchestration.
  - shared API/web external users-list query contract.
  - web users API client query construction.
- modules/files likely affected in later implementation:
  - `apps/api/src/app/features/users/dto/list-users-query.dto.ts`
  - `apps/api/src/app/features/users/users.service.ts`
  - `apps/api/src/app/features/users/users.controller.ts`
  - `apps/api/src/db/entities/user.entity.ts` (read-only design impact in this pass; potential index follow-up only if accepted)
  - `libs/shared/contracts/src/lib/contracts.ts`
  - `apps/web/src/app/core/auth/auth-api.service.ts`
  - `apps/api/src/app/features/users/*.spec.ts`
  - `apps/api-e2e/src/api/users.spec.ts`
  - `apps/web/src/app/core/auth/auth-api.service.spec.ts`

## Design Placement Summary
- where logic should live and why:
  - query shape/default/bounds/enum validation: users feature query DTO (API transport layer).
  - filtering business/query composition: users service/domain layer using repository query criteria.
  - external query contract types reused by API/web: `libs/shared/contracts`.
  - web request param wiring: auth API service client layer only.
- where logic should not live:
  - filtering policy in controllers beyond DTO binding.
  - filtering semantics in web components/UI state as source-of-truth.
  - API-internal DTO/class-validator details promoted into shared contracts.

## Relevant Local Skills
- policy authority: [`../AI_SKILLS.md`](../AI_SKILLS.md)
- skills inspected:
  - `nestjs-best-practices`
  - `typeorm`
  - `postgresql-table-design`
  - `nx-workspace-patterns`
- skills used:
  - `nestjs-best-practices`
  - `typeorm`
  - `postgresql-table-design`
  - `nx-workspace-patterns`
- why each skill is relevant:
  - `nestjs-best-practices`: DTO validation and controller/service boundary discipline.
  - `typeorm`: repository/query-builder filtering composition patterns.
  - `postgresql-table-design`: filter-field/index implications and migration caution.
  - `nx-workspace-patterns`: cross-project implementation/testing gate discipline.
- conflicts/tensions with project docs/spec:
  - none unresolved in this proposal stage.
- project-compatible decision:
  - keep filtering unresolved where not already accepted; propose minimal options for approval.

## Unresolved Questions
- each item below is unresolved unless already accepted elsewhere; recommended option is a proposal for approval, not an implemented decision.
- allowed filter fields:
  - option A (recommended): `role`, `email`, `displayName`.
  - option B: `role` only in first slice.
  - option C: `role` + `email` only.
- query parameter shape:
  - option A (recommended): flat optional query params (`?role=...&email=...&displayName=...`).
  - option B: nested `filter[...]` shape.
- email filtering semantics:
  - option A (recommended): case-insensitive partial match (`contains`) on normalized email text.
  - option B: exact case-insensitive match only.
- displayName filtering semantics:
  - option A (recommended): case-insensitive partial match on non-null display names.
  - option B: exact case-insensitive match only.
  - unresolved: whether blank-string input should be rejected or treated as absent.
- role filtering semantics:
  - option A (recommended): exact enum match (`admin | user`) using existing role domain.
  - option B: defer role filtering from first filtering slice.
- combination semantics for multiple filters:
  - option A (recommended): logical AND across provided filters.
  - option B: mixed/OR semantics (not recommended for first slice due to complexity).
- case sensitivity:
  - option A (recommended): case-insensitive for text filters; exact enum for role.
  - option B: case-sensitive text matching.
- pagination/sort interaction with active filters:
  - option A (recommended): apply filters first, then existing sort/tie-break, then pagination.
  - option B: any alternative ordering (not recommended; risks baseline drift).
- invalid filter behavior:
  - unresolved: whether invalid value should map to existing `REQUEST_VALIDATION_FAILED` only, and which constraints apply (min/max length, allowed charset, trimmed-empty handling).
- unknown filter behavior:
  - option A (recommended): preserve existing unknown-field `400 REQUEST_UNKNOWN_FIELD`.
  - option B: ignore unknown fields (not recommended; conflicts with current baseline).
- empty-result behavior:
  - option A (recommended): preserve current `200` envelope with `users: []` and consistent pagination metadata.
  - option B: any non-`200` behavior (not recommended).
- database/indexing implications:
  - unresolved: whether first slice ships with no new indexes, with follow-up measurement, or includes targeted indexes in same slice.
  - recommended minimal policy: no index migration unless benchmark evidence shows clear regression; otherwise create a dedicated follow-up migration spec/decision.
- shared contract change scope:
  - option A (recommended): extend `UsersListQuery` only with accepted filter params.
  - option B: keep filter params API-local initially and delay shared contract update (not recommended due API/web drift risk).
- web client/query builder behavior:
  - option A (recommended): pass through accepted optional filter params only; no UI rollout required in same slice.
  - option B: couple API filtering with immediate UX feature scope (not recommended for first slice).
- web e2e requirement:
  - unresolved: whether web e2e is required if only API client service wiring changes without new UI.
  - recommended minimal policy: API e2e required; web e2e optional unless UI behavior changes.

## Edge Cases
- deferred/unknown filter-like query keys should continue returning `400 REQUEST_UNKNOWN_FIELD` until filter keys are explicitly accepted.
- null/empty display names must have deterministic behavior when displayName filter is introduced (currently unresolved).
- combined filters with out-of-range page should preserve accepted out-of-range-page baseline unless separately changed by accepted decision.

## Risks
- risk 1 and mitigation:
  - risk: hidden scope creep from filtering into broader user management.
  - mitigation: strict non-goals and unresolved-question gating before implementation.
- risk 2 and mitigation:
  - risk: API/web contract drift if query fields are added app-locally only.
  - mitigation: require explicit shared contract decision for accepted filter params.
- risk 3 and mitigation:
  - risk: premature indexing decisions without workload evidence.
  - mitigation: document index decision as unresolved and require explicit measurement/acceptance.

## Test Plan
- unit tests (later implementation prompt):
  - DTO validation for accepted filter params, invalid values, and unknown-field rejection.
  - users service filtering composition (single and combined filters), preserving deterministic sort/tie-break.
- integration/e2e tests (later implementation prompt):
  - admin `200` filtered results and metadata consistency.
  - unchanged `401`/`403` behavior.
  - invalid filter value `400 REQUEST_VALIDATION_FAILED`.
  - unknown query key `400 REQUEST_UNKNOWN_FIELD`.
  - empty-result filtered queries return `200` with `users: []` + pagination metadata.
- regression coverage:
  - existing pagination/sort baseline and out-of-range page behavior remain unchanged.
  - existing auth flows remain unchanged.
- anti-hack coverage for behavior changes (general rule coverage, not only the shown example):
  - reject example-specific patches
  - reject hardcoded special cases when the real rule is broader
  - reject wrong-layer business-rule placement

## Required Gates
Use commands from [`../docs/commands-reference.md`](../docs/commands-reference.md).
- tiny/local gates (if applicable):
  - this spec-only pass may skip runtime gates per section `8.1`.
- normal implementation gates (if applicable):
  - n/a for this proposal-only pass.
- core gates (for later implementation slice):
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e`
  - `npx nx e2e web-e2e` (if web behavior/contracts/UI are affected in that implementation)
- additional domain gates (if applicable):
  - auth/security overlay (`8.4`) if route-auth behavior is touched.
  - e2e-relevant overlay (`8.6`) because API contract behavior changes.
  - database/migration overlay (`8.5`) only if index/schema changes are accepted into scope.
- manual/proposed checks:
  - confirm unresolved detail choices are explicitly approved before implementation.
  - confirm no filtering behavior is implemented in this design pass.

## Acceptance Checks
- for this proposal pass:
  - current accepted users-list behavior is documented distinctly from filtering proposal scope.
  - unresolved filtering details are explicit and not silently decided.
  - minimal recommended options are listed for approval.
  - implementation boundaries and affected modules are documented for next slice.
- before implementation starts:
  - unresolved detail set is resolved or narrowed by explicit approval.
  - shared contract strategy and index strategy are explicitly confirmed.

## Documentation Updates Needed
- docs to update:
  - add this proposed filtering spec as canonical design artifact for the next users-list filtering slice.
- guidance:
  - keep current accepted docs stating filtering is deferred until this proposal is accepted and implemented.
  - once implemented, reconcile deferred wording in relevant accepted docs/specs/decisions.

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - not required in this proposal-only pass.
  - required when filtering contract choices are accepted as a long-lived project decision.
