# Feature Spec (Core Change)

## Feature/Change Name
- name: Auth invalid-input and auth error behavior baseline contract

## Date
- yyyy-mm-dd: 2026-04-27

## Status
- Accepted
- lifecycle note:
  - this spec originally documented status-code behavior before DTO validation rollout.
  - this pass updates policy + implementation baseline so DTO/class-validator is accepted and first applied to `POST /api/v1/auth/login`.
  - global ValidationPipe rollout with the accepted profile is now implemented in follow-up runtime code, while this spec remains the status-code behavior baseline.

## Problem
- auth invalid-input/error behavior needed a stable status-code contract that survives validation implementation updates.
- DTO/class-validator guidance was previously treated as optional future hardening, which conflicted with the accepted user decision for backend validation baseline.

## Non-Goals
- no JWT signing/payload/session-policy changes.
- no RBAC scope expansion or role-policy changes.
- no new routes.
- no TypeORM entity, migration, repository, or persistence behavior changes.
- no changes to the accepted global ValidationPipe profile in this pass.
- no shared request-contract expansion (`LoginRequest` remains app-local in this pass).
- no custom stable `400` error-body contract in this pass.
- no stable malformed-JSON response-body contract in this pass.

## Behavior Rules
- DTO/class-validator is the accepted backend baseline for structured HTTP request validation.
- DTOs are transport-layer request validation objects.
- DTOs do not replace TypeORM entities, DB constraints, guards, services, or domain/auth rules.
- DTOs should live near the owning API feature/module unless docs/specs define another convention.
- baseline started at `POST /api/v1/auth/login`; current runtime applies the accepted ValidationPipe profile globally in API bootstrap, with login remaining the first concretely covered surface.
- future endpoints with structured request body/query params should follow this baseline unless a spec documents an exception.
- request contracts are not automatically added to `libs/shared/contracts`; `LoginRequest` remains app-local in this pass.
- error-status behavior is the stable contract in this scope; framework-default error-body details remain non-stable unless explicitly documented.
- no custom stable `400` error-body contract is introduced in this pass.
- stable auth behavior in this pass:
  - malformed semantic login payloads return `400`.
  - malformed syntactic JSON sent to `POST /api/v1/auth/login` returns `400`.
  - invalid credentials return `401`.

