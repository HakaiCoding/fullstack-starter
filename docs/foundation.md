# Full-Stack Starter Foundation

## 1. Purpose
- goal: Build a clean, practical, maintainable full-stack starter for side projects and small/medium projects.
- principle: Prioritize a solid foundation without overengineering.

## 1.1 Source of Truth Policy
- authoritative_files:
  - `package.json` (declared version ranges)
  - `package-lock.json` (exact resolved versions)
- docs_role: `this file is a synced summary, not an authoritative source`
- sync_rule: `if docs and workspace files disagree, update docs to match workspace files`
- planning_rule: `dependencies not currently installed must be marked as planned`

## 2. Stack (Synced Summary)
- runtime.node: `24.15.0`
- package_manager.npm: `11.12.1`
- monorepo.nx: `22.6.5`
- frontend.angular: `declared ~21.2.0 (resolved 21.2.10)`
- frontend.angular_material: `planned (not installed)`
- backend.nestjs: `11.1.19`
- orm.typeorm: `planned (not installed)`
- database.postgresql: `planned (not installed)`
- i18n.transloco: `planned (not installed)`
- local_infra: `implemented (docker-compose.yml for database-only local PostgreSQL; env/scripts wired in workspace)`

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
- boundary_enforcement: `@nx/enforce-module-boundaries (ESLint)`
- module_boundaries:
  - `type:app` can depend on: `type:contracts`, `type:util`
  - `type:e2e` can depend on: `type:contracts`, `type:util`
  - `type:contracts` can depend on: `type:contracts`
  - `type:util` can depend on: `type:util`
  - `scope:web` can depend on: `scope:web`, `scope:shared`
  - `scope:api` can depend on: `scope:api`, `scope:shared`
  - `scope:shared` can depend on: `scope:shared`
