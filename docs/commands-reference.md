# Full-Stack Starter Commands Reference

Practical day-to-day commands for this workspace.  
Run commands from the repository root.

## 1. Setup

```sh
npm ci
copy .env.docker.example .env.docker
```

`API_CORS_ALLOWED_ORIGINS` in `.env.docker` is required for API startup (comma-separated allowlist).  
Default local value in `.env.docker.example`: `http://localhost:4200`.

## 2. Daily Development

```sh
# Start web + api together (web depends on api:serve)
npx nx run web:serve

# Start only one app
npx nx run api:serve
npx nx run web:serve
```

## 3. Lint, Test, Build

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
```

## 4. E2E

```sh
# API e2e (Jest)
npx nx e2e api-e2e

# Web e2e (Playwright)
npx playwright install chromium
npx nx e2e web-e2e
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

## 6. TypeORM Migrations

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

# Run only affected projects
npx nx affected -t lint,test,build

# Clear Nx cache/daemon state
npx nx reset
```
