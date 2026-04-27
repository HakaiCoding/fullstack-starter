# Project Map

Concise project map for fast orientation.
Detailed architecture and placement authority remains in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Purpose
Full-stack starter monorepo for small/medium applications with:
- Angular web app (`apps/web`)
- NestJS API (`apps/api`) under `/api/v1`
- PostgreSQL persistence via TypeORM migrations
- JWT access + refresh auth/session baseline
- API and web e2e verification projects

## Core Domains and Modules
- Authentication and sessions:
  - API: `apps/api/src/app/features/auth/*`
  - Web: `apps/web/src/app/core/auth/*`
  - Policy/spec references: [`DECISIONS.md`](./DECISIONS.md), [`specs/role-persistence-jwt-claim-rbac-baseline.md`](./specs/role-persistence-jwt-claim-rbac-baseline.md), [`specs/first-meaningful-rbac-protected-route-decision.md`](./specs/first-meaningful-rbac-protected-route-decision.md)
- Persistence and schema:
  - `apps/api/src/db/entities/*`
  - `apps/api/src/db/migrations/*`
  - `apps/api/src/db/*.ts`
- Shared contracts:
  - `libs/shared/contracts/*`
- Shared pure helpers:
  - `libs/shared/utils/*`

## Rule Ownership (Quick)
- UI (`apps/web`): presentation and interaction only, no durable business/domain rules.
- API transport (`controllers/guards/strategies`): transport/auth checks and request shaping.
- Service/domain (`apps/api/src/app/**` services/modules): business/domain rules.
- Persistence (`apps/api/src/db/**`): entities, schema constraints, migrations.
- Shared contracts/utils: no misplaced domain policy.

## High-Level Data Flow
1. Web triggers request.
2. API transport layer validates/authenticates request.
3. API service/domain layer executes rule/business logic.
4. Persistence layer reads/writes data.
5. API responds and web renders result.

## Where Changes Should Start
- Auth/session behavior: `apps/api/src/app/features/auth/*`.
- Web display/interaction: `apps/web/src/app/features/*` or `apps/web/src/app/layout/*`.
- Shared API/web contract shapes: `libs/shared/contracts/*`.
- Schema/index/constraint changes: `apps/api/src/db/migrations/*` and related entities.
- Cross-cutting business/policy changes: create/update spec in `specs/*` first.

## Checks and Gates
- Command and gate authority: [`docs/commands-reference.md`](./docs/commands-reference.md).
- Tiering and workflow policy: [`AI_CONTRACT.md`](./AI_CONTRACT.md).
- Local Skills usage policy: [`AI_SKILLS.md`](./AI_SKILLS.md).
- Tier model remains:
  - `tiny/local`
  - `normal implementation`
  - `core`

## Detailed References
- Detailed architecture and placement: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Workflow policy and completion checks: [`AI_CONTRACT.md`](./AI_CONTRACT.md)
- Local Skills policy, reporting, and inventory handling: [`AI_SKILLS.md`](./AI_SKILLS.md)
- Decision log: [`DECISIONS.md`](./DECISIONS.md)
- Spec template and specs: [`specs/_template.md`](./specs/_template.md), `specs/*`
