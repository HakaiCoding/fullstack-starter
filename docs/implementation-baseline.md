# Full-Stack Starter Implementation Baseline

## 1. Purpose
Status/reference snapshot for implementation details that are not primarily architectural policy.

Authoritative docs for other concerns:
- architecture and placement: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- AI workflow rules: [`AI_CONTRACT.md`](./AI_CONTRACT.md)
- auth/security invariants and status: [`auth-security-baseline.md`](./auth-security-baseline.md)
- commands/gate profiles: [`commands-reference.md`](./commands-reference.md)
- long-lived policy decisions: [`DECISIONS.md`](./DECISIONS.md)

## 2. Status Snapshot (as of 2026-04-25)
- state: `active baseline`
- implemented_in_code: `partial`
- i18n: not implemented yet
- web UI library baseline: Angular Material (`@angular/material` + `@angular/cdk`) installed and configured
- persistence foundation: implemented (TypeORM + PostgreSQL)
- e2e projects: scaffolded and runnable with local prerequisites
- web-e2e chromium install: `npx nx e2e web-e2e` auto-runs `web-e2e:install-chromium`; optional prewarm remains `npx playwright install chromium`
- auth/session/RBAC consolidated status snapshot: [`auth-security-baseline.md` section 3](./auth-security-baseline.md#3-authsessionrbac-status-snapshot-as-of-2026-04-25) (starts at line 44)

## 3. Data and Persistence Baseline
- id strategy: `UUID`
- column naming: `snake_case` (custom TypeORM naming strategy)
- schema change strategy: `TypeORM migrations only`
- schema sync: disabled (`no auto schema sync`)

### 3.1 Runtime Persistence Wiring
- `Nest ConfigModule` + typed `database` config namespace
- strict env validation for `POSTGRES_*`
- `TypeOrmModule.forRootAsync` with shared options

### 3.2 Current Schema Baseline
- `users` table implemented (`id`, `email`, `display_name`, `password_hash`, `role`, `created_at`, `updated_at`)
- `users.email` unique constraint
- `idx_users_created_at` index
- `CHK_users_password_hash_not_blank` check
- `users.role` baseline:
  - default: `'user'`
  - allowed values check: `CHK_users_role_allowed` (`admin` | `user`)
- `auth_sessions` table implemented (`id`, `user_id`, `refresh_token_hash`, `expires_at`, `revoked_at`, timestamps)
- unique constraints: `UQ_auth_sessions_user_id`, `UQ_auth_sessions_refresh_token_hash`
- indexes: `idx_auth_sessions_expires_at`, `idx_auth_sessions_revoked_at`
- migrations in use:
  - `1713528000000-create-users-table`
  - `1777036800000-add-auth-foundation`
  - `1777123200000-add-user-role-baseline`

### 3.3 Migration Workflow
Use commands from [`commands-reference.md`](./commands-reference.md):
- `npm run db:migration:create`
- `npm run db:migration:run`
- `npm run db:migration:revert`
- `db:typeorm` is routed through `tools/typeorm-cli.cjs`

## 4. Environment Contract Baseline
### 4.1 Database
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_SSL` (optional, default `false`)

### 4.2 Auth/Cookie
For auth invariants and status, see [`auth-security-baseline.md`](./auth-security-baseline.md).
Required keys currently include:
- `NODE_ENV`
- `AUTH_ACCESS_TOKEN_SECRET`
- `AUTH_ACCESS_TOKEN_TTL_SECONDS`
- `AUTH_REFRESH_TOKEN_SECRET`
- `AUTH_REFRESH_TOKEN_TTL_SECONDS`
- `AUTH_REFRESH_COOKIE_NAME`
- `AUTH_REFRESH_COOKIE_SECURE`
- `AUTH_REFRESH_COOKIE_SAME_SITE`

Runtime validation enforcement currently includes:
- explicit `NODE_ENV`
- production secure-cookie requirement
- `sameSite=none` secure-cookie requirement
- placeholder JWT secret rejection outside local/dev/test

### 4.3 CORS
- `API_CORS_ALLOWED_ORIGINS` required (comma-separated `http`/`https` origins)
- values normalized and deduplicated during config load
- runtime uses allowlisted origins with `credentials=true`

## 5. Testing Baseline
- scope: bare minimum starter baseline
- e2e projects in use:
  - `apps/web-e2e`
  - `apps/api-e2e`
- web e2e default browser: `chromium`

Currently implemented test coverage highlights:
- API unit: app controller baseline + database readiness service
- API e2e: `/api/v1`, `/api/v1/health/db`, migration-backed schema checks, auth-flow coverage including role-change-on-refresh claim propagation, and admin-only RBAC route coverage for `GET /api/v1/users` (`401`/`403`/`200`, payload-shape/sensitive-field assertions, deterministic ordering checks)
- Web e2e: minimal app shell assertion (`router-outlet`)
- Web auth client baseline: in-memory access token state + interceptor refresh retry behavior

Use gate profiles and exact commands from [`commands-reference.md`](./commands-reference.md).
