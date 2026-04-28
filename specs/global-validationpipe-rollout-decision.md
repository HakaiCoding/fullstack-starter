# Feature Spec (Core Change)

## Feature/Change Name
- name: Dedicated global ValidationPipe rollout decision for API transport validation

## Date
- yyyy-mm-dd: 2026-04-27

## Status
- Proposed
- lifecycle note:
  - dedicated follow-up spec for broader/global `ValidationPipe` rollout policy.
  - this revision documents the preferred target policy and implementation prerequisites only.
  - this pass remains documentation/design only and does not implement runtime rollout.

## Problem
- DTO/class-validator is accepted as backend structured request-validation baseline, but only `POST /api/v1/auth/login` currently applies route-level `ValidationPipe`.
- a reviewable preferred target global ValidationPipe policy is needed before runtime rollout.
- rollout without explicit policy + compatibility constraints risks regressions in accepted auth/RBAC status behavior and future DTO surfaces.

## Current Baseline (Verified)
- accepted baseline from docs/decisions:
  - DTO/class-validator is accepted for structured request validation at API transport layer.
  - first concrete implementation scope is `POST /api/v1/auth/login` only.
  - global validation rollout remains deferred until explicit approval.
- current code state:
  - `apps/api/src/main.ts` does **not** register `app.useGlobalPipes(...)`.
  - `apps/api/src/app/features/auth/auth.controller.ts` applies route-level `@UsePipes(new ValidationPipe({ transform: true }))` on `POST /auth/login`.
  - `apps/api/src/app/features/auth/dto/login-request.dto.ts` validates and trims `email`/`password` with class-validator/class-transformer.
- current accepted behavior posture:
  - stable contract is status-code level for auth invalid-input/error behavior.
  - framework-default `400/401/403` response body details are not a stable contract.
  - malformed JSON parse behavior is not an accepted stable contract in current docs.

## Status and Scope Distinctions
- `Accepted` today:
  - login malformed semantic payload -> `400`.
  - invalid login credentials -> `401`.
  - protected-route auth/RBAC status semantics remain `401`/`403` as already accepted.
- `Proposed` in this spec:
  - preferred target global ValidationPipe profile and unknown-field contract for DTO-bound requests.
- `Deferred`:
  - runtime activation of global pipe.
  - any stable malformed-JSON contract.
  - any stable framework validation error-body contract.

## Non-Goals
- do not implement global `ValidationPipe` in this pass.
- do not edit runtime code, DTOs, controllers, bootstrap, tests, auth flow, RBAC, persistence, or shared contracts.
- do not introduce a stable custom `400` error-body contract unless separately accepted.
- do not treat malformed-JSON parser behavior as part of this decision.

## Preferred Target Policy (Proposed, Not Implemented)
```ts
new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
});
```

## Why This Policy Is Preferred
- aligns with the current login baseline that already uses `transform: true`.
- rejects unknown fields explicitly for DTO-bound requests instead of silently ignoring them.
- supports NestJS/class-transformer DTO conversion behavior globally.
- reduces repetitive per-route primitive parsing where DTO metadata is present.

## Endpoint and Input Surface Inventory (Current API)
| Endpoint | Input surface now | Guard/Auth dependency | DTO coverage now | Current validation mechanism | Global rollout sensitivity |
| --- | --- | --- | --- | --- | --- |
| `GET /api/v1` | none | none | n/a | none | none |
| `GET /api/v1/health/db` | none | none | n/a | none | none |
| `POST /api/v1/auth/login` | JSON body (`email`, `password`) | public | **yes** (`LoginRequestDto`) | route-level `ValidationPipe({ transform: true })` | **high** |
| `POST /api/v1/auth/refresh` | cookie header only | public | none | manual cookie extraction + auth service checks | low now; medium if DTO input added later |
| `POST /api/v1/auth/logout` | cookie header only | public | none | manual cookie extraction + auth service checks | low now; medium if DTO input added later |
| `GET /api/v1/auth/me` | bearer token header only | `JwtAccessAuthGuard` | none | guard + strategy | low now; medium if DTO query/params added later |
| `GET /api/v1/users` | bearer token header only | `JwtAccessAuthGuard` + `RolesGuard` | none | guards + service | low now; medium if DTO query/params added later |

## Unknown-Field Contract (Proposed)
- DTO-bound requests with extra unknown fields should return `400` under preferred target policy (`whitelist: true` + `forbidNonWhitelisted: true`).
- login is the first concrete surface where this behavior must be verified in implementation.
- tests should assert status (`400`) unless a separate accepted decision later stabilizes validation error-body shape.

