# Fullstack Starter Monorepo

Nx monorepo starter for side projects and small-to-medium full-stack apps.

## Workspace Structure
- `apps/web` - Angular frontend app (Angular Material UI library)
- `apps/api` - NestJS backend app (`/api/v1`)
- `apps/web-e2e` - Playwright e2e tests for `web`
- `apps/api-e2e` - Jest e2e tests for `api`
- `libs/shared/contracts` - shared contracts/types
- `libs/shared/utils` - shared utility functions
- Root workflow artifacts: `AI_CONTRACT.md`, `AI_SKILLS.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `projectmap.md`, `specs/`
- `docs` - supplementary workflow documentation (commands/index)

## Prerequisites
- Node.js `24.15.0`
- npm `11.12.1`
- Docker Engine + Docker Compose

## Quick Start
```sh
npm ci
copy .env.docker.example .env.docker
npx nx run web:serve
```

`web:serve` depends on `api:serve`, so both apps start together.

## Docs First
Start with [`docs/README.md`](./docs/README.md) for canonical document index and read order.
Workflow/spec-trigger authority lives in [`AI_CONTRACT.md`](./AI_CONTRACT.md).

## Common Commands
For the canonical command list, use:
- [`docs/commands-reference.md`](./docs/commands-reference.md)

## Scoped READMEs
- [`apps/README.md`](./apps/README.md)
- [`libs/README.md`](./libs/README.md)
- [`docs/README.md`](./docs/README.md)
