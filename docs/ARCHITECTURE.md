# Full-Stack Starter Architecture

## 1. Purpose
This file is the project map for placing changes in the right layer.

Use it to answer:
- what this system does
- which modules own which rules
- where to implement a change first

For AI-assisted work, read this with:
- [`AI_CONTRACT.md`](./AI_CONTRACT.md)
- [`commands-reference.md`](./commands-reference.md)
- [`specs/_template.md`](./specs/_template.md)
- [`DECISIONS.md`](./DECISIONS.md)
- [`auth-security-baseline.md`](./auth-security-baseline.md)

## 2. System Purpose
Full-stack starter monorepo for side projects and small/medium applications.

Current baseline capabilities:
- Angular web app (`apps/web`)
- NestJS API (`apps/api`) under `/api/v1`
- PostgreSQL persistence via TypeORM
- JWT access + refresh session auth foundation
- e2e projects for API and web

## 3. High-Level System Map
- `apps/web`: UI, routing, client auth state/interceptor, HTTP calls to `/api`
- `apps/api`: HTTP endpoints, auth flows, business orchestration, configuration
- `apps/api/src/db`: entities, migrations, TypeORM data-source options
- `libs/shared/contracts`: shared DTO-like contract shapes only
- `libs/shared/utils`: shared pure helpers only
- `apps/api-e2e`, `apps/web-e2e`: runtime behavior verification

Request flow (baseline):
1. Web triggers request
2. API controller/guard accepts and validates transport/auth concerns
3. API service executes business/domain rule
4. Persistence layer reads/writes data
5. Response returns to web for rendering

## 4. Core Domains and Modules
### 4.1 Authentication and Sessions
- API ownership:
  - `apps/api/src/app/auth/*`
  - `apps/api/src/db/entities/auth-session.entity.ts`
- Web ownership:
  - `apps/web/src/app/auth/*`
- Domain baseline details:
  - [`auth-security-baseline.md`](./auth-security-baseline.md)

### 4.2 Persistence and Schema
- Ownership:
  - `apps/api/src/db/entities/*`
  - `apps/api/src/db/migrations/*`
  - `apps/api/src/db/*.ts`
- Rule baseline:
  - migration-driven schema changes (no auto schema sync)

### 4.3 Shared Cross-App Interfaces
- Ownership:
  - `libs/shared/contracts/*`
- Responsibility:
  - contract/type definitions shared by API and web

### 4.4 Shared Reusable Helpers
- Ownership:
  - `libs/shared/utils/*`
- Responsibility:
  - deterministic framework-agnostic helpers

## 5. Ownership Boundaries by Layer
### 5.1 UI Layer (`apps/web`)
Belongs here:
- rendering, presentation state, user interaction
- request orchestration from UI to API
- auth token attachment/refresh flow wiring on the client

Does not belong here:
- server business/domain rules
- persistence rules
- one-off hardcoded domain exceptions

### 5.2 API Transport Layer (`apps/api` controllers/guards/strategies/interceptors)
Belongs here:
- route mapping, request/response shaping
- authentication/authorization transport checks
- calling service/domain layer

Does not belong here:
- durable business/domain rules that should be reused outside one route
- schema/data-access rule decisions

### 5.3 Service/Business/Domain Layer (`apps/api/src/app/**` services/modules)
Belongs here:
- business rule execution
- domain-level validation and orchestration
- cross-entity behavior and policy decisions

Does not belong here:
- direct UI rendering concerns
- ad hoc special cases for single examples

### 5.4 Persistence/Data-Access Layer (`apps/api/src/db/**`)
Belongs here:
- entity shape and relational constraints
- migration history and schema evolution
- database-specific options/naming strategy/data source wiring

Does not belong here:
- UI logic
- route/controller concerns

### 5.5 Shared Libraries
- `libs/shared/contracts`:
  - contract primitives only, no business logic or runtime side effects
- `libs/shared/utils`:
  - pure reusable helpers, not a catch-all for domain rules

### 5.6 Enforced Module Boundaries
Workspace-level import/tag boundaries are enforced via:
- [`../eslint.config.mjs`](../eslint.config.mjs)

## 6. Change Placement Guidance (Start Here)
- API behavior change in auth/session flow:
  - start in `apps/api/src/app/auth/*`
  - update persistence entities/migrations only if data model changes
- Web display or interaction change:
  - start in `apps/web/src/app/*`
  - keep business rules in API/domain layer
- Contract shape change used by API and web:
  - start in `libs/shared/contracts/*`
  - then update API/web callers
- Schema/constraint/index change:
  - start with new migration in `apps/api/src/db/migrations/*`
  - update related entities in `apps/api/src/db/entities/*`
- Cross-cutting rule/policy change:
  - write/update a spec first in `docs/specs/*`
  - record accepted trade-offs in [`DECISIONS.md`](./DECISIONS.md)

## 7. Documentation Boundaries
This file is architectural and placement-focused.

Use other docs for non-architectural detail:
- session rules and auth status: [`auth-security-baseline.md`](./auth-security-baseline.md)
- run commands and gate profiles: [`commands-reference.md`](./commands-reference.md)
- implementation status snapshots: [`implementation-baseline.md`](./implementation-baseline.md)
- AI workflow/policy rules: [`AI_CONTRACT.md`](./AI_CONTRACT.md)
- design decision log: [`DECISIONS.md`](./DECISIONS.md)
- architecture boundaries and project decisions live in project docs under `docs/*`.
- technology/framework implementation practices should use relevant local skills in `C:\Users\Development\.agents\skills\` as the preferred modern-practice reference.
