# Full-Stack Starter Implementation Baseline

## 0. Status
- `state`: `active baseline`
- `implemented_in_code`: `partial` (as of `2026-04-24`)
- notes:
  - `i18n`: not implemented yet
  - `auth/security`: partially implemented (`API auth endpoints + JWT guard + refresh-session persistence + web auth interceptor baseline`; access-token issuance currently carries baseline claims with `sub` + `tokenType` only and no persisted role claim; `auth/me` role currently falls back to `user` unless an `admin` claim is present; route-level RBAC enforcement pending)
  - `typeorm/postgresql persistence foundation`: implemented
  - `e2e projects`: scaffolded and runnable with local prerequisites
  - `web-e2e prerequisite`: run `npx playwright install chromium` once before first `npx nx e2e web-e2e`

## 1. Internationalization (i18n)
- library: `Transloco`
- supported_languages:
  - `en`
  - `es`
- fallback_language: `en`
- scope: `UI translations only`

## 2. Data Conventions
- id_strategy: `UUID`
- column_naming: `snake_case` (custom TypeORM naming strategy)
- schema_change_strategy: `TypeORM migrations only`
- schema_sync: `disabled (no auto schema sync)`
- persistence_runtime:
  - `Nest ConfigModule` + typed `database` config namespace
  - strict env validation (`POSTGRES_*`)
  - `TypeOrmModule.forRootAsync` with shared options
- current_schema_baseline:
  - `users` table implemented (`id`, `email`, `display_name`, `password_hash`, `created_at`, `updated_at`)
  - unique constraint on `users.email`
  - index `idx_users_created_at`
  - check `CHK_users_password_hash_not_blank`
  - `auth_sessions` table implemented (`id`, `user_id`, `refresh_token_hash`, `expires_at`, `revoked_at`, timestamps)
  - unique constraints `UQ_auth_sessions_user_id`, `UQ_auth_sessions_refresh_token_hash`
  - indexes `idx_auth_sessions_expires_at`, `idx_auth_sessions_revoked_at`
  - migration `1713528000000-create-users-table` implemented and runnable via TypeORM
  - migration `1777036800000-add-auth-foundation` implemented and runnable via TypeORM
- migration_workflow:
  - `npm run db:migration:create`
  - `npm run db:migration:run`
  - `npm run db:migration:revert`
  - `db:typeorm` is routed through `tools/typeorm-cli.cjs`
- api_db_env_contract:
  - `POSTGRES_HOST`
  - `POSTGRES_PORT`
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_SSL` (optional; default `false`)
- api_auth_env_contract:
  - `AUTH_ACCESS_TOKEN_SECRET`
  - `AUTH_ACCESS_TOKEN_TTL_SECONDS`
  - `AUTH_REFRESH_TOKEN_SECRET`
  - `AUTH_REFRESH_TOKEN_TTL_SECONDS`
  - `AUTH_REFRESH_COOKIE_NAME`
  - `AUTH_REFRESH_COOKIE_SECURE`
  - `AUTH_REFRESH_COOKIE_SAME_SITE`
  - runtime_validation_enforcement:
    - `NODE_ENV=production` requires `AUTH_REFRESH_COOKIE_SECURE=true`
    - `AUTH_REFRESH_COOKIE_SAME_SITE=none` requires `AUTH_REFRESH_COOKIE_SECURE=true`
    - known placeholder JWT secret patterns are rejected outside local/dev/test

## 3. Testing Baseline
- scope: `bare minimum for starter`
- e2e_projects:
  - `apps/web-e2e`: `keep`
  - `apps/api-e2e`: `keep`
- web_e2e.default_browser: `chromium`
- currently_implemented:
  - `API unit`: app controller baseline + database readiness service
  - `API e2e`: `/api/v1`, `/api/v1/health/db`, migration-backed schema checks (`migrations`, `users`, `users.display_name`, `UQ_users_email`, `idx_users_created_at`), and auth-flow coverage (`login`, `refresh`, refresh rotation rejection, protected `auth/me`, `logout`, single-session replacement)
  - `Web e2e`: minimal app shell assertion (`router-outlet`)
  - `Web auth client baseline`: in-memory access-token state + auth interceptor (single refresh attempt + one retry + clear-on-failure)
- pending_auth_related:
  - `API CORS allowlist + credentials bootstrap wiring`
  - `full RBAC policy enforcement beyond baseline role typing`
