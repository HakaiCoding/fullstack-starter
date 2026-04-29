# Feature Spec (Core Change)

## Feature/Change Name
- name: Stable API error response envelope baseline (400/401/403)

## Date
- yyyy-mm-dd: 2026-04-29

## Status
- Accepted
- lifecycle note:
  - first reusable slice that stabilizes response-body envelopes for existing baseline error cases only.
  - supersedes prior "error body intentionally non-stable" wording for covered `400/401/403` cases in older auth/validation/RBAC baseline docs.

## Problem
- current baseline specs/decisions stabilize status codes for auth/validation/RBAC error paths, but response-body contracts remained framework-default/non-stable.
- framework-default error bodies (`ValidationPipe`/Nest/Passport/parser paths) are not a reliable public contract for cross-app/API clients.
- a minimal stable error envelope is needed without expanding into unrelated auth/IAM/registration/pagination/frontend scope.

## Non-Goals
- no registration/user-management scope expansion.
- no pagination/filter/sort/query-contract work.
- no JWT/session semantics changes.
- no RBAC policy expansion beyond current baseline route coverage.
- no stable contract for non-baseline statuses (`404/405/409/422/429/500` etc.) in this slice.
- no localization/i18n error-message policy.
- no endpoint-specific one-off error body shapes.

## Behavior Rules
- stable public error envelope for covered baseline statuses:

```json
{
  "statusCode": 400,
  "error": {
    "code": "REQUEST_VALIDATION_FAILED",
    "message": "Request validation failed.",
    "details": ["email must be a string"]
  }
}
```

- stable guaranteed fields:
  - top-level `statusCode`.
  - top-level `error`.
  - `error.code`.
  - `error.message`.
- stable `error.code` set for this first slice:
  - `REQUEST_VALIDATION_FAILED`
  - `REQUEST_UNKNOWN_FIELD`
  - `REQUEST_MALFORMED_JSON`
  - `AUTH_UNAUTHENTICATED`
  - `AUTH_INVALID_CREDENTIALS`
  - `AUTH_INVALID_OR_EXPIRED_TOKEN`
  - `AUTH_FORBIDDEN`
- intentionally non-stable in this slice:
  - `error.details` content wording/order (framework/source-message dependent).
  - any unsupported/extra fields not listed as stable guarantees.
  - non-covered status families and non-covered endpoint/error paths.

### Covered Case Mapping (First Slice)
| Case | Endpoint/path (current baseline) | HTTP status | Stable `error.code` |
| --- | --- | --- | --- |
| DTO semantic validation failure | `POST /api/v1/auth/login` body DTO validation | `400` | `REQUEST_VALIDATION_FAILED` |
| DTO unknown extra field | `POST /api/v1/auth/login` with non-whitelisted field | `400` | `REQUEST_UNKNOWN_FIELD` |
| malformed syntactic JSON | `POST /api/v1/auth/login` malformed JSON payload | `400` | `REQUEST_MALFORMED_JSON` |
| unauthenticated protected-route access (missing auth context) | `GET /api/v1/auth/me`, `GET /api/v1/users` without auth credentials | `401` | `AUTH_UNAUTHENTICATED` |
| invalid credentials | `POST /api/v1/auth/login` wrong email/password | `401` | `AUTH_INVALID_CREDENTIALS` |
| invalid/expired token behavior | `POST /api/v1/auth/refresh` invalid/rotated token; protected routes with invalid bearer token | `401` | `AUTH_INVALID_OR_EXPIRED_TOKEN` |
| authenticated but unauthorized RBAC access | `GET /api/v1/users` as `user` role (admin required) | `403` | `AUTH_FORBIDDEN` |

## Forbidden Behavior
- exposing framework-default `statusCode/error/message` structures as implicit contract instead of the stable envelope above.
- adding endpoint-specific error body variants for covered baseline cases.
- moving API-internal exception/filter implementation details into shared contracts.
- expanding scope into IAM/permissions matrix/registration/pagination/frontend architecture.

## Affected Domains/Modules
- domains:
  - API transport-layer error normalization.
  - shared external API contract typing for stable error envelope.
  - auth/validation/RBAC contract verification tests.
- modules/files likely affected:
  - `apps/api/src/app/system/*` (error normalization/filter wiring)
  - `apps/api/src/main.ts`
  - `apps/api-e2e/src/api/auth.spec.ts`
  - `apps/api-e2e/src/api/users.spec.ts`
  - `libs/shared/contracts/src/lib/contracts.ts`
  - `libs/shared/contracts/src/lib/contracts.spec.ts`
  - `DECISIONS.md`

