# Full-Stack Starter Commands Reference

Practical commands for this workspace.
Run from repository root.

This file is the supplementary command/gate authority for runnable checks and command bundles.
Workflow obligations (tier definitions, spec requirements, completion checklist, and broader policy rules) remain in [`../AI_CONTRACT.md`](../AI_CONTRACT.md).
For canonical doc navigation/read order, use [`README.md`](./README.md).

## 1. Setup

```sh
npm ci
copy .env.docker.example .env.docker
```

`API_CORS_ALLOWED_ORIGINS` in `.env.docker` is required for API startup.
Default local value in `.env.docker.example`: `http://localhost:4200`.

## 2. Daily Development

```sh
# Start web + api together (web depends on api:serve)
npx nx run web:serve

# Start only one app
npx nx run api:serve
npx nx run web:serve
```

## 3. Build, Lint, and Test Commands

```sh
# Entire workspace
npx nx run-many -t lint,test,build --all

# Per app
npx nx run api:lint
npx nx run api:test
npx nx run api:build

npx nx run web:lint
npx nx run web:test
npx nx run web:build

# Affected projects only
npx nx affected -t lint,test,build
```

Note: no dedicated workspace `typecheck` command is currently documented.
Current practical proxy is project `build` targets.

## 4. E2E Commands

```sh
# Start local DB before API e2e (recommended)
npm run db:up
npm run db:health

# API e2e (Jest)
npx nx e2e api-e2e

# Web e2e (Playwright; auto-installs Chromium via web-e2e:install-chromium)
npx nx e2e web-e2e

# Optional prewarm step for local images/CI
npx playwright install chromium

# Optional local teardown after e2e
npm run db:down
```

## 5. Local PostgreSQL (Docker Compose)

```sh
# Start / stop / inspect
npm run db:up
npm run db:down
npm run db:ps
npm run db:health
npm run db:logs
```

```sh
# Reset local DB data (destructive)
npm run db:down
docker volume rm fullstack-starter-pgdata
npm run db:up
```

If you changed `POSTGRES_VOLUME_NAME` in `.env.docker`, use that volume name instead.

## 6. TypeORM Migration Commands

```sh
# Create migration file
npm run db:migration:create -- apps/api/src/db/migrations/<migration-name>

# Apply/revert migrations
npm run db:migration:run
npm run db:migration:revert
```

## 7. Useful Nx Commands

```sh
# Show project graph
npx nx graph

# Clear Nx cache/daemon state
npx nx reset
```

## 8. Gate Profiles

Use tier names from [`../AI_CONTRACT.md`](../AI_CONTRACT.md):
- `tiny/local` -> use 8.1
- `normal implementation` -> use 8.2
- `core` -> use 8.3 plus relevant domain overlays (8.4-8.6)

Notes:
- no dedicated workspace `typecheck` command is currently documented; `build` targets are the practical proxy.
- no standalone automated forbidden-pattern command is currently documented.
- when gates are skipped, report skipped gates explicitly per [`../AI_CONTRACT.md`](../AI_CONTRACT.md).

### 8.1 Tiny/Local Change Gates
Use when the tier is `tiny/local`.

- for docs-only changes with no runtime impact, runtime gates may be skipped.
- if code is touched, run impacted project gates:

```sh
# Prefer impacted project gates
npx nx run api:lint
npx nx run api:test
npx nx run api:build

npx nx run web:lint
npx nx run web:test
npx nx run web:build

# or impacted-only across workspace
npx nx affected -t lint,test,build
```

### 8.2 Normal Implementation Gates
Use when the tier is `normal implementation`.

- run impacted project gates:

```sh
# Prefer impacted project gates
npx nx run api:lint
npx nx run api:test
npx nx run api:build

npx nx run web:lint
npx nx run web:test
npx nx run web:build

# or impacted-only across workspace
npx nx affected -t lint,test,build
```

- if auth/security or DB/migration work is touched, also apply 8.4 and/or 8.5.
- if behavior crosses app boundaries, auth flows, routing, or API contracts, also apply 8.6.

### 8.3 Core Change Gates
Use when the tier is `core`.

```sh
npx nx run-many -t lint,test,build --all
```

Then run relevant e2e commands for affected flows:

```sh
npx nx e2e api-e2e
npx nx e2e web-e2e
```

- explicitly report any gate not run.

### 8.4 Auth/Security Change Gates

```sh
npx nx run api:lint
npx nx run api:test
npx nx run api:build
npx nx e2e api-e2e
```

If web auth flow is changed, also run:

```sh
npx nx run web:lint
npx nx run web:test
npx nx run web:build
npx nx e2e web-e2e
```

### 8.5 Database/Migration Change Gates

```sh
npm run db:migration:create -- apps/api/src/db/migrations/<migration-name>
npm run db:migration:run
npm run db:migration:revert
npx nx run api:test
npx nx run api:build
```

Local DB helper commands when needed:

```sh
npm run db:up
npm run db:health
npm run db:down
```

### 8.6 E2E-Relevant Change Gates
Use when behavior crosses app boundaries, auth flows, routing, or API contracts.

```sh
npx nx e2e api-e2e
npx nx e2e web-e2e
```

Run one or both based on impacted behavior.
