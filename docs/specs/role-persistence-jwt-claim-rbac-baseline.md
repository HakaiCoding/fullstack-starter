# Feature Spec (Core Change)

## Feature/Change Name
- name: Role persistence + JWT role claim propagation + route-level RBAC baseline

## Date
- yyyy-mm-dd: 2026-04-24

## Status
- In Progress

## Problem
- user roles are not currently persisted as an authoritative user property in the database model
- access tokens do not consistently carry role information from authoritative user state
- refresh does not clearly propagate role from authoritative user state
- route-level RBAC enforcement is still pending
- fallback role behavior (`user` when claim is missing) must not become long-term authorization policy
- without explicit source-of-truth and enforcement semantics, future auth changes can drift and create inconsistent authorization outcomes

## Non-Goals
- user registration
- full admin dashboard
- organizations/teams/permissions matrix
- JWT signing algorithm changes
- refresh-token storage strategy changes
- frontend auth UX overhaul
- fake routes added only to make RBAC look implemented

## Decision Evaluation and Resolution

### 1) Role Source of Truth
- options considered:
  - persisted `users.role` as source of truth
  - access-token claim as source of truth
  - database rehydration on every request
  - hybrid (persisted source + token claim at runtime)
- relevant skill guidance:
  - `jwt-security`: claims should be explicit/minimal and verified; avoid ambiguous semantics
  - `nestjs-best-practices`: authz policy should be explicit in guards/services, not scattered
  - `typeorm` and Postgres skills: authoritative data should be persisted with constraints
- project constraints from docs/code:
  - `docs/auth-security-baseline.md` explicitly flags role-claim consistency and pending RBAC
  - `docs/ARCHITECTURE.md` places durable domain/persistence rules in API service + DB layers
  - current code has no persisted role column yet and uses fallback role behavior
- conflict/tension:
  - token-only truth is operationally simple but conflicts with need for canonical persisted user policy
- final recommendation:
  - persisted `users.role` is canonical source of truth
  - access-token role claim is a signed snapshot derived from persisted role at token issuance time
- why best baseline choice:
  - aligns with auth gap closure in project docs while preserving stateless request handling for starter performance
- defer to future work:
  - route- or policy-specific DB rehydration overrides for high-risk operations

### 2) Role Schema Representation
- options considered:
  - PostgreSQL enum
  - `text`/`varchar` + `CHECK`
  - application-only validation
  - lookup table
- relevant skill guidance:
  - `postgresql-table-design`: enum is good for very stable sets; text + check is better when business values may evolve
  - `postgresql-best-practices`: enforce constraints in DB, not only app
  - `typeorm`: keep entity and migration aligned and explicit
- project constraints from docs/code:
  - migration-driven schema (`docs/implementation-baseline.md`)
  - existing schema style already uses DB checks (for example password hash/session checks)
- conflict/tension:
  - enum rigidity vs starter flexibility; lookup table is over-scoped for current baseline
- final recommendation:
  - use `users.role` as `text NOT NULL DEFAULT 'user'` with `CHECK (role IN ('admin','user'))`
- why best baseline choice:
  - consistent with existing DB style and easiest to evolve safely in a starter without introducing extra relational complexity
- defer to future work:
  - dedicated role catalog/lookup table if role model grows beyond a small fixed set

### 3) Token Role Propagation
- options considered:
  - login uses persisted role
  - refresh uses persisted role
  - refresh preserves old token role
  - immediate role-change effect on already-issued access tokens
  - role-change effect on next refresh/login/new issuance
- relevant skill guidance:
  - `jwt-security`: short-lived access tokens + controlled refresh semantics are standard
  - `nestjs-best-practices`: keep auth behavior deterministic and testable
- project constraints from docs/code:
  - existing decision: JWT access + rotating refresh sessions (no strategy change)
  - non-goal: do not change refresh-token persistence strategy
- conflict/tension:
  - immediate invalidation on role change is stronger security but implies extra revocation/versioning machinery outside this baseline
- final recommendation:
  - login and refresh must issue access tokens using current persisted role
  - already-issued access tokens remain valid until expiry
  - role changes take effect on next token issuance (refresh/login)
- why best baseline choice:
  - safest project-compatible behavior with minimal architectural change and clear semantics
- defer to future work:
  - token/session versioning and immediate access-token revocation on role change

### 4) Request-Time Authorization Model
- options considered:
  - trust validated access-token role claim until expiry
  - rehydrate user role from DB on every request
  - rehydrate only for high-risk routes
  - token-version/session-version patterns
- relevant skill guidance:
  - `jwt-security`: validate signed token and claims consistently
  - `nestjs-best-practices`: place authorization checks in guards; avoid hidden policy drift
- project constraints from docs/code:
  - current JWT strategy already validates token and loads user existence
  - no existing infrastructure for token versioning or immediate revocation
- conflict/tension:
  - DB rehydration-every-request offers stronger freshness but adds cost and complexity not required for starter baseline
