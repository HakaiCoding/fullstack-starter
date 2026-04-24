# Fullstack Starter Monorepo

Nx monorepo starter for side projects and small-to-medium full-stack apps.

## Workspace Structure

- `apps/web` - Angular frontend app
- `apps/api` - NestJS backend app (`/api/v1`)
- `apps/web-e2e` - Playwright e2e tests for `web` (Chromium default)
- `apps/api-e2e` - Jest e2e tests for `api`
- `libs/shared/contracts` - shared contracts/types
- `libs/shared/utils` - shared utility functions
- `docs` - architecture and baseline decision docs

See scoped READMEs:

- [`apps/README.md`](./apps/README.md)
- [`libs/README.md`](./libs/README.md)
- [`docs/README.md`](./docs/README.md)

## Prerequisites

- Node.js `24.15.0`
- npm `11.12.1`
- Docker Engine + Docker Compose

## Quick Start

```sh
npm ci
npx nx run web:serve
```

`web:serve` depends on `api:serve`, so both apps start together.

## Common Nx Commands

```sh
# Lint/test/build all projects
npx nx run-many -t lint,test,build --all

# Run API + web individually
npx nx run api:serve
npx nx run web:serve

# API e2e
npx nx e2e api-e2e

# Web e2e (Chromium)
npx playwright install chromium
npx nx e2e web-e2e
```

## Local PostgreSQL (Docker)

1. Create local Docker env file:

```sh
copy .env.docker.example .env.docker
```

2. Start PostgreSQL:

```sh
npm run db:up
```

3. Check status/health:

```sh
npm run db:ps
npm run db:health
```

4. Stop services (keeps the named volume):

```sh
npm run db:down
```

5. Reset local PostgreSQL data (destructive; removes all DB data in the named volume):

```sh
npm run db:down
docker volume rm fullstack-starter-pgdata
npm run db:up
```

If you changed `POSTGRES_VOLUME_NAME` in `.env.docker`, replace `fullstack-starter-pgdata` with your configured volume name.

## Docs

- Foundation summary: [`docs/fullstack-starter-foundation-notes.md`](./docs/fullstack-starter-foundation-notes.md)
- Auth/security baseline: [`docs/fullstack-starter-auth-security-baseline.md`](./docs/fullstack-starter-auth-security-baseline.md)
- Implementation baseline: [`docs/fullstack-starter-implementation-baseline.md`](./docs/fullstack-starter-implementation-baseline.md)
- Scaffolding reference: [`docs/fullstack-starter-scaffolding-reference.md`](./docs/fullstack-starter-scaffolding-reference.md)

## Module Boundaries

Module boundaries are enforced with Nx ESLint rules:

- `type:app` -> can depend on `type:contracts`, `type:util`
- `type:e2e` -> can depend on `type:contracts`, `type:util`
- `type:contracts` -> can depend on `type:contracts`
- `type:util` -> can depend on `type:util`
- `scope:web` -> can depend on `scope:web`, `scope:shared`
- `scope:api` -> can depend on `scope:api`, `scope:shared`
- `scope:shared` -> can depend on `scope:shared`
