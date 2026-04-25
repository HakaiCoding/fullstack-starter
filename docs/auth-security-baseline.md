# Full-Stack Starter Auth and Security Baseline

## 1. Scope
Auth/session, authorization baseline, refresh-cookie safety, and CORS constraints.

Related docs:
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`AI_CONTRACT.md`](./AI_CONTRACT.md)
- [`DECISIONS.md`](./DECISIONS.md)
- [`commands-reference.md`](./commands-reference.md)

## 2. Auth/Security Invariants
### 2.1 Frontend Baseline
- access token storage: `memory only`
- refresh token storage: `HttpOnly cookie`
- expired access flow: one refresh attempt, then one retry of original request

### 2.2 Backend Baseline
- access tokens are short-lived
- refresh tokens use rotation
- refresh sessions are persisted as hashed token values
- single-session replacement policy: new login/issue invalidates previous refresh session
- implemented routes:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me` (JWT-protected)

### 2.3 Authorization Baseline
- model: basic RBAC (`admin`, `user`)
- default intent: user accesses own resources; admin can access all
- current state: first live route-level RBAC enforcement is implemented on `GET /api/v1/users` (admin-only)

### 2.4 Cookie and CORS Safety Baseline
- refresh cookie: `HttpOnly=true`, `path=/`, `sameSite=Lax` baseline
- runtime safety enforcement:
  - `NODE_ENV=production` requires `AUTH_REFRESH_COOKIE_SECURE=true`
  - `AUTH_REFRESH_COOKIE_SAME_SITE=none` requires `AUTH_REFRESH_COOKIE_SECURE=true`
- CORS runtime baseline:
  - allowlisted origins only (`API_CORS_ALLOWED_ORIGINS`)
  - `credentials=true`
  - requests without `Origin` are allowed

## 3. Auth/Session/RBAC Status Snapshot (as of 2026-04-25)
### 3.1 Currently Implemented
- auth endpoints are implemented: login, refresh, logout, and JWT-protected `auth/me`
- JWT access strategy/guard are implemented
- refresh-session persistence and rotation are implemented (hashed refresh-token session records)
- single-session replacement is implemented
- `users.role` is persisted (`admin` | `user`) with default/constraint enforcement
- access-token role claim is issued from persisted role on login and refresh
- `auth/me` role comes from validated access-token claim (no fallback-role policy)
- RBAC primitives are implemented (`Roles(...)` metadata + role guard)
- first live route-level RBAC is implemented on `GET /api/v1/users` (admin-only)

### 3.2 Currently Verified by Tests/E2E
- API e2e verifies auth flow: login success/failure, refresh rotation and old-token rejection, `auth/me` protection, logout invalidation, and single-session replacement
- API e2e verifies role-change-on-refresh behavior: stale access token remains valid until expiry; refreshed token reflects updated persisted role
- API e2e verifies `GET /api/v1/users` allow/deny matrix (`401` unauthenticated, `403` non-admin, `200` admin), payload shaping, and deterministic ordering
- API unit tests verify RBAC primitives (`Roles(...)` metadata and role guard `401`/`403`/allow semantics)

### 3.3 Accepted Project Tradeoffs
- JWT access + rotating persisted refresh sessions with single-session replacement is the accepted baseline (see [`DECISIONS.md`](./DECISIONS.md))
- HS256 JWT baseline is currently accepted for this starter scope; asymmetric signing is not currently required
- request-time authorization trusts validated access-token role claim until access-token expiry
- first live RBAC scope is intentionally limited to `GET /api/v1/users`; broader user-management policy is out of this baseline

### 3.4 Optional Future Hardening (Not Current Requirements)
- add focused auth-internal unit tests for core service/controller/strategy paths
- add DTO/class-validator input pipeline hardening for auth request payloads
- add stronger JWT claim profile (`iss`/`aud`/`kid`) when scope requires it
- plan asymmetric JWT signing if/when project scope/security requirements expand

### 3.5 Intentionally Deferred / User-Decision Items
- RBAC expansion beyond current `GET /api/v1/users` baseline route
- ownership rules and user-access semantics beyond current admin-only list baseline
- pagination/filter/sort query contracts for user listing
- strict custom error-body contracts for `401`/`403` responses
- broader authorization model expansion (additional roles/permissions matrix)

## 4. Known Gaps (Deferred by Design)
- no additional live role-protected feature routes are accepted yet beyond `GET /api/v1/users`
- this doc does not claim full frontend/product auth UX completion beyond the frontend baseline in section 2.1

## 5. Auth/Security Tests and Gates
Relevant commands (see [`commands-reference.md`](./commands-reference.md) for full profiles):

```sh
npx nx run api:lint
npx nx run api:test
npx nx run api:build
npx nx e2e api-e2e
```

If web auth behavior is affected, also run:

```sh
npx nx run web:lint
npx nx run web:test
npx nx run web:build
npx nx e2e web-e2e
```

Current API e2e coverage includes auth flow checks for login, refresh, rotation rejection, protected `auth/me`, logout, single-session replacement, role-change-on-refresh semantics, and admin-route RBAC coverage for `GET /api/v1/users`.
