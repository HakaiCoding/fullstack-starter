# Feature Spec (Core Change)

## Feature/Change Name
- name: Dedicated global ValidationPipe rollout decision for API transport validation

## Date
- yyyy-mm-dd: 2026-04-27

## Status
- Proposed
- lifecycle note:
  - dedicated follow-up spec for broader/global `ValidationPipe` rollout policy.
  - this pass is documentation/design only and does not implement runtime rollout.

## Problem
- DTO/class-validator is now accepted as backend structured request-validation baseline, but only `POST /api/v1/auth/login` currently applies route-level `ValidationPipe`.
- broader/global rollout policy remains unresolved (`transform`, `enableImplicitConversion`, `whitelist`, `forbidNonWhitelisted`, unknown extra fields, and error-body stability posture).
- implementing global validation without explicit policy decisions risks accidental behavior changes across auth/RBAC flows and e2e expectations.

## Current Baseline (Verified)
- accepted baseline from docs/decisions:
  - DTO/class-validator is accepted for structured request validation at API transport layer.
  - first concrete implementation scope is `POST /api/v1/auth/login` only.
  - global validation rollout is explicitly deferred in current accepted docs.
- current code state:
  - `apps/api/src/main.ts` does **not** register `app.useGlobalPipes(...)`.
  - `apps/api/src/app/features/auth/auth.controller.ts` applies route-level `@UsePipes(new ValidationPipe({ transform: true }))` on `POST /auth/login`.
  - `apps/api/src/app/features/auth/dto/login-request.dto.ts` validates and trims `email`/`password` with class-validator/class-transformer.
- current accepted behavior posture:
  - stable contract is status-code level for auth invalid-input/error behavior.
  - framework-default `400/401/403` response body details are not currently a stable contract.
  - malformed JSON parse behavior is not currently an accepted stable contract.

## Non-Goals
- do not implement global `ValidationPipe` in this pass.
- do not migrate additional endpoints in this pass.
- do not change JWT signing, JWT payload semantics, refresh-session behavior, refresh rotation, cookie policy, single-session policy, or RBAC behavior.
- do not change TypeORM entities, migrations, repositories, or DB constraints.
- do not change shared response contracts or promote request DTOs into `libs/shared/contracts`.
- do not introduce a stable custom `400` error-body contract unless separately accepted.
- do not introduce malformed-JSON parse behavior as a stable contract unless separately accepted.
- do not add login email-format validation unless separately accepted.
- do not treat `whitelist`, `forbidNonWhitelisted`, `transform`, or implicit-conversion policy as accepted unless explicitly approved.

## Behavior Rules Already Accepted
- DTO/class-validator remains the backend structured request-validation baseline.
- request-validation DTOs are transport-layer objects and do not replace domain/persistence/auth rules.
- request DTOs remain app-local by default unless a spec/decision expands scope.
- existing login route-level behavior must remain stable:
  - malformed semantic login payloads return `400`.
  - invalid credentials return `401`.
- framework-default error bodies remain non-stable unless explicitly documented otherwise.

## Endpoint and Input Surface Inventory (Current API)
| Endpoint | Input surface now | Guard/Auth dependency | DTO coverage now | Current validation mechanism | Broader/global rollout sensitivity |
| --- | --- | --- | --- | --- | --- |
| `GET /api/v1` | none | none | n/a | none | none (no structured input) |
| `GET /api/v1/health/db` | none | none | n/a | none | none (no structured input) |
| `POST /api/v1/auth/login` | JSON body (`email`, `password`) | public | **yes** (`LoginRequestDto`) | route-level `ValidationPipe({ transform: true })` | **high** (policy choices can change `400` semantics for extras/transform) |
| `POST /api/v1/auth/refresh` | cookie header only | public | no body/query/params DTO needed today | manual cookie extraction + auth service checks | low today; medium if structured body/query gets added later |
| `POST /api/v1/auth/logout` | cookie header only | public | no body/query/params DTO needed today | manual cookie extraction + auth service checks | low today; medium if structured body/query gets added later |
| `GET /api/v1/auth/me` | bearer token header only | `JwtAccessAuthGuard` | no body/query/params DTO needed today | guard + strategy | low today; medium if query/params are introduced |
| `GET /api/v1/users` | bearer token header only | `JwtAccessAuthGuard` + `RolesGuard` | no body/query/params DTO needed today | guards + service | low today; medium if query/pagination params are introduced |

## DTO Coverage and Gaps
### Current coverage
- implemented DTO request validation:
  - `POST /api/v1/auth/login` -> `LoginRequestDto` (app-local).

### Current gaps (by structured input type)
- body DTO gaps:
  - no additional endpoint currently consumes structured JSON body that requires DTO validation.
