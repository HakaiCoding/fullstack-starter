# Fullstack Starter Monorepo

Nx monorepo starter for side projects and small-to-medium full-stack apps.

## Workspace Structure
- `apps/web` - Angular frontend app
- `apps/api` - NestJS backend app (`/api/v1`)
- `apps/web-e2e` - Playwright e2e tests for `web`
- `apps/api-e2e` - Jest e2e tests for `api`
- `libs/shared/contracts` - shared contracts/types
- `libs/shared/utils` - shared utility functions
- `docs` - architecture, AI workflow contract, specs, decisions, and command gates

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
Read [`docs/README.md`](./docs/README.md) for:
- required read order before coding
- architecture and AI workflow constraints
- feature spec requirements for core changes
- commands and gate profiles
Canonical "When a Spec Is Required" criteria live in [`docs/README.md`](./docs/README.md#when-a-spec-is-required).

## Common Commands
For the canonical command list, use:
- [`docs/commands-reference.md`](./docs/commands-reference.md)

## Scoped READMEs
- [`apps/README.md`](./apps/README.md)
- [`libs/README.md`](./libs/README.md)
- [`docs/README.md`](./docs/README.md)
