# Full-Stack Starter Implementation Baseline

## 0. Status
- `state`: `active baseline`
- `implemented_in_code`: `partial` (as of `2026-04-24`)
- notes:
  - `i18n`: not implemented yet
  - `auth/security`: not implemented yet
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
  - `users` table implemented (`id`, `email`, `display_name`, `created_at`, `updated_at`)
  - unique constraint on `users.email`
  - index `idx_users_created_at`
  - migration `1713528000000-create-users-table` implemented and runnable via TypeORM
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

## 3. Testing Baseline
- scope: `bare minimum for starter`
- e2e_projects:
  - `apps/web-e2e`: `keep`
  - `apps/api-e2e`: `keep`
- web_e2e.default_browser: `chromium`
- currently_implemented:
  - `API unit`: app controller baseline + database readiness service
  - `API e2e`: `/api/v1`, `/api/v1/health/db`, and migration-backed schema checks (`migrations`, `users`)
  - `Web e2e`: minimal app shell assertion (`router-outlet`)
- planned_when_auth_starts:
  - `API auth flow`: login, refresh, protected route
  - `Web auth interceptor`: single refresh + request retry
