# Full-stack starter notes

## Goal
A clean, practical, and maintainable full-stack starter for side projects and small/medium projects.

## Stack
- Node.js 24.15.0
- npm 11.12.1
- Nx 22.6.5
- Angular 21.2.7 (+ Angular Material)
- NestJS 11.1.19
- TypeORM 0.3.28
- PostgreSQL 18
- Transloco 8.3.0
- Docker Compose (database only)

## Base architecture
- Nx monorepo
- `apps/web` (Angular), `apps/api` (NestJS)
- `libs/shared/contracts`, `libs/shared/utils`
- REST API with versioning: `/api/v1`
- PostgreSQL as main database
- Standard relational modeling

## Auth
### Frontend
- Access token in memory
- Refresh token in HttpOnly cookie
- JWT interceptor attaches access token
- On access token expiration: one refresh attempt, then retry original request once

### Backend
- Short-lived access token
- Rotating refresh token
- Refresh token hash stored in DB
- Dedicated refresh endpoint
- Single-session-only auth (new login invalidates previous session)

## Authorization
- Basic RBAC
- Roles: `admin`, `user`
- Default rule: user can access own resources; admin can access all

## i18n
- Transloco
- Languages: `en`, `es`
- Fallback: `en`
- Scope: UI translations only

## Data conventions
- UUID IDs
- TypeORM migrations only (no auto schema sync)

## Cookie/CORS baseline
- Refresh cookie: `HttpOnly=true`
- `Secure=true` in production, `false` in local dev
- `SameSite=Lax` by default
- CORS allowlist for web origin + `credentials=true`

## Testing baseline
- Bare minimum:
  - API auth flow test (login/refresh/protected route)
  - Web auth interceptor test (single refresh + retry)

## Main goal
Provide a solid foundation without overengineering.
