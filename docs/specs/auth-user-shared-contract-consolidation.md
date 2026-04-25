# Feature Spec (Core Change)

## Feature/Change Name
- name: Auth-user shared contract consolidation baseline

## Date
- yyyy-mm-dd: 2026-04-26

## Status
- Proposed

## Accepted Existing Project Facts
- `libs/shared/contracts` is the intended home for shared API/web contract shapes:
  - [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
  - [`docs/AI_CONTRACT.md`](../AI_CONTRACT.md)
- shared-contract changes affecting API and web are core/spec-gated:
  - [`docs/README.md`](../README.md) ("When a Spec Is Required")
  - [`docs/AI_CONTRACT.md`](../AI_CONTRACT.md)
- current accepted auth/users API semantics must remain unchanged:
  - auth route baseline and invariants: [`docs/auth-security-baseline.md`](../auth-security-baseline.md)
  - accepted `GET /api/v1/users` payload/status semantics: [`first-meaningful-rbac-protected-route-decision.md`](./first-meaningful-rbac-protected-route-decision.md)
- current repository state relevant to this slice:
  - shared contracts library is scaffold-only:
    - [`libs/shared/contracts/src/lib/contracts.ts`](../../libs/shared/contracts/src/lib/contracts.ts)
    - [`libs/shared/contracts/src/index.ts`](../../libs/shared/contracts/src/index.ts)
  - contract-like shapes currently exist in app-local files:
    - [`apps/web/src/app/auth/auth.types.ts`](../../apps/web/src/app/auth/auth.types.ts)
    - [`apps/api/src/app/users/users.types.ts`](../../apps/api/src/app/users/users.types.ts)
    - [`apps/api/src/app/auth/auth.controller.ts`](../../apps/api/src/app/auth/auth.controller.ts)

## User-Approved Decision For This Slice
- first consolidation pass includes only:
  - `AuthRole`
  - `AccessTokenResponse`
  - `LogoutResponse`
  - `AuthMeResponse`
  - `UserListItem`
  - `UsersListResponse`
- `LoginRequest` is explicitly deferred for this first consolidation pass.

## Problem
- external auth/user contract shapes are duplicated across API and web, while the shared contracts library is not yet used for this surface.
- without a single shared contract source, API/web contract drift risk increases over time.

## Non-Goals
- no runtime behavior changes.
- no API payload or status-code semantic changes.
- no JWT/session/auth flow changes.
- no RBAC policy changes.
- no DB entity/migration/schema changes.
- no dependency additions.
- no movement of API-internal, persistence, guard/decorator/strategy, or token-internal types into shared contracts.

## Behavior Rules
- contract consolidation in this slice is type-location/refactor only; behavior is unchanged.
- accepted route contracts remain unchanged, including:
  - `POST /api/v1/auth/login` response shape `{ accessToken: string }`
  - `POST /api/v1/auth/logout` response shape `{ success: true }`
  - `GET /api/v1/auth/me` response shape `{ id, email, displayName, role }`
  - `GET /api/v1/users` response shape `{ users: UserListItem[] }` and existing status semantics

## Contract Boundary
### Approved Shared Set And Why
- `AuthRole`:
  - external role domain used in response contracts consumed by web (`auth/me`, `users` payload items)
  - allowed values remain `admin | user` as already accepted by project docs/specs
- `AccessTokenResponse`:
  - external response contract consumed by web for login/refresh access-token acquisition
- `LogoutResponse`:
  - external response contract consumed by web for logout flow
- `AuthMeResponse`:
  - external response contract for authenticated user profile shape
- `UserListItem`:
  - external `GET /api/v1/users` list item shape already constrained by accepted spec
- `UsersListResponse`:
  - external `GET /api/v1/users` envelope shape already constrained by accepted spec

### Explicit Exclusions For This Pass
- deferred:
  - `LoginRequest`
- not external API/web shared surface for this pass:
  - `AccessTokenPayload`
  - `AuthenticatedRequestUser`
  - token-pair internals (`IssuedAuthTokenPair`, `AuthenticatedTokenPair`, `RotatedAuthTokenPair`)
  - persistence/entity role types (for example `UserRole` from DB entity)
  - guards/decorators/strategy internals
  - controller-only validation internals (for example `LoginRequestBody`)

## Forbidden Behavior
- changing route payload shapes or status semantics while "consolidating types."
- importing shared contracts from API persistence/internal modules.
- moving persistence or auth-internal transport/runtime types into shared contracts.
- using this slice to introduce auth/security policy changes.

## Affected Domains/Modules
- domains:
  - shared cross-app contract surface
  - auth/user API response contract typing
- modules/files likely affected in later implementation:
  - `libs/shared/contracts/src/lib/*`
  - `libs/shared/contracts/src/index.ts`
  - `apps/api/src/app/auth/auth.controller.ts` (external response typing only)
  - `apps/api/src/app/users/users.types.ts` (external response contract typing)
  - `apps/web/src/app/auth/auth.types.ts` and web consumers of these external shapes

## Design Placement Summary
- where logic/types should live and why:
  - external API/web shared contract shapes live in `libs/shared/contracts/*` per architecture docs.
  - API internal auth strategy/request/token internals remain in API auth module files.
  - persistence types remain in DB/entity layer.
- where logic/types should not move:
  - no DB entity/persistence types into shared contracts.
  - no guard/decorator/strategy internals into shared contracts.
  - no runtime auth/session behavior changes in this consolidation.

## Relevant Local Skills
- skills inspected:
  - `nx-workspace-patterns`
  - `nestjs-best-practices`
  - `angular-best-practices`
  - `typescript-advanced-types`
- skills used:
  - `nx-workspace-patterns` (workspace boundaries/target awareness)
  - `nestjs-best-practices` (API contract-vs-internal boundaries)
  - `angular-best-practices` (web DTO boundary discipline)
  - `typescript-advanced-types` (safe shared type design discipline)
- conflicts/tensions with project docs/spec:
  - none identified for this slice; project docs/specs/decisions remain authoritative.
- project-compatible decision:
  - preserve current runtime semantics and constrain this slice to approved external contract types only.

## Edge Cases
- API currently defines `AccessTokenResponse`/`AuthMeResponse`/`LogoutResponse` inside controller file while web defines similarly named types; consolidation must not alter response semantics.
- API `UserListItem` currently references DB `UserRole`; shared contract version must not depend on persistence-layer entity types.
- deferred `LoginRequest` must remain excluded in first pass even though web currently defines it.

## Risks
- risk 1: accidental wrong-layer coupling
  - mitigation: reject any shared-contract import from `apps/api/src/db/**` or auth-runtime internals.
- risk 2: accidental behavior changes hidden in "type refactor"
  - mitigation: scope review to type location/import/export changes only; keep existing e2e behavior assertions as guardrails.
- risk 3: scope creep into auth/security redesign
  - mitigation: enforce non-goals and explicit exclusions in this spec.

## Later Implementation Outline (Not This Pass)
1. Define approved shared types in `libs/shared/contracts`.
2. Export approved shared types via contracts public API.
3. Adopt shared types in API external response typing only.
4. Adopt shared types in web consumers.
5. Clean up temporary aliases/re-exports only if safe.

## Test Plan (For Later Implementation)
- unit tests:
  - update/add only tests necessary for shared-contract library typing surface where applicable.
- integration/e2e tests:
  - keep existing API e2e auth/users assertions unchanged and passing.
- regression coverage:
  - confirm unchanged runtime behavior and unchanged payload semantics.
- anti-hack coverage for behavior changes:
  - reject example-specific patches
  - reject hardcoded special cases when the real rule is broader
  - reject wrong-layer business-rule placement

## Acceptance Checks (For Later Implementation)
- API and web compile against shared contract types for approved set.
- existing runtime behavior and payload semantics remain unchanged.
- no shared contracts import from API persistence/internal modules.
- `LoginRequest` is not included in first consolidation pass.
- existing API e2e auth/users assertions still pass unchanged.

## Required Verification/Gates
Use commands from [`../commands-reference.md`](../commands-reference.md).

- later implementation (core + cross-app contract impact):
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e`
  - `npx nx e2e web-e2e`
  - manual checks against `docs/ARCHITECTURE.md`, `docs/AI_CONTRACT.md`, and this spec

- this docs/spec-only pass:
  - runtime/code gates were intentionally not run because this pass modifies docs/spec only and does not touch runtime/code/test files.
  - verification performed: repository/doc/spec inspection and scope validation against authoritative docs.

## Documentation Updates Needed
- this pass:
  - add this spec file.
- later implementation pass:
  - update docs only if accepted contract-location baseline/status needs reflection in `docs/*`.

## Decision Log Updates Needed
- this docs/spec-only pass:
  - no `DECISIONS.md` update required yet.
- later implementation:
  - user-approved post-implementation requirement:
    - after this shared-contract consolidation is implemented and required gates pass, add/update a concise `docs/DECISIONS.md` entry documenting the accepted contract-location boundary for this scope.
  - required decision entry content:
    - `libs/shared/contracts` is the accepted home for shared API/web external contract shapes in this auth-user consolidation scope.
    - first-pass shared set includes exactly:
      - `AuthRole`
      - `AccessTokenResponse`
      - `LogoutResponse`
      - `AuthMeResponse`
      - `UserListItem`
      - `UsersListResponse`
    - `LoginRequest` remains deferred from this first pass.
    - API-internal, persistence/entity, guard/decorator/strategy, token-internal, and controller-validation internals are excluded from shared contracts.
