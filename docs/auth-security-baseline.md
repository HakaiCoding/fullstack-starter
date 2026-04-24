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
- current state: route-level RBAC enforcement is pending

### 2.4 Cookie and CORS Safety Baseline
- refresh cookie: `HttpOnly=true`, `path=/`, `sameSite=Lax` baseline
- runtime safety enforcement:
  - `NODE_ENV=production` requires `AUTH_REFRESH_COOKIE_SECURE=true`
  - `AUTH_REFRESH_COOKIE_SAME_SITE=none` requires `AUTH_REFRESH_COOKIE_SECURE=true`
- CORS runtime baseline:
  - allowlisted origins only (`API_CORS_ALLOWED_ORIGINS`)
  - `credentials=true`
  - requests without `Origin` are allowed

## 3. Current Implementation Status (as of 2026-04-24)
- auth module/endpoints are implemented
- JWT strategy + guard are implemented
- refresh-session persistence/rotation is implemented
- single-session replacement is implemented
- access token issuance currently includes `sub` and `tokenType`; persisted role claim is not currently issued
- `auth/me` currently falls back to `user` unless `admin` claim exists in token
- route-level RBAC enforcement remains pending

## 4. Known Gaps
- route-level RBAC enforcement beyond baseline role typing
- role claim propagation and consistency across auth flows

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

Current API e2e coverage includes auth flow checks for login, refresh, rotation rejection, protected `auth/me`, logout, and single-session replacement.
