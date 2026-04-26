# Feature Spec (Core Change)

## Feature/Change Name
- name: Auth invalid-input and auth error behavior baseline contract

## Date
- yyyy-mm-dd: 2026-04-27

## Status
- Accepted
- lifecycle note:
  - this spec documents current implemented behavior and existing evidence.
  - this spec does not introduce runtime behavior changes.

## Problem
- auth invalid-input and auth error behavior exists in code/tests but was not captured in one explicit contract-style matrix.
- without a focused baseline, future validation hardening could accidentally change status semantics or over-lock framework-default error bodies.

## Non-Goals
- no runtime auth/session/JWT/RBAC changes.
- no DTO/class-validator/class-transformer introduction in this pass.
- no ValidationPipe/global-pipe rollout in this pass.
- no new routes.
- no RBAC scope expansion.
- no shared request-contract expansion (`LoginRequest` remains deferred).
- no custom `400` error-body contract unless explicitly accepted in a future scope.

## Behavior Rules
- this spec records current status-code behavior and coverage evidence for auth invalid-input and auth error paths.
- for error responses, status codes are the stable contract where documented; framework-default body details are not stable unless explicitly documented as stable.
- response contracts for successful `200/201` auth/user paths remain aligned with accepted shared contract shapes.
- DTO/class-validator input-pipeline work remains optional future hardening (not a current requirement) per `docs/auth-security-baseline.md`.