- final recommendation:
  - baseline trusts validated access-token role claim until token expiry
  - keep `401` for unauthenticated and `403` for insufficient role
- why best baseline choice:
  - preserves stateless access-token flow while making role propagation deterministic at issuance boundaries
- defer to future work:
  - high-risk-route DB rehydration strategy
  - token-version/session-version invalidation model

### 5) RBAC Route Strategy
- options considered:
  - apply RBAC to an existing route now
  - add a minimal admin-only starter endpoint
  - add reusable RBAC primitives and prove with unit tests, defer live route binding
  - wait for real protected feature and do no RBAC work now
- relevant skill guidance:
  - `nestjs-best-practices`: implement authz via reusable guards/decorators
  - `typescript-advanced-types`: keep role metadata/request user types explicit and safe
- project constraints from docs/code:
  - current route inventory: `/api/v1`, `/api/v1/health/db`, auth endpoints; no clear meaningful admin-only route exists
  - non-goal: no fake route added just for optics
- conflict/tension:
  - applying to existing baseline routes now risks introducing arbitrary policy on non-domain routes
- final recommendation:
  - add RBAC primitives now and prove behavior with unit tests; defer live route-level application until first meaningful protected feature route exists
- why best baseline choice:
  - avoids fake/admin-only placeholder APIs while delivering reusable, tested enforcement components now
- defer to future work:
  - first concrete protected feature route and corresponding e2e allow/deny assertions

## Accepted Implementation Direction (This Baseline)
- persist `users.role` as canonical authz role (`admin` | `user`)
- schema representation: `text NOT NULL DEFAULT 'user'` + DB `CHECK` constraint for allowed values
- backfill existing users to `user` during migration
- login and refresh issue access token role claim from persisted role
- existing access tokens remain valid until expiry; refreshed/new tokens use latest persisted role
- request-time RBAC trusts validated access-token role claim until expiry
- `401` for unauthenticated, `403` for authenticated without required role
- implement RBAC primitives (decorator + guard) now
- defer live route-level RBAC binding until first meaningful protected feature route

## Deferred Future Improvements (Out of This Spec's Implementation Slice)
- immediate revocation of active access tokens after role change
- token-version/session-version invalidation model
- DB role rehydration for every request or high-risk-route-only strategy
- dedicated role lookup table / expanded authorization model
- first real admin/business-protected route application and related e2e route assertions

## Behavior Rules
- `users.role` is the authorization source of truth for role
- valid roles are `admin` and `user`
- existing users default to `user` during migration backfill
- new users default to `user`
- login issues access tokens with role claim derived from current persisted `users.role`
- refresh issues access tokens with role claim derived from current persisted `users.role`
- existing access tokens remain valid until expiry even if role changes after issuance
- refreshed/newly issued access tokens pick up the latest persisted role
- unauthenticated requests to protected routes return `401`
- authenticated users without required role return `403`

## Route-Level RBAC Strategy
- current route inventory (from code):
  - `GET /api/v1`
  - `GET /api/v1/health/db`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- accepted strategy for this baseline:
  - add RBAC primitives now (role metadata decorator + role guard)
  - prove enforcement behavior with unit tests now
  - defer live route-level RBAC application until first meaningful protected feature route exists

## Forbidden Behavior
- role-specific one-off patches in controllers/interceptors/helpers
- using fallback `user` role as a persistent authorization policy instead of persisted role source-of-truth
- placing domain authorization policy in web UI components
- introducing fake admin route only to claim RBAC completion
- changing JWT algorithm or refresh-token persistence strategy as part of this scope

## Affected Domains/Modules
- domains:
  - auth/session domain
  - authorization domain (RBAC transport enforcement)
  - persistence/schema domain
- modules/files likely affected:
  - `apps/api/src/db/entities/user.entity.ts`
  - `apps/api/src/db/migrations/*`
  - `apps/api/src/app/auth/auth-core.service.ts`
  - `apps/api/src/app/auth/auth.types.ts`
  - `apps/api/src/app/auth/jwt-access.strategy.ts`
  - `apps/api/src/app/auth/*roles*` (new decorator/guard files)
  - `apps/api/src/app/auth/auth.module.ts` (or equivalent guard wiring)
  - auth-related unit tests
  - API e2e auth regression tests
  - `libs/shared/contracts/*` only if shared role contract is truly required by API and web

## Design Placement Summary
- where logic should live and why:
  - persisted role schema and constraints in persistence layer (`apps/api/src/db/*`)
  - token role issuance/refresh semantics in auth service/domain layer (`apps/api/src/app/auth/*`)
  - request authz checks at transport layer via guards/decorators (`apps/api/src/app/auth/*`)
  - test behavior at unit level and e2e level where real routes are affected
- where logic should not live:
  - role policy in web components/templates
  - durable RBAC policy hidden in unrelated utils/helpers/interceptors
  - schema policy in controllers

