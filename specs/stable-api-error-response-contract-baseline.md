# Feature Spec (Core Change)

## Feature/Change Name
- name: Stable API error response envelope baseline expansion (400/401/403/404/409/500)

## Date
- yyyy-mm-dd: 2026-04-29

## Status
- Accepted
- lifecycle note:
  - initial accepted slice stabilized `400/401/403` envelope/codes for auth-validation-RBAC baseline behavior.
  - this accepted expansion adds stable envelope/codes for `404` and `409`, plus a sanitized stable fallback contract for `500` unexpected/unhandled server errors.

## Problem
- baseline API error envelope/codes were accepted only for `400/401/403`.
- `404`, `409`, and `500` were either framework-default, partially handled, or non-contract, which risks client/test drift and leakage on server failures.
- a narrow hardening slice is needed without introducing unrelated product scope or broad domain-error frameworks.

## Non-Goals
- no registration/user-management scope expansion.
- no new users-management mutation endpoints.
- no pagination/filter/sort/query-contract work.
- no JWT/session semantics changes.
- no RBAC policy expansion beyond current baseline route coverage.
- no localization/i18n error-message policy.
- no endpoint-specific one-off error body shapes.
- no stable contract expansion beyond `400/401/403/404/409/500` in this slice.
- no logging/observability overhaul.

## Behavior Rules
- stable public error envelope for covered statuses:

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
- stable `error.code` set for this expanded baseline slice:
  - `REQUEST_VALIDATION_FAILED`
  - `REQUEST_UNKNOWN_FIELD`
  - `REQUEST_MALFORMED_JSON`
  - `AUTH_UNAUTHENTICATED`
  - `AUTH_INVALID_CREDENTIALS`
  - `AUTH_INVALID_OR_EXPIRED_TOKEN`
  - `AUTH_FORBIDDEN`
  - `RESOURCE_NOT_FOUND`
  - `RESOURCE_CONFLICT`
  - `INTERNAL_SERVER_ERROR`
- intentionally non-stable in this slice:
  - `error.details` content wording/order for validation paths.
  - any unsupported/extra fields not listed as stable guarantees.
  - non-covered status families and non-covered endpoint/error paths.

### Covered Case Mapping (Expanded Slice)
| Case | Endpoint/path (current baseline) | HTTP status | Stable `error.code` |
| --- | --- | --- | --- |
| DTO semantic validation failure | `POST /api/v1/auth/login` body DTO validation | `400` | `REQUEST_VALIDATION_FAILED` |
| DTO unknown extra field | `POST /api/v1/auth/login` with non-whitelisted field | `400` | `REQUEST_UNKNOWN_FIELD` |
| malformed syntactic JSON | `POST /api/v1/auth/login` malformed JSON payload | `400` | `REQUEST_MALFORMED_JSON` |
| unauthenticated protected-route access (missing auth context) | `GET /api/v1/auth/me`, `GET /api/v1/users` without auth credentials | `401` | `AUTH_UNAUTHENTICATED` |
| invalid credentials | `POST /api/v1/auth/login` wrong email/password | `401` | `AUTH_INVALID_CREDENTIALS` |
| invalid/expired token behavior | `POST /api/v1/auth/refresh` invalid/rotated token; protected routes with invalid bearer token | `401` | `AUTH_INVALID_OR_EXPIRED_TOKEN` |
| authenticated but unauthorized RBAC access | `GET /api/v1/users` as `user` role (admin required) | `403` | `AUTH_FORBIDDEN` |
| not found route/resource | unknown API route or `NotFoundException` path | `404` | `RESOURCE_NOT_FOUND` |
| request conflict | `ConflictException` / `409` path | `409` | `RESOURCE_CONFLICT` |
| unexpected/unhandled server error fallback | unhandled errors and `500` server exceptions | `500` | `INTERNAL_SERVER_ERROR` |

- current implementation-scope note for `409`:
  - no real product conflict-producing endpoint exists in current approved scope.
  - `409` is stabilized at contract/normalizer level and covered through focused normalizer tests without adding product behavior.

### 500 Sanitized Fallback Rules
- `500` responses must use stable envelope and stable generic message only.
- `500` responses must not expose stack traces, raw exception messages, SQL/database details, file paths, internal class names, or framework-internal error internals.
- if an existing error object includes sensitive/raw details, those details are suppressed from the public response.

## Forbidden Behavior
- exposing framework-default `statusCode/error/message` structures as implicit contract instead of this stable envelope.
- adding endpoint-specific error body variants for covered baseline cases.
- moving API-internal exception/filter implementation details into shared contracts.
- adding product/domain behavior solely to create a `409` source for tests.
- broad generic domain-error framework introduction in this slice.