### Behavior Matrix (Current State)
| Behavior | Endpoint / code path | Current status code | Body stability | Coverage | Evidence | State |
| --- | --- | --- | --- | --- | --- | --- |
| malformed login request body (semantic payload invalid for required string fields) | `POST /api/v1/auth/login` via `AuthController.readRequiredString(...)` | `400` | not stable (`BadRequestException` body is framework-shaped, no strict body contract) | unit (partial), no dedicated e2e malformed-body matrix | `apps/api/src/app/features/auth/auth.controller.ts`, `apps/api/src/app/features/auth/auth.controller.spec.ts` | accepted current behavior |
| malformed login request body (syntactically malformed JSON before controller) | `POST /api/v1/auth/login` request parsing path | not explicitly documented in current accepted docs/specs; runtime expected to be framework-handled | not stable | missing dedicated unit/e2e coverage in current baseline | absence of explicit case in `apps/api-e2e/src/api/auth.spec.ts` and baseline docs/specs | unresolved |
| missing login email | `POST /api/v1/auth/login` (`email` undefined -> `BadRequestException`) | `400` | not stable | unit | `apps/api/src/app/features/auth/auth.controller.ts`, `apps/api/src/app/features/auth/auth.controller.spec.ts` | accepted current behavior |
| missing login password | `POST /api/v1/auth/login` (`password` undefined -> `BadRequestException`) | `400` | not stable | code path exists, explicit dedicated test missing | `apps/api/src/app/features/auth/auth.controller.ts` | accepted current behavior with coverage gap |
| non-string login email/password | `POST /api/v1/auth/login` (`typeof value !== 'string'`) | `400` | not stable | code path exists, explicit dedicated test missing | `apps/api/src/app/features/auth/auth.controller.ts` | accepted current behavior with coverage gap |
| blank login email/password | `POST /api/v1/auth/login` (`trim() === ''`) | `400` | not stable | unit (blank password covered), no dedicated e2e malformed-body matrix | `apps/api/src/app/features/auth/auth.controller.ts`, `apps/api/src/app/features/auth/auth.controller.spec.ts` | accepted current behavior with partial coverage |
| invalid credentials | `POST /api/v1/auth/login` via `AuthCoreService.issueTokenPairForCredentials(...)` | `401` | not stable | both (unit + e2e) | `apps/api/src/app/features/auth/auth-core.service.ts`, `apps/api/src/app/features/auth/auth-core.service.spec.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| missing refresh cookie | `POST /api/v1/auth/refresh` (`Missing refresh token.`) | `401` | not stable | unit, no dedicated e2e missing-cookie case | `apps/api/src/app/features/auth/auth.controller.ts`, `apps/api/src/app/features/auth/auth.controller.spec.ts` | accepted current behavior with e2e gap |
| invalid/rotated refresh token | `POST /api/v1/auth/refresh` via `verifyRefreshToken(...)` and rotation checks | `401` | not stable | both (unit + e2e) | `apps/api/src/app/features/auth/auth-core.service.ts`, `apps/api/src/app/features/auth/auth-core.service.spec.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| accessing protected auth endpoint without access token | `GET /api/v1/auth/me` with `JwtAccessAuthGuard` and JWT strategy | `401` | not stable | e2e | `apps/api/src/app/features/auth/auth.controller.ts`, `apps/api/src/app/features/auth/jwt-access-auth.guard.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| accessing RBAC-protected users endpoint without token | `GET /api/v1/users` with `JwtAccessAuthGuard` + `RolesGuard` | `401` | intentionally not stable body for `401`/`403` on this route; status is stable | both (unit guard semantics + e2e route) | `apps/api/src/app/features/users/users.controller.ts`, `apps/api/src/app/features/auth/roles.guard.spec.ts`, `apps/api-e2e/src/api/users.spec.ts`, `docs/specs/first-meaningful-rbac-protected-route-decision.md` | accepted current behavior |
| accessing RBAC-protected users endpoint with insufficient role | `GET /api/v1/users` with role check (`user` vs required `admin`) | `403` | intentionally not stable body for `401`/`403` on this route; status is stable | both (unit guard semantics + e2e route) | `apps/api/src/app/features/auth/roles.guard.ts`, `apps/api/src/app/features/auth/roles.guard.spec.ts`, `apps/api-e2e/src/api/users.spec.ts`, `docs/specs/first-meaningful-rbac-protected-route-decision.md` | accepted current behavior |
| successful authorized access (contrast): authenticated profile | `GET /api/v1/auth/me` with valid bearer token | `200` | stable shape (shared `AuthMeResponse`) | e2e | `libs/shared/contracts/src/lib/contracts.ts`, `apps/api/src/app/features/auth/auth.controller.ts`, `apps/api-e2e/src/api/auth.spec.ts` | accepted current behavior |
| successful authorized access (contrast): admin users list | `GET /api/v1/users` as `admin` | `200` | stable shape (shared `UsersListResponse`) | both (unit + e2e) | `libs/shared/contracts/src/lib/contracts.ts`, `apps/api/src/app/features/users/users.controller.ts`, `apps/api/src/app/features/users/users.service.spec.ts`, `apps/api-e2e/src/api/users.spec.ts`, `docs/specs/first-meaningful-rbac-protected-route-decision.md` | accepted current behavior |

## Forbidden Behavior
- treating framework-default error body fields/messages as stable API contract when docs/tests do not lock them.
- changing auth status-code semantics (`400/401/403`) in the name of documentation cleanup.
- widening shared contracts with login request internals in this baseline.
- converting optional validation hardening into a required immediate implementation scope.

## Affected Domains/Modules
- domains:
  - auth transport invalid-input handling.
  - auth/session error handling.
  - RBAC route-level allow/deny behavior for users list.
- modules/files likely affected:
  - `docs/auth-security-baseline.md`
  - `docs/specs/auth-invalid-input-auth-error-behavior-baseline.md`
  - evidence sources in `apps/api/src/app/features/auth/*`, `apps/api/src/app/features/users/*`, and `apps/api-e2e/src/api/*`

## Design Placement Summary
- detailed behavior matrix belongs in a focused spec under `docs/specs/*`.
- canonical auth baseline doc (`docs/auth-security-baseline.md`) should keep a concise summary and link to this detailed spec.
- implementation details remain in API feature modules and tests; this pass does not move logic.

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
  - `nestjs-best-practices`: error-handling and validation documentation framing.
  - `jwt-security`: token error-path semantics and security-sensitive auth documentation.
  - `nx-workspace-patterns`: test/gate/workflow alignment for monorepo docs updates.
- conflicts/tensions with project docs/spec:
  - skills generally recommend DTO/class-validator pipelines; project baseline keeps that as optional future hardening.
- project-compatible decision:
  - document and lock current behavior first; keep DTO/class-validator as optional follow-up hardening only.

## Edge Cases
- malformed JSON parse errors before controller execution are not currently documented as a stable contract in this baseline.
- invalid-login permutations are partially covered in unit tests and not fully enumerated in API e2e.
- missing-refresh-cookie behavior is unit-covered but lacks a dedicated API e2e assertion.

## Risks
- risk 1 and mitigation:
  - risk: accidental over-commitment to unstable framework error-body details.
  - mitigation: explicitly mark non-stable error body details for `400/401/403` unless already accepted.
- risk 2 and mitigation:
  - risk: future validation hardening changes status semantics unintentionally.
  - mitigation: keep this explicit status/coverage matrix as pre-hardening baseline.
- risk 3 and mitigation:
  - risk: scope creep into implementation work during docs pass.
  - mitigation: explicit non-goals and no runtime-code changes in this pass.

## Test Plan
- unit tests:
  - existing `auth.controller`, `auth-core.service`, `jwt-access.strategy`, and `roles.guard` tests remain evidence sources.
- integration/e2e tests:
  - existing `apps/api-e2e/src/api/auth.spec.ts` and `apps/api-e2e/src/api/users.spec.ts` remain evidence sources.
- regression coverage:
  - no runtime changes in this pass; regression execution deferred.
- anti-hack coverage for behavior changes (general rule coverage, not only the shown example):
  - reject example-specific patches.
  - reject hardcoded special cases when the real rule is broader.
  - reject wrong-layer business-rule placement.

## Required Gates
Use commands from [`../commands-reference.md`](../commands-reference.md).
- tiny/local gates (if applicable):
  - docs-only, no runtime impact: gates may be skipped per `commands-reference.md` section `8.1`.
- normal implementation gates (if applicable):
  - n/a (no implementation changes in this pass).
- core gates:
  - n/a (no runtime behavior changes; documentation/spec pass only).
- additional domain gates (if applicable):
  - n/a.
- manual/proposed checks:
  - confirm no production code files changed.
  - confirm spec text aligns with current docs/code/tests evidence only.

## Acceptance Checks
- requested auth invalid-input/error behaviors are explicitly documented with endpoint, status, body-stability note, coverage state, and evidence.
- accepted behavior, optional future hardening, and unresolved gaps are explicitly separated.
- `401/403` body-stability constraints remain aligned with accepted RBAC spec and baseline docs.
- no runtime behavior changes are introduced.

## Documentation Updates Needed
- docs to update:
  - `docs/auth-security-baseline.md` to reference this spec from the auth status/baseline section.

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - not required in this pass.
  - reason: this documents existing behavior; no new long-lived policy/architecture decision is introduced.
