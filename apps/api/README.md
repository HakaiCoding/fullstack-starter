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

## Notes

- `web` uses proxy config to forward `/api` requests to this app.
- Keep public DTO/contracts in `libs/shared/contracts`.
- Keep pure shared helpers in `libs/shared/utils`.
