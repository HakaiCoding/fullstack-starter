# API App (`apps/api`)

NestJS backend application.

## Runtime Contract
- Base path: `/api/v1`
- Local URL: `http://localhost:3000/api/v1`
- Stable root/smoke endpoint:
  - `GET /api/v1` -> `{ "name": "Fullstack Starter API", "version": "v1", "status": "ok" }`
- Stable liveness endpoint:
  - `GET /api/v1/health` -> `{ "status": "ok", "checks": { "api": "ok" } }`
- Stable database readiness endpoint:
  - `GET /api/v1/health/db` success -> `{ "status": "ok", "checks": { "database": "ok" } }`
  - `GET /api/v1/health/db` failure -> stable API error envelope with `503`:
    - `{ "statusCode": 503, "error": { "code": "SERVICE_UNAVAILABLE", "message": "Service unavailable." } }`

## Database Environment Contract
- `POSTGRES_HOST` (required)
- `POSTGRES_PORT` (required)
- `POSTGRES_DB` (required)
- `POSTGRES_USER` (required)
- `POSTGRES_PASSWORD` (required)
- `POSTGRES_SSL` (optional, default: `false`)

These keys are shared with local Docker PostgreSQL setup (`.env.docker`).

## Nx Targets
```sh
npx nx run api:serve
npx nx run api:build
npx nx run api:test
npx nx run api:lint
```

## Boundary Guidance
Before implementing API changes, read:
- [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md)
- [`../../AI_CONTRACT.md`](../../AI_CONTRACT.md)
- [`../../DECISIONS.md`](../../DECISIONS.md) and relevant auth/security specs in [`../../specs/`](../../specs/) (for auth/session changes)

Placement reminders:
- Controllers/guards/strategies handle transport/auth wiring.
- Business/domain rules belong in service/domain modules.
- Persistence rules belong in `apps/api/src/db/*` entities/migrations/options.

## Source Structure Baseline
- `src/app/config/*`: configuration parsing and validation
- `src/app/system/*`: root app system files (root controller/service/readiness)
- `src/app/features/*`: API feature modules (for example `auth`, `users`)
- `src/db/*`: persistence boundary (entities, migrations, data-source, TypeORM options)