## Edge Cases
- existing users created before role migration must receive deterministic default role (`user`)
- invalid/missing persisted role values must be blocked by schema constraints and defensive runtime handling
- refresh after role change must issue token with latest persisted role
- stale access token role remains effective until access token expiry
- authenticated user with insufficient role gets `403` on role-protected route
- unauthenticated request to role-protected route gets `401`

## Assumptions
- access tokens remain short-lived enough that expiry-based role convergence is acceptable for baseline risk
- no existing production-critical admin-only route exists in the current starter route set
- role model remains two-valued (`admin`, `user`) during this baseline implementation

## Risks
- risk 1: route-level RBAC can be marked complete without a live protected business route
  - mitigation: explicit deferred item requiring first real protected route follow-up spec/task
- risk 2: token claim and persisted role can diverge if issuance paths are incomplete
  - mitigation: force role claim derivation from persisted role on both login and refresh code paths
- risk 3: schema drift between entity and migration
  - mitigation: run migration create/run/revert flow and keep entity definition aligned with migration
- risk 4: over-scoping into broader IAM redesign
  - mitigation: enforce non-goals and defer advanced models to future specs

## Test Plan
- unit tests:
  - auth token issuance uses persisted role on login
  - auth token issuance uses persisted role on refresh
  - JWT strategy/request user shape handles role deterministically from validated token claims
  - RBAC decorator/guard allow/deny behavior including `401` vs `403`
- integration/e2e tests:
  - migration/schema verification for role column, defaults, and allowed values
  - regression coverage for login/refresh/logout/me
  - API e2e RBAC allow/deny assertions are deferred until a real protected route is in scope
- regression coverage:
  - no regression in existing auth flow: login, refresh rotation behavior, logout invalidation, `auth/me`

## Test Expectations for This Baseline
- expected now:
  - passing API unit tests for role propagation + RBAC primitives
  - passing auth regression tests for login/refresh/logout/me behavior
  - passing migration/schema validation tests for role constraints/defaults
- expected later (deferred):
  - route-level RBAC e2e allow/deny against first real protected endpoint

## Required Gates
Use commands from [`../commands-reference.md`](../commands-reference.md).
- quick/local gates:
  - `npx nx run api:lint`
  - `npx nx run api:test`
  - `npx nx run api:build`
- core gates:
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e`
  - `npx nx e2e web-e2e` (only if web auth behavior/contracts are affected)
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
  - confirm placement compliance with `docs/ARCHITECTURE.md`
  - confirm policy compliance with `docs/AI_CONTRACT.md`
  - review auth invariants in `docs/auth-security-baseline.md` before merge
  - explicitly report any gate not run and why

## Acceptance Checks
- `users.role` exists with enforced allowed values (`admin`, `user`) and deterministic default/backfill to `user`
- login access token includes role claim from persisted user role
- refresh access token includes role claim from current persisted user role
- stale access token remains valid until expiry; refreshed/new token reflects latest persisted role
- RBAC decorator/guard primitives exist and unit tests prove `401` vs `403` semantics
- no fake route is introduced only for demonstration
- explicit deferral is documented for live route-level RBAC application
- regression auth behavior for login/refresh/logout/me remains intact
- docs/spec updates completed for changed behavior

## Documentation Updates Needed
- docs to update:
  - `docs/auth-security-baseline.md` (role persistence, claim propagation semantics, RBAC status)
  - `docs/implementation-baseline.md` (schema baseline includes `users.role`, test coverage notes)
  - this spec status (Proposed -> In Progress -> Accepted)

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry:
  - yes, propose a new entry after implementation is accepted (do not update in this task)

- draft decision entry (for later application):

```md
## 2026-04-24 - Persist user role and define RBAC baseline semantics
Status: Proposed
Context: Authorization baseline requires consistent role semantics across persistence, token issuance, refresh behavior, and route-level enforcement. Current implementation lacks persisted role authority and route-level RBAC primitives.
Decision: Persist `users.role` as authoritative role (`admin` | `user`, default `user`) using DB constraints, issue access-token role claim from persisted role on login/refresh, trust validated token role claim at request time until token expiry, and implement reusable RBAC guard/decorator primitives now. Defer live route-level RBAC application until first meaningful protected feature route exists.
Alternatives considered: token-only role authority; DB rehydration on every request; synthetic admin-only endpoint for demonstration; immediate revocation/versioning model in baseline.
Consequences: Authorization semantics become explicit and testable with bounded scope; migration and auth tests are required; stronger immediate-revocation and high-risk-route freshness models are deferred to future specs.
Related docs/specs: `docs/auth-security-baseline.md`, `docs/implementation-baseline.md`, `docs/specs/role-persistence-jwt-claim-rbac-baseline.md`
```

## Open Questions
- Which upcoming real feature route is the first intended RBAC-protected endpoint for live guard application and e2e allow/deny coverage?