## Affected Domains/Modules
- domains:
  - API transport-layer error normalization.
  - shared external API contract typing for stable error envelope.
  - auth/validation/RBAC/users-route contract verification tests.
- modules/files likely affected:
  - `apps/api/src/app/system/*` (error normalization/filter wiring)
  - `apps/api/src/main.ts`
  - `apps/api-e2e/src/api/auth.spec.ts`
  - `apps/api-e2e/src/api/users.spec.ts`
  - `apps/api-e2e/src/api/api.spec.ts`
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
  - `typescript-advanced-types`
- skills used:
  - `nestjs-best-practices` (exception-filter and transport-layer placement patterns)
  - `jwt-security` (preserve existing auth/token semantics while changing response-envelope coverage)
  - `nx-workspace-patterns` (gate execution discipline in Nx workspace)
  - `typescript-advanced-types` (minimal union/type-surface expansion discipline for shared contracts)
- why each skill is relevant:
  - supports safe placement and verification for cross-cutting API transport behavior and shared type updates.
- conflicts/tensions with project docs/spec:
  - `jwt-security` generally recommends asymmetric JWT signing; project accepted HS256 baseline remains unchanged and authoritative.
- project-compatible decision:
  - keep auth/token semantics unchanged and constrain this change to error-envelope contract expansion.

## Edge Cases
- malformed JSON parsing errors are normalized to `REQUEST_MALFORMED_JSON` for covered baseline path.
- mixed validation failures (non-whitelist + other constraints) use `REQUEST_VALIDATION_FAILED` unless the failure is purely unknown-field.
- stale/rotated refresh token failures stay `401` and are mapped to `AUTH_INVALID_OR_EXPIRED_TOKEN`.
- `404` mapping must not leak implementation details from framework route resolution.
- `500` mapping must sanitize both `HttpException(500)` payloads and non-`HttpException` thrown errors.

## Risks
- risk 1 and mitigation:
  - risk: accidental behavior drift in accepted auth status semantics.
  - mitigation: keep accepted `400/401/403` mapping logic and tests unchanged while extending only new status mappings.
- risk 2 and mitigation:
  - risk: leakage through `500` fallback from raw exception details.
  - mitigation: enforce generic `INTERNAL_SERVER_ERROR` + generic message with no raw details in response.
- risk 3 and mitigation:
  - risk: scope creep into broad error-framework redesign.
  - mitigation: keep the implementation inside existing normalizer/filter architecture with minimal contract additions.

## Test Plan
- unit tests:
  - preserve existing `400/401/403` normalizer mapping tests.
  - add normalizer tests for `404`, `409`, and sanitized `500` mappings.
  - add `500` sanitization leakage-defense tests (stack/raw message/SQL/path/internal token patterns not surfaced).
  - update shared contract type tests for expanded status/code unions.
- integration/e2e tests:
  - preserve existing auth/users `400/401/403` stable envelope assertions.
  - add API e2e assertion for `404` stable envelope on unknown API route.
  - if no real conflict-producing product behavior exists, cover `409` via normalizer tests only and document that explicitly.
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
  - `npx nx e2e web-e2e` (run when documented gate profile or visible web behavior impact requires it)
- additional domain gates (if applicable):
  - auth/security overlay (`8.4`) remains required behaviorally.
  - e2e-relevant overlay (`8.6`) applies because API contract behavior is changed.
- manual/proposed checks:
  - confirm architecture boundary placement in `ARCHITECTURE.md`.
  - explicitly report any skipped gates.

## Acceptance Checks
- stable envelope exists for covered `400/401/403/404/409/500` contract cases with stable `statusCode`, `error.code`, and `error.message`.
- stable code mapping for covered cases matches this spec.
- covered auth/validation/RBAC status semantics remain unchanged.
- `500` fallback is sanitized and does not leak internal implementation details.
- public error response types are available from `libs/shared/contracts`.
- API-internal normalization/filter/exception details remain app-local.
- tests prove general mapping behavior across covered cases, not one-off payload hacks.

## Documentation Updates Needed
- docs to update:
  - update this existing stable-error-contract spec with expanded coverage.
  - add related accepted decision-log entry in `DECISIONS.md`.
- guidance:
  - older specs that declared covered `400/401/403` body details non-stable remain superseded for covered cases by this expanded accepted spec.

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - required: add accepted decision entry for stable baseline API error envelope expansion to include `404`, `409`, and sanitized `500` fallback.