## Design Placement Summary
- where logic should live and why:
  - normalization/filter behavior belongs in API transport/system layer (`apps/api/src/app/system/*`) as cross-cutting HTTP response shaping.
  - public error response types belong in `libs/shared/contracts` because this is an API/web external contract surface.
- where logic should not live:
  - no error-envelope policy in controllers/services/entities.
  - no filter/exception internals exported through shared contracts.
  - no domain/business-rule changes inside the normalization layer.

## Relevant Local Skills
- policy authority: [`../AI_SKILLS.md`](../AI_SKILLS.md)
- skills inspected:
  - `nestjs-best-practices`
  - `jwt-security`
  - `nx-workspace-patterns`
- skills used:
  - `nestjs-best-practices` (exception-filter and transport-layer placement patterns)
  - `jwt-security` (preserve existing auth/token semantics while changing response envelope)
  - `nx-workspace-patterns` (gate execution discipline in Nx workspace)
- why each skill is relevant:
  - supports safe placement and verification for cross-cutting API transport behavior.
- conflicts/tensions with project docs/spec:
  - `jwt-security` generally recommends asymmetric JWT signing; project accepted HS256 baseline remains unchanged and authoritative.
- project-compatible decision:
  - keep auth/token semantics unchanged and constrain this change to response-envelope contract normalization.

## Edge Cases
- malformed JSON parsing errors are normalized to `REQUEST_MALFORMED_JSON` for covered baseline path.
- mixed validation failures (non-whitelist + other constraints) use `REQUEST_VALIDATION_FAILED` unless the failure is purely unknown-field.
- stale/rotated refresh token failures stay `401` and are mapped to `AUTH_INVALID_OR_EXPIRED_TOKEN`.

## Risks
- risk 1 and mitigation:
  - risk: accidental behavior drift in auth status semantics.
  - mitigation: keep accepted `400/401/403` statuses unchanged; only normalize body envelope.
- risk 2 and mitigation:
  - risk: over-coupling clients to framework message details.
  - mitigation: stabilize `error.code` + `error.message`; keep `details` explicitly non-stable.
- risk 3 and mitigation:
  - risk: scope creep into non-baseline statuses/flows.
  - mitigation: explicit first-slice coverage table and non-goals.

## Test Plan
- unit tests:
  - add API normalizer unit tests for covered code mapping (`400/401/403`) and non-covered status passthrough behavior.
  - update shared contract type tests for new error contract types.
- integration/e2e tests:
  - update auth e2e assertions to require stable envelope + code for covered `400/401` cases.
  - update users RBAC e2e assertions to require stable envelope + code for covered `401/403` cases.
- regression coverage:
  - preserve existing success-path contract/status behavior for login/refresh/logout/me/users.
- anti-hack coverage for behavior changes (general rule coverage, not only the shown example):
  - reject example-specific patches.
  - reject hardcoded special cases when the real rule is broader.
  - reject wrong-layer business-rule placement.

## Required Gates
Use commands from [`../docs/commands-reference.md`](../docs/commands-reference.md).
- tiny/local gates (if applicable):
  - n/a (`core` change scope).
- normal implementation gates (if applicable):
  - n/a (`core` change scope).
- core gates:
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e`
  - `npx nx e2e web-e2e`
- additional domain gates (if applicable):
  - auth/security overlay (`8.4`) is included within the above but remains required behaviorally.
  - e2e-relevant overlay (`8.6`) applies because API contract/auth flow behavior is changed.
- manual/proposed checks:
  - confirm architecture boundary placement in `ARCHITECTURE.md`.
  - explicitly report any skipped gates.

## Acceptance Checks
- stable `400/401/403` envelope exists for covered baseline cases with stable `statusCode/error/code/error/message`.
- stable code mapping for covered baseline cases matches this spec.
- covered auth/validation/RBAC status semantics remain unchanged.
- public error response types are available from `libs/shared/contracts`.
- API-internal normalization/filter/exception details remain app-local.
- tests prove general mapping behavior across covered cases, not one-off payload hacks.

## Documentation Updates Needed
- docs to update:
  - add this spec.
  - update related decision log entry in `DECISIONS.md`.
- guidance:
  - older specs that previously declared covered `400/401/403` body details non-stable should be treated as superseded by this accepted spec for covered cases.

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - required: add accepted decision entry for stable baseline API error envelope and code set.
