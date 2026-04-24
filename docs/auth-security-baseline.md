# Full-Stack Starter Auth and Security Baseline

## 0. Status
- `state`: `active baseline`
- `implemented_in_code`: `partial` (as of `2026-04-24`)
- current_workspace_state:
  - auth module + endpoints are implemented (`/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/api/v1/auth/me`)
  - JWT access strategy + guard are implemented for protected route access
  - refresh-token session persistence is implemented with hashed token storage and rotation
  - single-session policy is implemented (new login/issue replaces previous refresh session)
  - access-token issuance currently includes baseline claims with `sub` and `tokenType` only; no persisted role claim is issued (`apps/api/src/app/auth/auth-core.service.ts`, around line 251)
  - `auth/me` role currently uses fallback behavior (`admin` only if access-token role claim is present; otherwise `user`) (`apps/api/src/app/auth/jwt-access.strategy.ts`, around line 45)
  - route-level RBAC enforcement is not implemented yet
  - env validation now requires explicit `NODE_ENV` and enforces cookie safety (`NODE_ENV=production` requires `AUTH_REFRESH_COOKIE_SECURE=true`; `AUTH_REFRESH_COOKIE_SAME_SITE=none` requires `AUTH_REFRESH_COOKIE_SECURE=true`)
  - env validation rejects known placeholder JWT secret patterns outside local/dev/test
  - CORS allowlist + credentials wiring is implemented in API bootstrap (`credentials=true`, allowlisted origins only, requests without `Origin` allowed)

## 1. Authentication

### 1.1 Frontend
- access_token_storage: `memory only`
- refresh_token_storage: `HttpOnly cookie`
- request_auth: `JWT interceptor attaches access token`
- expired_access_token_flow: `one refresh attempt, then one retry of original request`

### 1.2 Backend
- access_token_lifetime: `short-lived`
- refresh_token_strategy: `rotating refresh tokens`
- refresh_token_storage: `hashed in database`
- refresh_endpoint: `dedicated endpoint`
- session_policy: `single-session-only (new login invalidates previous session)`
- implemented_api_routes:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me` (JWT-protected)

## 2. Authorization
- model: `basic RBAC`
- roles:
  - `admin`
  - `user`
- default_rule: `user accesses own resources, admin can access all`
- current_implementation_note: `auth/me uses JWT guard and fallback role mapping (admin only if claim exists; otherwise user); access-token issuance does not currently include persisted role claims; route-level RBAC enforcement is pending`

## 3. Cookie and CORS Baseline
- refresh_cookie.http_only: `true`
- refresh_cookie.secure:
  - `true` in production
  - `false` in local development
  - runtime_enforcement: `implemented via env validation`
- refresh_cookie.same_site: `Lax`
  - runtime_guard: `AUTH_REFRESH_COOKIE_SAME_SITE=none requires AUTH_REFRESH_COOKIE_SECURE=true`
- refresh_cookie.path: `/`
- cors:
  - `origin`: allowlist web origin
  - `credentials`: `true`
  - implementation_status: `implemented in API bootstrap`
