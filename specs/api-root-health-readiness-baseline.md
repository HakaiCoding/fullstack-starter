# Feature Spec (Core Change)

## Feature/Change Name
- name: API root + health + DB-readiness baseline contract

## Date
- yyyy-mm-dd: 2026-04-29

## Status
- Accepted
- lifecycle note:
  - contract options from the proposed draft are accepted and implemented in this slice.
  - stable error-envelope coverage is expanded to include `503` for readiness failure.

## Problem
- API root/health/readiness behavior needed an explicit stable baseline contract for starter reuse.
- DB-readiness failure previously returned `503` without stable public envelope coverage.

## Non-Goals
- no auth/RBAC changes.
- no user/session/domain behavior changes.
- no persistence schema/migration changes.
- no metrics/tracing/Kubernetes-specific health integrations.
- no frontend behavior changes.

## Behavior Rules
- `GET /api/v1` returns exactly:
  - `{ "name": "Fullstack Starter API", "version": "v1", "status": "ok" }`
- `GET /api/v1/health` returns exactly:
  - `{ "status": "ok", "checks": { "api": "ok" } }`
- `GET /api/v1/health/db` success returns exactly:
  - `{ "status": "ok", "checks": { "database": "ok" } }`
- `GET /api/v1/health/db` failure returns stable error envelope with `503`:
  - `{ "statusCode": 503, "error": { "code": "SERVICE_UNAVAILABLE", "message": "Service unavailable." } }`

## Historical Resolution of Proposed Choices
- root payload choice resolved to stable `{ name, version, status }`.
- liveness endpoint added as accepted stable `GET /api/v1/health`.
- DB-readiness success payload resolved to stable `{ status, checks.database }`.
- readiness failure resolved to stable `503` envelope coverage (not status-only).

## Forbidden Behavior
- mixing DB checks into `GET /api/v1` or `GET /api/v1/health`.
- exposing framework-default `503` body as implicit contract.
- adding non-baseline observability/platform behavior in this slice.

## Affected Domains/Modules
- domains:
  - API system endpoint contract.
  - API readiness/liveness semantics.
  - shared API error-envelope contract for `503`.
- modules/files affected:
  - `apps/api/src/app/system/app.controller.ts`
  - `apps/api/src/app/system/app.service.ts`
  - `apps/api/src/app/system/api-error-response.normalizer.ts`
  - `libs/shared/contracts/src/lib/contracts.ts`
  - related tests/docs/spec/decision files

## Design Placement Summary
- system endpoint transport contract stays in `apps/api/src/app/system/*`.
- DB probe remains in system readiness service.
- `503` envelope normalization stays in existing system normalizer/filter layer.
- shared public error types stay in `libs/shared/contracts`.

## Relevant Local Skills
- policy authority: [`../AI_SKILLS.md`](../AI_SKILLS.md)
- skills inspected:
  - `nestjs-best-practices`
  - `nx-workspace-patterns`
  - `typescript-advanced-types`
  - `typeorm`
- skills used:
  - `nestjs-best-practices`
  - `nx-workspace-patterns`
  - `typescript-advanced-types`
- why each skill is relevant:
  - `nestjs-best-practices`: route placement and exception-normalization boundaries.
  - `nx-workspace-patterns`: gate selection and monorepo-safe change scope.
  - `typescript-advanced-types`: minimal shared union-surface expansion for `ApiErrorResponse`.
- conflicts/tensions with project docs/spec:
  - none blocking.
- project-compatible decision:
  - keep the change minimal and within accepted system-layer boundaries.

## Edge Cases
- API process alive but DB unavailable:
  - `GET /api/v1` and `GET /api/v1/health` remain `200`.
  - `GET /api/v1/health/db` returns stable `503` envelope.

## Risks
- risk: accidental payload drift from accepted exact contracts.
  - mitigation: unit + e2e assertions on exact response bodies.
- risk: `503` response leaking internals.
  - mitigation: generic stable code/message mapping in normalizer.

## Test Plan
- unit tests:
  - system controller/service contracts for root/liveness/readiness success.
  - normalizer mapping test for stable `503` envelope.
- integration/e2e tests:
  - `GET /api/v1` exact payload.
  - `GET /api/v1/health` exact payload.
  - `GET /api/v1/health/db` exact success payload.
  - CORS test updated for root payload.
- regression coverage:
  - preserve existing auth/users/error behavior coverage.

## Required Gates
Use commands from [`../docs/commands-reference.md`](../docs/commands-reference.md).
- core gates apply for this slice (`8.3`) plus API e2e (`8.6`).

## Acceptance Checks
- exact payload contracts for root/liveness/readiness are implemented and tested.
- liveness/readiness separation is preserved.
- stable `503` envelope contract is implemented in shared contracts + normalizer + tests.

## Documentation Updates Needed
- `apps/api/README.md` runtime contract updated with accepted endpoint shapes.
- `apps/api-e2e/README.md` scope wording updated for root/liveness/readiness coverage.
- `specs/stable-api-error-response-contract-baseline.md` updated for `503` coverage.

## Decision Log Updates Needed
- [`../DECISIONS.md`](../DECISIONS.md) updated with accepted root/health/readiness + `503` envelope decision.
