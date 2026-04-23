# Full-Stack Starter Foundation Notes

## 1. Purpose
- goal: Build a clean, practical, maintainable full-stack starter for side projects and small/medium projects.
- principle: Prioritize a solid foundation without overengineering.

## 2. Stack (Pinned Versions)
- runtime.node: `24.15.0`
- package_manager.npm: `11.12.1`
- monorepo.nx: `22.6.5`
- frontend.angular: `21.2.7`
- frontend.angular_material: `21.2.7`
- backend.nestjs: `11.1.19`
- orm.typeorm: `0.3.28`
- database.postgresql: `18`
- i18n.transloco: `8.3.0`
- local_infra: `docker compose (database only)`

## 3. Base Architecture
- monorepo: `Nx`
- apps:
  - `apps/web` (Angular)
  - `apps/api` (NestJS)
- shared_libs:
  - `libs/shared/contracts`
  - `libs/shared/utils`
- api_style: `REST`
- api_versioning: `/api/v1`
- database: `PostgreSQL`
- data_modeling: `standard relational modeling`
- module_boundaries:
  - `type:app` can depend on: `type:contracts`, `type:util`
  - `type:contracts` can depend on: `type:contracts`
  - `type:util` can depend on: `type:util`

## 4. Authentication

### 4.1 Frontend
- access_token_storage: `memory only`
- refresh_token_storage: `HttpOnly cookie`
- request_auth: `JWT interceptor attaches access token`
- expired_access_token_flow: `one refresh attempt, then one retry of original request`

### 4.2 Backend
- access_token_lifetime: `short-lived`
- refresh_token_strategy: `rotating refresh tokens`
- refresh_token_storage: `hashed in database`
- refresh_endpoint: `dedicated endpoint`
- session_policy: `single-session-only (new login invalidates previous session)`

## 5. Authorization
- model: `basic RBAC`
- roles:
  - `admin`
  - `user`
- default_rule: `user accesses own resources, admin can access all`

## 6. Internationalization (i18n)
- library: `Transloco`
- supported_languages:
  - `en`
  - `es`
- fallback_language: `en`
- scope: `UI translations only`

## 7. Data Conventions
- id_strategy: `UUID`
- schema_change_strategy: `TypeORM migrations only`
- schema_sync: `disabled (no auto schema sync)`

## 8. Cookie and CORS Baseline
- refresh_cookie.http_only: `true`
- refresh_cookie.secure:
  - `true` in production
  - `false` in local development
- refresh_cookie.same_site: `Lax`
- cors:
  - `origin`: allowlist web origin
  - `credentials`: `true`

## 9. Testing Baseline
- scope: `bare minimum for starter`
- e2e_projects:
  - `apps/web-e2e`: `keep`
  - `apps/api-e2e`: `keep`
- required_tests:
  - `API auth flow`: login, refresh, protected route
  - `Web auth interceptor`: single refresh + request retry

## 10. Initial Scaffolding CLI Defaults

### 10.1 Angular app (`web`)
- generator: `@nx/angular:application`
- generation_target: `apps/web` (recommended Nx monorepo layout)
- flags:
  - `--name=web`
  - `--tags=type:app,scope:web`
  - `--style=scss`
- component_generation_default:
  - `changeDetection`: `OnPush`

### 10.2 NestJS app (`api`)
- generator: `@nx/nest:application`
- generation_target: `apps/api` (recommended Nx monorepo layout)
- flags:
  - `--name=api`
  - `--tags=type:app,scope:api`
  - `--linter=eslint`
  - `--strict=true`
  - `--unitTestRunner=jest`
  - `--frontendProject=web`

### 10.3 Commands (recommended layout)
- angular:
  - `npx nx g @nx/angular:application apps/web --name=web --tags=type:app,scope:web --style=scss`
- nest:
  - `npx nx g @nx/nest:application apps/api --name=api --tags=type:app,scope:api --linter=eslint --strict=true --unitTestRunner=jest --frontendProject=web`