- query DTO gaps:
  - no endpoint currently defines structured query contract; if/when introduced (for example users pagination/filter/sort), query DTO validation policy is unresolved.
- params DTO gaps:
  - no endpoint currently defines route params needing DTO or parse-pipe validation.

### Practical gap statement
- global rollout can only materially affect one existing structured request surface today (`POST /auth/login`), but policy chosen now will set behavior defaults for all future body/query/params surfaces.

## Global ValidationPipe Risk Analysis
### 1) Endpoints without DTOs
- risk: false sense of coverage if global pipe is enabled while routes still rely on raw primitives/manual parsing.
- current state: most routes have no structured body/query/params inputs; global rollout alone does not create missing DTO contracts.

### 2) Primitive `@Param`/`@Query` handling
- risk: global `transform` and/or implicit conversion can coerce strings into numbers/booleans in ways not yet specified by project policy.
- current state: no live params/query contracts to anchor accepted behavior yet.

### 3) `transform` behavior
- risk: widening `transform` globally can alter runtime types before handlers.
- current state: only login route currently opts into `transform: true`.

### 4) implicit conversion (`transformOptions.enableImplicitConversion`)
- risk: hidden coercion (`"1"` -> `1`, `"true"` -> `true`) can alter validation/authorization flow if later used in guards/services.
- current state: no accepted project policy for implicit conversion.

### 5) `whitelist`
- risk: silently stripping unknown fields can hide client bugs and alter compatibility expectations.
- current state: not accepted as baseline policy.

### 6) `forbidNonWhitelisted`
- risk: turning unknown fields into hard `400` may break existing clients posting extra fields.
- current state: not accepted as baseline policy.

### 7) Unknown extra fields on login
- risk: behavior change on `POST /auth/login` if strict whitelist policy is introduced.
- current state: route-level login validation does not set `whitelist`/`forbidNonWhitelisted`; extra-property behavior is not explicitly contracted.

### 8) Framework-default error response body stability
- risk: tests/docs might accidentally lock framework-specific validation message arrays/field order.
- current state: accepted docs intentionally keep these details non-stable.

### 9) Malformed JSON parse behavior
- risk: treating parser-level failures as stable contract without explicit acceptance.
- current state: intentionally unresolved/non-stable in accepted docs.

### 10) Guards/auth/RBAC interaction
- risk: unintended `400`/`401`/`403` precedence assumptions during rollout.
- current state:
  - existing auth/RBAC tests assert `401`/`403` status semantics.
  - no new guarded routes with DTO query/params currently exist.
  - rollout must preserve existing status-code behavior in auth/RBAC flows.

### 11) Shared-contract interaction
- risk: request DTOs being incorrectly promoted to `libs/shared/contracts`.
- current state: accepted policy keeps request DTOs app-local unless scope is explicitly approved.

### 12) E2E test expectation interaction
- risk: stricter global policy may require new/updated e2e expectations (especially unknown extra fields and future query/params).
- current state: e2e asserts login invalid payload `400` and auth/RBAC `401/403/200`; it does not lock validation-body shape.

## Proposed Rollout Options (Not Yet Accepted)
### Option A - Keep route-level only for now (defer global)
- summary: continue endpoint-by-endpoint DTO + route-level pipe adoption.
- pros:
  - lowest immediate blast radius.
  - no cross-endpoint behavior shift.
- cons:
  - duplicated pipe policy.
  - weaker consistency guarantees as endpoint count grows.

### Option B - Conservative global parity profile
- summary: enable one global `ValidationPipe` with conservative parity settings first, keep login behavior stable, and phase in DTOs.
- candidate policy:
  - `transform: true`
  - no accepted default yet for `whitelist`, `forbidNonWhitelisted`, `enableImplicitConversion`
- pros:
  - centralizes rollout with limited behavior drift from current login baseline.
  - easiest bridge toward future endpoint DTO adoption.
- cons:
  - still leaves unknown-field policy unresolved.
  - can be perceived as "global done" while DTO coverage remains partial.

### Option C - Strict global profile
- summary: adopt strict defaults now (for example `whitelist: true`, `forbidNonWhitelisted: true`, explicit decision on implicit conversion).
- pros:
  - strongest immediate input hardening posture.
  - deterministic unknown-field rejection.
- cons:
  - highest compatibility risk, especially for login and future clients.
  - requires explicit contract decisions/tests before safe adoption.

## Recommendation (Recommendation Only, Not Accepted)
- recommended minimal safe path: **Option B in phased form**, with explicit decision checkpoints before strict flags:
  1. approve global rollout with conservative parity intent first.
  2. preserve current login status-code behavior and non-stable error-body posture.
  3. defer `whitelist`/`forbidNonWhitelisted`/implicit-conversion to explicit follow-up decisions.
  4. require DTO definitions for any new structured body/query/params endpoint before claiming rollout completion.

