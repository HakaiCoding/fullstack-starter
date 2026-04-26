# Feature Spec (Core Change)

## Feature/Change Name
- name: Role persistence + JWT role claim propagation + route-level RBAC baseline

## Date
- yyyy-mm-dd: 2026-04-24

## Status
- Accepted
- lifecycle note:
  - baseline scope was accepted after role persistence, token-claim propagation, and RBAC primitives were implemented.
  - deferred baseline item ("first live route-level RBAC binding") was later closed via [`first-meaningful-rbac-protected-route-decision.md`](./first-meaningful-rbac-protected-route-decision.md).
  - closure route: `GET /api/v1/users` (admin-only with `401`/`403`/`200` coverage).

## Problem
- baseline draft problem: reusable RBAC primitives were missing, and consistent `401` vs `403` behavior needed explicit enforcement.
- baseline draft concern: without reusable primitives and explicit role semantics, future route-level authorization could drift into ad hoc controller logic.
### Historical note
- at 2026-04-24 draft time, live route-level RBAC binding was intentionally deferred until a meaningful protected route existed.
### Current accepted state
- `users.role` is the canonical authorization role source (`admin` | `user`).
- login and refresh issue access-token role claim from persisted role.
- request-time authorization trusts validated access-token role claim until access-token expiry.
- reusable RBAC primitives are implemented (`Roles(...)` + `RolesGuard`).
- first live route-level RBAC binding is closed on `GET /api/v1/users`.

## Non-Goals
- user registration.
- full admin dashboard.
- organizations/teams/permissions matrix.
- JWT signing algorithm changes.
- refresh-token storage strategy changes.
- frontend auth UX overhaul.
- fake routes added only to make RBAC look implemented.
- immediate revocation of active access tokens after role change.
- token-version/session-version invalidation model.
- DB role rehydration for every request or high-risk-route-only strategy.
- dedicated role lookup table / expanded authorization model in this baseline slice.

## Behavior Rules
- `users.role` is the authorization source of truth.
- valid roles are `admin` and `user`.
- existing users default/backfill to `user` during migration.
- new users default to `user`.
- login issues access tokens with role claim derived from current persisted `users.role`.
- refresh issues access tokens with role claim derived from current persisted `users.role`.
- existing access tokens remain valid until expiry even if role changes after issuance.
- refreshed/newly issued access tokens pick up the latest persisted role.
- request-time RBAC trusts validated access-token role claim until expiry.
- unauthenticated requests to protected routes return `401`.
- authenticated users without required role return `403`.
### Historical note (superseded baseline route strategy)
- baseline strategy was to ship RBAC primitives first and defer live route-level binding until a meaningful route existed.
- that deferred item is now closed on `GET /api/v1/users`.

## Forbidden Behavior
- role-specific one-off patches in controllers/interceptors/helpers.
- fallback `user` role as a persistent authorization policy instead of persisted role source-of-truth.
- domain authorization policy in web UI components/templates.
- introducing fake admin route only to claim RBAC completion.
- changing JWT algorithm or refresh-token persistence strategy as part of this scope.

## Affected Domains/Modules
- domains:
  - auth/session domain.
  - authorization domain (RBAC transport enforcement).
  - persistence/schema domain.
- modules/files likely affected:
  - `apps/api/src/db/entities/user.entity.ts`
  - `apps/api/src/db/migrations/*`
  - `apps/api/src/app/auth/auth-core.service.ts`
  - `apps/api/src/app/auth/auth.types.ts`
  - `apps/api/src/app/auth/jwt-access.strategy.ts`
  - `apps/api/src/app/auth/*roles*`
  - `apps/api/src/app/auth/auth.module.ts`
  - auth-related unit tests.
  - API e2e auth regression tests.
  - `libs/shared/contracts/*` only if shared role contract is required by API/web scope.

## Design Placement Summary
- where logic should live and why:
  - persisted role schema/constraints in persistence layer (`apps/api/src/db/*`).
  - token role issuance/refresh semantics in auth service/domain layer (`apps/api/src/app/auth/*`).
  - request authorization checks at transport layer via guards/decorators (`apps/api/src/app/auth/*`).
  - behavior validation at unit and e2e levels.
- where logic should not live:
  - role policy in web components/templates.
  - durable RBAC policy in unrelated utils/helpers/interceptors.
  - schema policy in controllers.

## Relevant Local Skills
- skills inspected:
  - `jwt-security`
  - `nestjs-best-practices`
  - `typeorm`
  - `postgresql-table-design`
  - `postgresql-best-practices`
  - `typescript-advanced-types`
- skills used:
  - `jwt-security`
  - `nestjs-best-practices`
  - `typeorm`
  - `postgresql-table-design`
  - `postgresql-best-practices`
  - `typescript-advanced-types`
