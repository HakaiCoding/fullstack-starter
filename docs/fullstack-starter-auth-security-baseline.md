# Full-Stack Starter Auth and Security Baseline

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

## 2. Authorization
- model: `basic RBAC`
- roles:
  - `admin`
  - `user`
- default_rule: `user accesses own resources, admin can access all`

## 3. Cookie and CORS Baseline
- refresh_cookie.http_only: `true`
- refresh_cookie.secure:
  - `true` in production
  - `false` in local development
- refresh_cookie.same_site: `Lax`
- cors:
  - `origin`: allowlist web origin
  - `credentials`: `true`