## Behavior Questions Requiring Explicit Decision
- should global `ValidationPipe` be enabled now, or only after additional DTO-backed endpoints exist?
- if global is enabled, should baseline be `transform: true`?
- should implicit conversion be enabled globally (`enableImplicitConversion`)?
- should unknown fields be:
  - accepted/ignored,
  - stripped (`whitelist`), or
  - rejected (`forbidNonWhitelisted`)?
- should login endpoint explicitly guarantee behavior for unknown extra fields?
- should malformed JSON parse outcomes be documented as stable contract?
- should a custom stable `400` error-body contract be introduced, or remain framework-default/non-stable?
- should query/param validation baseline prefer DTO-class validation, built-in parse pipes, or a mixed policy?

## Migration Plan Options
### Plan 1: Decision-first, no runtime changes (this pass)
- deliver dedicated proposed spec and unresolved decision list.
- implementation blocked until policy approval.

### Plan 2: Conservative phased implementation (post-approval)
1. introduce global conservative policy (if approved) while preserving login behavior.
2. keep/verify login route behavior parity and auth/RBAC regression coverage.
3. add DTOs for next structured endpoint(s) before stricter policy.
4. separately decide strict flags (`whitelist`, `forbidNonWhitelisted`, implicit conversion) and migrate with targeted tests.

### Plan 3: Strict rollout (post-approval only)
1. approve strict policy and unknown-field contract.
2. add/complete DTO coverage for all structured inputs first.
3. enable strict global settings and update e2e/unit expectations accordingly.

## Test Plan (For Future Implementation Pass)
- unit:
  - controller-level validation behavior for login remains stable (`400` on malformed semantic payload, `401` invalid credentials).
  - add explicit tests for unknown extra fields only after policy choice is approved.
  - preserve guard/strategy tests for `401/403` semantics.
- e2e:
  - retain existing auth/users status assertions.
  - add targeted e2e for chosen unknown-field policy and any new query/param DTO endpoints.
  - avoid asserting framework-default validation body details unless explicitly accepted.
- regression:
  - verify auth refresh/logout/me and users RBAC remain unchanged across rollout.

## Required Gates
Use commands from [`../commands-reference.md`](../commands-reference.md).
- this documentation/design pass:
  - docs-only (`tiny/local`) change; no doc-specific automated gate is currently documented.
  - per docs, gates may be skipped for docs-only with explicit reporting.
- future implementation pass (if approved):
  - core + auth/security + e2e-relevant gates per `docs/commands-reference.md` sections `8.3`, `8.4`, and `8.6`.

## Acceptance Checks
- dedicated global-rollout decision/spec exists and is clearly marked `Proposed`.
- accepted baseline and current login-only implementation scope are correctly documented.
- affected endpoints and DTO coverage gaps are explicitly inventoried.
- unresolved policy decisions are listed and require explicit approval before implementation.
- no runtime behavior is changed in this pass.
- no accepted `DECISIONS.md` entry is added for this rollout policy in this pass.

## Rollback and Risk Mitigation Notes
- rollout should preserve route-level login behavior until global policy parity is proven.
- avoid coupling rollout to unrelated auth/session/RBAC/persistence/shared-contract changes.
- if future rollout causes regressions, revert global-pipe policy change and keep route-level validation while decisions are refined.

## Safety Rule for Missing Details
- "Inspect the relevant docs/spec/code. If the requirement is already documented, follow it. If it is not documented, report the gap and either propose a minimal safe option for approval or update the spec only if the project workflow allows that. Do not implement the unresolved detail as though it were already decided."

## Relevant Local Skills
- skills inspected:
  - `nestjs-best-practices`
  - `nx-workspace-patterns`
- skills used:
  - `nestjs-best-practices` (validation/pipe policy framing and risk surface)
  - `nx-workspace-patterns` (Nx command/gate workflow framing)
- conflicts/tensions with project docs/spec:
  - `nestjs-best-practices` generally promotes immediate strict global validation defaults.
  - project accepted docs currently defer global rollout and do not yet accept strict flag policy.
- project-compatible decision:
  - keep this spec proposed, preserve current accepted baseline, and require explicit policy approval before implementation.

## Documentation Updates Needed
- docs updated in this pass:
  - `docs/specs/global-validationpipe-rollout-decision.md` (new proposed spec)
- docs intentionally not updated in this pass:
  - `docs/DECISIONS.md` (no accepted rollout decision yet)

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - not in this pass.
  - add only after explicit user approval of chosen rollout policy (entry may be `Proposed` first, then moved to `Accepted` when approved).