- why each skill is relevant:
  - reinforced explicit claim semantics, guard-based authz placement, and schema-constraint discipline.
- conflicts/tensions with project docs/spec:
  - none unresolved in current accepted baseline state.
- project-compatible decision:
  - preserve accepted JWT/session baseline while keeping persisted role canonical and RBAC reusable.

## Edge Cases
- existing users created before role migration receive deterministic default role (`user`).
- invalid/missing persisted role values are blocked by schema constraints and defensive runtime handling.
- refresh after role change issues token with latest persisted role.
- stale access-token role remains effective until access-token expiry.
- authenticated user with insufficient role gets `403` on role-protected route.
- unauthenticated request to role-protected route gets `401`.
- historical open question about first live RBAC route is closed on `GET /api/v1/users`.

## Risks
- risk 1 and mitigation:
  - risk: route-level RBAC could be marked complete without live protected route.
  - mitigation: explicit deferred-item closure now recorded on `GET /api/v1/users`.
- risk 2 and mitigation:
  - risk: token claim and persisted role could diverge if issuance paths are incomplete.
  - mitigation: role claim derivation from persisted role on both login and refresh.
- risk 3 and mitigation:
  - risk: schema drift between entity and migration.
  - mitigation: migration create/run/revert workflow and aligned entity definition.
- risk 4 and mitigation:
  - risk: over-scoping into broader IAM redesign.
  - mitigation: explicit non-goals and deferrals.

## Test Plan
- unit tests:
  - token issuance uses persisted role on login.
  - token issuance uses persisted role on refresh.
  - JWT strategy/request user shape handles role deterministically from validated token claim.
  - RBAC decorator/guard allow/deny behavior including `401` vs `403`.
- integration/e2e tests:
  - migration/schema verification for role column, defaults, and allowed values.
  - auth regression coverage for login/refresh/logout/me.
  - live RBAC allow/deny assertions on first protected route (`GET /api/v1/users`) are now covered.
- regression coverage:
  - no regression in existing auth flow (login, refresh rotation behavior, logout invalidation, `auth/me`).
- anti-hack coverage for behavior changes (general rule coverage, not only the shown example):
  - reject example-specific patches.
  - reject hardcoded special cases when the real rule is broader.
  - reject wrong-layer business-rule placement.
### Historical note
- route-level RBAC e2e assertions were originally deferred in this baseline and later closed in follow-up.

## Required Gates
Use commands from [`../commands-reference.md`](../commands-reference.md).
- tiny/local gates (if applicable):
  - n/a (core change baseline scope).
- normal implementation gates (if applicable):
  - n/a (core change baseline scope).
- core gates:
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e`
  - `npx nx e2e web-e2e` (if web auth behavior/contracts are affected)
- additional domain gates (if applicable):
  - auth/security change gates:
    - `npx nx run api:lint`
    - `npx nx run api:test`
    - `npx nx run api:build`
    - `npx nx e2e api-e2e`
  - database/migration change gates:
    - `npm run db:migration:create -- apps/api/src/db/migrations/<migration-name>`
    - `npm run db:migration:run`
    - `npm run db:migration:revert`
    - `npx nx run api:test`
    - `npx nx run api:build`
- manual/proposed checks:
  - confirm placement compliance with `docs/ARCHITECTURE.md`.
  - confirm policy compliance with `docs/AI_CONTRACT.md`.
  - review auth invariants in `docs/auth-security-baseline.md` before merge.
  - explicitly report any gate not run.
### Historical note
- this gate list is retained as implementation-time reference for the accepted baseline.

## Acceptance Checks
- `users.role` exists with enforced allowed values (`admin`, `user`) and deterministic default/backfill to `user`.
- login access token includes role claim from persisted user role.
- refresh access token includes role claim from current persisted user role.
- stale access token remains valid until expiry; refreshed/new token reflects latest persisted role.
- RBAC decorator/guard primitives exist and unit tests prove `401` vs `403` semantics.
- first live route-level RBAC closure exists on `GET /api/v1/users`.
- no fake route was introduced only for demonstration.
- regression auth behavior for login/refresh/logout/me remains intact.
- behavior tests prove general rules rather than single examples.
- no example-specific patches, hardcoded special cases, or wrong-layer business-rule placement introduced.

## Documentation Updates Needed
- docs to update:
  - status: closed for baseline implementation lifecycle.
  - historical implementation-time updates were completed:
    - `docs/auth-security-baseline.md` updated for role persistence/claim propagation and RBAC status.
    - `docs/implementation-baseline.md` updated for `users.role` migration baseline.
    - this spec status moved from `In Progress` to `Accepted`.

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - status: no additional decision update required.
  - historical planning note retained: this baseline originally carried a draft decision text; related accepted follow-up governance is already recorded for first live RBAC route selection (`2026-04-25`).
