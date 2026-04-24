# API App (`apps/api`)

NestJS backend application.

## Runtime Contract
- Base path: `/api/v1`
- Local URL: `http://localhost:3000/api/v1`
- Current sample endpoint: `GET /api/v1` -> `{ "message": "Hello API" }`

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
- [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)
- [`../../docs/AI_CONTRACT.md`](../../docs/AI_CONTRACT.md)
- [`../../docs/auth-security-baseline.md`](../../docs/auth-security-baseline.md) (for auth/session changes)

Placement reminders:
- Controllers/guards/strategies handle transport/auth wiring.
- Business/domain rules belong in service/domain modules.
- Persistence rules belong in `apps/api/src/db/*` entities/migrations/options.