## Compatibility and Risk Analysis
### 1) `enableImplicitConversion: true`
- risk: future query/param/body DTOs may coerce primitive strings into numbers/booleans.
- risk: implicit conversion may influence branch behavior if future handlers depend on coerced values.
- mitigation: numeric/boolean conversion behavior must be covered by DTO-specific tests when those fields are introduced.

### 2) Routes without DTOs
- risk: false sense that all routes are validated after global pipe rollout.
- mitigation: do not assume validation coverage for routes with no DTO-bound input.

### 3) Auth/RBAC status behavior
- risk: rollout unintentionally changes status precedence or semantics.
- mitigation: accepted auth behavior must remain unchanged:
  - malformed semantic login payload -> `400`.
  - invalid credentials -> `401`.
  - protected routes keep accepted `401`/`403` behavior.

### 4) Shared contract scope
- risk: request DTOs get incorrectly promoted into shared contracts.
- mitigation: request DTOs remain app-local unless a separate spec/decision expands scope.

## Malformed JSON and Error-Body Boundaries
- malformed JSON parser-layer behavior remains separate from this ValidationPipe decision.
- framework-default error response body details remain intentionally non-stable in this scope.
- no stable custom `400` validation error-body contract is introduced by this spec.

## Implementation Prerequisites (Future Runtime Pass)
- unit:
  - update/add login tests for unknown-field rejection (`400`) on DTO-bound payloads.
  - verify malformed semantic login payload behavior remains `400`.
  - verify invalid credentials remain `401`.
  - preserve guard/strategy behavior checks for `401`/`403` semantics.
- e2e:
  - retain existing auth/users status assertions.
  - add targeted e2e for login unknown-field rejection status (`400`).
  - verify protected-route `401`/`403` behavior remains unchanged.
  - for future DTO fields using numeric/boolean primitives, add DTO-specific conversion/rejection tests.
- regression:
  - verify auth refresh/logout/me and users RBAC flows remain unchanged.

## Later Implementation Boundary (Post-Approval Only)
1. apply global pipe in API bootstrap (`apps/api/src/main.ts`) only after explicit policy approval.
2. no DTO/shared-contract expansion unless separately required by accepted scope.
3. no auth/RBAC behavior changes as part of the rollout.

## Required Gates
Use commands from [`../docs/commands-reference.md`](../docs/commands-reference.md).
- this documentation/design pass:
  - docs-only (`tiny/local`) change; no doc-specific automated gate is currently documented.
  - per docs, runtime gates may be skipped with explicit reporting.
- future implementation pass (if approved):
  - core + auth/security + e2e-relevant gates per `docs/commands-reference.md` sections `8.3`, `8.4`, and `8.6`.

## Acceptance Checks
- spec remains clearly `Proposed`.
- preferred target global ValidationPipe profile is explicitly documented.
- unknown-field DTO-bound `400` behavior is explicitly documented as proposed contract.
- accepted auth/RBAC status behavior is explicitly preserved.
- malformed JSON remains out of scope for this decision.
- framework error-body stability remains non-stable in this scope.
- no runtime behavior is changed in this pass.
- no accepted `DECISIONS.md` entry is added in this pass.

## Safety Rule for Missing Details
- "Inspect the relevant docs/spec/code. If the requirement is already documented, follow it. If it is not documented, report the gap and either propose a minimal safe option for approval or update the spec only if the project workflow allows that. Do not implement the unresolved detail as though it were already decided."

## Relevant Local Skills
- skills inspected:
  - `nestjs-best-practices`
  - `jwt-security`
  - `typescript-advanced-types`
- skills used:
  - `nestjs-best-practices` (validation/pipe policy framing and execution-order risk framing)
  - `jwt-security` (auth precedence safety posture; no auth-flow semantic drift)
  - `typescript-advanced-types` (typing discipline reference; no direct authority for rollout policy)
- conflicts/tensions with project docs/spec:
  - none blocking in this pass.
  - skills remain guidance only; accepted project docs/specs/decisions remain authoritative.
- project-compatible decision:
  - keep this spec proposed and implementation-blocked pending approval.

## Documentation Updates Needed
- docs updated in this pass:
  - `specs/global-validationpipe-rollout-decision.md` (preferred target policy + risks + prerequisites refresh)
- docs intentionally not updated in this pass:
  - `DECISIONS.md` (no accepted rollout decision yet)
  - `specs/auth-invalid-input-auth-error-behavior-baseline.md` (accepted baseline remains unchanged in this docs-only update)

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - not in this pass.
  - before runtime implementation, add a rollout decision entry (at least `Proposed`, then `Accepted` once approved).