### Behavior Matrix (Current State)
| Behavior | Endpoint / code path | Current status code | Body stability | Coverage | Evidence | State |
| --- | --- | --- | --- | --- | --- | --- |
| malformed login request body (semantic payload invalid for required string fields) | `POST /api/v1/auth/login` via `LoginRequestDto` + global `ValidationPipe` | `400` | not stable (framework ValidationPipe/BadRequest body) | unit + e2e | `apps/api/src/app/features/auth/dto/login-request.dto.ts`, `apps/api/src/main.ts`, `apps/api/src/app/features/auth/auth.controller.spec.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| malformed login request body (syntactically malformed JSON before controller) | `POST /api/v1/auth/login` request parsing path | `400` | not stable (framework parser/default error body) | e2e | `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| missing login email | `POST /api/v1/auth/login` (`email` missing) | `400` | not stable | unit + e2e | `apps/api/src/app/features/auth/dto/login-request.dto.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| missing login password | `POST /api/v1/auth/login` (`password` missing) | `400` | not stable | unit + e2e | `apps/api/src/app/features/auth/dto/login-request.dto.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| non-string login email/password | `POST /api/v1/auth/login` (`@IsString`) | `400` | not stable | unit + e2e | `apps/api/src/app/features/auth/dto/login-request.dto.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| blank login email/password | `POST /api/v1/auth/login` (`trim` transform + `@IsNotEmpty`) | `400` | not stable | unit + e2e | `apps/api/src/app/features/auth/dto/login-request.dto.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| invalid credentials | `POST /api/v1/auth/login` via `AuthCoreService.issueTokenPairForCredentials(...)` | `401` | not stable | unit + e2e | `apps/api/src/app/features/auth/auth-core.service.ts`, `apps/api/src/app/features/auth/auth-core.service.spec.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| missing refresh cookie | `POST /api/v1/auth/refresh` (`Missing refresh token.`) | `401` | not stable | unit + e2e | `apps/api/src/app/features/auth/auth.controller.ts`, `apps/api/src/app/features/auth/auth.controller.spec.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| invalid/rotated refresh token | `POST /api/v1/auth/refresh` via `verifyRefreshToken(...)` and rotation checks | `401` | not stable | unit + e2e | `apps/api/src/app/features/auth/auth-core.service.ts`, `apps/api/src/app/features/auth/auth-core.service.spec.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| accessing protected auth endpoint without access token | `GET /api/v1/auth/me` with `JwtAccessAuthGuard` and JWT strategy | `401` | not stable | e2e | `apps/api/src/app/features/auth/auth.controller.ts`, `apps/api/src/app/features/auth/jwt-access-auth.guard.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| accessing RBAC-protected users endpoint without token | `GET /api/v1/users` with `JwtAccessAuthGuard` + `RolesGuard` | `401` | intentionally not stable body for `401`/`403`; status is stable | unit + e2e | `apps/api/src/app/features/users/users.controller.ts`, `apps/api/src/app/features/auth/roles.guard.spec.ts`, `apps/api-e2e/src/api/users.spec.ts`, `specs/first-meaningful-rbac-protected-route-decision.md` | accepted current behavior |
| accessing RBAC-protected users endpoint with insufficient role | `GET /api/v1/users` with role check (`user` vs required `admin`) | `403` | intentionally not stable body for `401`/`403`; status is stable | unit + e2e | `apps/api/src/app/features/auth/roles.guard.ts`, `apps/api/src/app/features/auth/roles.guard.spec.ts`, `apps/api-e2e/src/api/users.spec.ts`, `specs/first-meaningful-rbac-protected-route-decision.md` | accepted current behavior |
| successful authorized access (contrast): authenticated profile | `GET /api/v1/auth/me` with valid bearer token | `200` | stable shape (shared `AuthMeResponse`) | e2e | `libs/shared/contracts/src/lib/contracts.ts`, `apps/api/src/app/features/auth/auth.controller.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| successful authorized access (contrast): admin users list | `GET /api/v1/users` as `admin` | `200` | stable shape (shared `UsersListResponse`) | unit + e2e | `libs/shared/contracts/src/lib/contracts.ts`, `apps/api/src/app/features/users/users.controller.ts`, `apps/api/src/app/features/users/users.service.spec.ts`, `apps/api-e2e/src/api/users.spec.ts`, `specs/first-meaningful-rbac-protected-route-decision.md` | accepted current behavior |

## Forbidden Behavior
- treating framework-default error-body fields/messages as stable API contract when docs/tests do not lock them.
- changing auth status-code semantics (`400/401/403`) while implementing DTO validation.
- widening shared contracts with login request internals in this pass.
- changing accepted global validation rollout behavior without explicit spec/decision scope.
- introducing email-format validation in this pass without explicit accepted behavior update.

## Affected Domains/Modules
- domains:
  - auth transport invalid-input handling.
  - auth/session error handling.
  - RBAC route-level allow/deny behavior for users list.
- modules/files:
  - `apps/api/src/app/features/auth/dto/*`
  - `apps/api/src/app/features/auth/auth.controller.ts`
  - `apps/api/src/app/features/auth/auth.controller.spec.ts`
  - `apps/api-e2e/src/api/auth.spec.ts`
  - `DECISIONS.md`
  - `ARCHITECTURE.md`
  - `DECISIONS.md`

## Design Placement Summary
- DTO/class-validator request validation belongs in API transport layer near the owning route/controller.
- DTOs stay app-local by default in this scope (`LoginRequest` is app-local).
- persistence and domain/auth rules remain in entities/migrations/services/guards as already documented.

## Relevant Local Skills
- skills inspected:
  - `nestjs-best-practices`
  - `jwt-security`
  - `nx-workspace-patterns`
- skills used:
  - `nestjs-best-practices`
  - `jwt-security`
  - `nx-workspace-patterns`
- why each skill is relevant:
  - `nestjs-best-practices`: DTO/class-validator + pipe placement for transport validation.
  - `jwt-security`: ensure no token/session behavior drift while changing login input validation.
  - `nx-workspace-patterns`: gate command discipline in Nx workspace.
- conflicts/tensions with project docs/spec:
  - `jwt-security` prefers asymmetric signing in general; project accepted HS256 baseline remains unchanged in this pass.

## Edge Cases
- malformed JSON before controller now has a stable status-level contract (`400`) for `POST /api/v1/auth/login`; response body remains non-stable in this pass.
- no stable framework error-body field/message contract is introduced for `400/401/403`.
- no email-format validation is added in this pass; only string/non-blank validation is required.

## Risks
- risk 1 and mitigation:
  - risk: accidental behavior drift on non-login endpoints.
  - mitigation: keep accepted global rollout profile active and continue asserting unchanged auth status semantics on affected flows.
- risk 2 and mitigation:
  - risk: accidental contract-locking on framework error-body details.
  - mitigation: keep status-code-level contract only for error behavior unless explicitly documented.
- risk 3 and mitigation:
  - risk: scope creep into shared-contract or auth policy changes.
  - mitigation: keep `LoginRequest` app-local and preserve JWT/session/RBAC/persistence behavior.

## Test Plan
- unit tests:
  - update auth controller unit tests for DTO + accepted global validation behavior (missing/non-string/blank/unknown + trim behavior).
  - keep auth core/jwt strategy/roles guard tests unchanged.
- integration/e2e tests:
  - preserve malformed-login `400` matrix in `apps/api-e2e/src/api/auth.spec.ts`.
  - assert malformed syntactic JSON sent to `POST /api/v1/auth/login` returns status `400` only.
  - preserve invalid credentials `401`.
  - preserve login success, refresh/logout/auth-me, and users RBAC route behavior.
- regression coverage:
  - malformed JSON parse-path auth contract is covered by dedicated login e2e assertion (`400` status only).

## Required Gates
Use commands from [`../docs/commands-reference.md`](../docs/commands-reference.md).
- `npx nx run api:lint`
- `npx nx run api:test`
- `npx nx run api:build`
- `npx nx e2e api-e2e`

## Acceptance Checks
- DTO/class-validator baseline is explicitly accepted for structured backend request validation.
- login route is first concrete implementation with app-local DTO scope.
- malformed semantic login payloads return `400`; malformed syntactic JSON for login returns `400`; invalid credentials return `401`.
- no custom stable `400` error-body contract is introduced.
- framework-default error body remains non-stable unless explicitly documented.
- no JWT/session/RBAC/persistence/shared-contract-scope drift is introduced.

## Documentation Updates Needed
- docs to update:
  - `DECISIONS.md`
  - `specs/global-validationpipe-rollout-decision.md` (consistency wording only)

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - required and completed in this pass.
  - entry: `2026-04-28 - Stabilize malformed syntactic login JSON status contract`.

