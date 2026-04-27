# Feature Spec (Core Change)

## Feature/Change Name
- name: Auth-user shared contract consolidation baseline

## Date
- yyyy-mm-dd: 2026-04-26

## Status
- Accepted
- lifecycle note:
  - this spec was originally drafted as `Proposed` planning text.
  - status is now aligned to authoritative accepted state documented in [`../DECISIONS.md`](../DECISIONS.md):
    - `2026-04-26 - Consolidate shared auth-user external contracts in libs/shared/contracts`.

## Problem
- draft-time problem: external auth/user contract shapes were duplicated across API and web, increasing drift risk.
- boundary problem: shared contract location for external auth/user surface needed explicit accepted scope and exclusions.
### Current accepted state
- approved shared first-pass set is implemented in `libs/shared/contracts`.
- API and web consume shared contracts for the approved set.
- accepted auth/users runtime semantics remain unchanged.
### Historical note
- draft phrasing about "scaffold-only" and "later implementation" is superseded by accepted+implemented state.

## Non-Goals
- no runtime behavior changes.
- no API payload or status-code semantic changes.
- no JWT/session/auth flow changes.
- no RBAC policy changes.
- no DB entity/migration/schema changes.
- no dependency additions.
- no movement of API-internal, persistence/entity, guard/decorator/strategy, token-internal, or controller-validation internals into shared contracts.
- `LoginRequest` is not included in this first consolidation pass.

## Behavior Rules
- consolidation scope is type-location/refactor only; behavior remains unchanged.
- shared set included in this pass is exactly:
  - `AuthRole`
  - `AccessTokenResponse`
  - `LogoutResponse`
  - `AuthMeResponse`
  - `UserListItem`
  - `UsersListResponse`
- deferred in this pass:
  - `LoginRequest`
- explicit exclusions in this pass:
  - `AccessTokenPayload`
  - `AuthenticatedRequestUser`
  - token-pair internals (`IssuedAuthTokenPair`, `AuthenticatedTokenPair`, `RotatedAuthTokenPair`)
  - persistence/entity role types (for example `UserRole` from DB entity)
  - guards/decorators/strategy internals
  - controller-only validation internals (for example `LoginRequestBody`)
- accepted route contracts remain unchanged, including:
  - `POST /api/v1/auth/login` -> `{ accessToken: string }`
  - `POST /api/v1/auth/logout` -> `{ success: true }`
  - `GET /api/v1/auth/me` -> `{ id, email, displayName, role }`
  - `GET /api/v1/users` -> `{ users: UserListItem[] }`

## Forbidden Behavior
- changing route payload shapes or status semantics while "consolidating types."
- importing shared contracts from API persistence/internal modules.
- moving persistence or auth-internal runtime types into shared contracts.
- using this slice to introduce auth/security policy changes.

## Affected Domains/Modules
- domains:
  - shared cross-app contract surface.
  - auth/user API response contract typing.
- modules/files likely affected:
  - `libs/shared/contracts/src/lib/*`
  - `libs/shared/contracts/src/index.ts`
  - `apps/api/src/app/features/auth/auth.controller.ts` (external response typing only)
  - `apps/api/src/app/features/users/users.types.ts` (external response contract typing)
  - `apps/web/src/app/core/auth/auth.types.ts` and web consumers of these external shapes
- implementation verification anchors:
  - shared contracts: `libs/shared/contracts/src/lib/contracts.ts`
  - API consumers: `apps/api/src/app/features/auth/auth.controller.ts`, `apps/api/src/app/features/users/users.types.ts`
  - web consumers: `apps/web/src/app/core/auth/auth.types.ts`, `apps/web/src/app/core/auth/auth-api.service.ts`

## Design Placement Summary
- where logic/types should live and why:
  - external API/web shared contract shapes in `libs/shared/contracts/*` per architecture/docs boundary.
  - API internal auth strategy/request/token internals remain in API auth module.
  - persistence types remain in DB/entity layer.
- where logic/types should not live:
  - no DB entity/persistence types in shared contracts.
  - no guard/decorator/strategy internals in shared contracts.
  - no runtime auth/session behavior changes in this consolidation.

## Relevant Local Skills
- skills inspected:
  - `nx-workspace-patterns`
  - `nestjs-best-practices`
  - `angular-best-practices`
  - `typescript-advanced-types`
- skills used:
  - `nx-workspace-patterns`
  - `nestjs-best-practices`
  - `angular-best-practices`
  - `typescript-advanced-types`
- why each skill is relevant:
  - reinforced workspace boundary discipline and API/web contract-vs-internal separation.
- conflicts/tensions with project docs/spec:
  - none unresolved.
- project-compatible decision:
  - preserve runtime semantics and constrain scope to approved external contract set only.

## Edge Cases
- API previously defined `AccessTokenResponse`/`AuthMeResponse`/`LogoutResponse` in controller-local typing; consolidation must not alter behavior.
- shared `UserListItem` must not depend on persistence-layer `UserRole` type.
- `LoginRequest` remains intentionally app-local/deferred in first pass.

## Risks
- risk 1 and mitigation:
  - risk: wrong-layer coupling from shared contracts to API internals.
  - mitigation: explicit exclusion of persistence/internal auth runtime types from shared contracts.
- risk 2 and mitigation:
  - risk: hidden behavior changes under type-refactor label.
  - mitigation: unchanged runtime contract rules + regression/e2e expectations retained.
- risk 3 and mitigation:
  - risk: scope creep into auth/security redesign.
  - mitigation: strict non-goals and explicit exclusions.

## Test Plan
- unit tests:
  - update/add tests only where needed for shared-contract typing surface.
- integration/e2e tests:
  - keep existing API e2e auth/users assertions unchanged and passing.
- regression coverage:
  - confirm unchanged runtime behavior and unchanged payload semantics.
- anti-hack coverage for behavior changes (general rule coverage, not only the shown example):
  - reject example-specific patches.
  - reject hardcoded special cases when the real rule is broader.
  - reject wrong-layer business-rule placement.
### Historical note
- this spec originated as planning text; implementation outcome is now reflected in accepted state and decision log.

## Required Gates
Use commands from [`../docs/commands-reference.md`](../docs/commands-reference.md).
- tiny/local gates (if applicable):
  - n/a (core change implementation scope).
- normal implementation gates (if applicable):
  - n/a (core change implementation scope).
- core gates:
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e`
  - `npx nx e2e web-e2e`
- additional domain gates (if applicable):
  - manual boundary checks against `ARCHITECTURE.md`, `AI_CONTRACT.md`, and this spec.
- manual/proposed checks:
  - confirm shared-contract boundary discipline and deferred/excluded scope remains intact.
### Historical note
- gate list is retained as implementation-time record.

## Acceptance Checks
- API and web compile against shared contract types for approved set:
  - `AuthRole`, `AccessTokenResponse`, `LogoutResponse`, `AuthMeResponse`, `UserListItem`, `UsersListResponse`.
- existing runtime behavior and payload semantics remain unchanged.
- `LoginRequest` remains deferred from first pass.
- API-internal, persistence/entity, guard/decorator/strategy, token-internal, and controller-validation internals remain excluded.
- behavior tests prove general rules rather than single examples.
- no example-specific patches, hardcoded special cases, or wrong-layer business-rule placement introduced.

## Documentation Updates Needed
- docs to update:
  - status: closed for implementation lifecycle.
  - accepted status and scope are aligned to current code and decision log.

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - status: closed.
  - accepted decision entry already exists:
    - `2026-04-26 - Consolidate shared auth-user external contracts in libs/shared/contracts`.

