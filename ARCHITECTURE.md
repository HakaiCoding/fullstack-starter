# Full-Stack Starter Architecture

## 1. Purpose
This file is the detailed architecture and placement authority.
For the concise project map artifact, use [`projectmap.md`](./projectmap.md).

Use it to answer:
- what this system does
- which modules own which rules
- where to implement a change first

For AI-assisted work, read this with:
- [`AI_CONTRACT.md`](./AI_CONTRACT.md)
- [`docs/commands-reference.md`](./docs/commands-reference.md)
- [`specs/_template.md`](./specs/_template.md)
- [`DECISIONS.md`](./DECISIONS.md)
- relevant auth/security specs in [`specs/`](./specs/)

## 2. System Purpose
Full-stack starter monorepo for side projects and small/medium applications.

Current baseline capabilities:
- Angular web app (`apps/web`) using Angular Material as the default UI component library
- NestJS API (`apps/api`) under `/api/v1`
- PostgreSQL persistence via TypeORM
- JWT access + refresh session auth foundation
- e2e projects for API and web

## 3. High-Level System Map
- `apps/web`: UI (Angular Material), routing, client auth state/interceptor, HTTP calls to `/api`
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
  - `apps/api/src/app/features/auth/*`
  - `apps/api/src/db/entities/auth-session.entity.ts`
- Web ownership:
  - `apps/web/src/app/core/auth/*`
- Policy/spec references:
  - [`DECISIONS.md`](./DECISIONS.md)
  - [`specs/role-persistence-jwt-claim-rbac-baseline.md`](./specs/role-persistence-jwt-claim-rbac-baseline.md)
  - [`specs/first-meaningful-rbac-protected-route-decision.md`](./specs/first-meaningful-rbac-protected-route-decision.md)
  - [`specs/auth-invalid-input-auth-error-behavior-baseline.md`](./specs/auth-invalid-input-auth-error-behavior-baseline.md)
  - [`specs/global-validationpipe-rollout-decision.md`](./specs/global-validationpipe-rollout-decision.md)
  - [`specs/stable-api-error-response-contract-baseline.md`](./specs/stable-api-error-response-contract-baseline.md)

### 4.2 Persistence and Schema
- Ownership:
  - `apps/api/src/db/entities/*`
  - `apps/api/src/db/migrations/*`
  - `apps/api/src/db/*.ts`
- Rule baseline:
  - migration-driven schema changes (no auto schema sync)
  - UUID id strategy
  - snake_case naming strategy

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

### 4.5 Configuration and Runtime Contracts
- Ownership:
  - `apps/api/src/app/config/*`
- Environment contract groups:
  - database: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, optional `POSTGRES_SSL`
  - auth/cookie: `NODE_ENV`, `AUTH_ACCESS_TOKEN_SECRET`, `AUTH_ACCESS_TOKEN_TTL_SECONDS`, `AUTH_REFRESH_TOKEN_SECRET`, `AUTH_REFRESH_TOKEN_TTL_SECONDS`, `AUTH_REFRESH_COOKIE_NAME`, `AUTH_REFRESH_COOKIE_SECURE`, `AUTH_REFRESH_COOKIE_SAME_SITE`
  - CORS: `API_CORS_ALLOWED_ORIGINS`
- Runtime safety and transport policy references:
  - [`DECISIONS.md`](./DECISIONS.md)
  - [`specs/auth-invalid-input-auth-error-behavior-baseline.md`](./specs/auth-invalid-input-auth-error-behavior-baseline.md)
  - [`specs/stable-api-error-response-contract-baseline.md`](./specs/stable-api-error-response-contract-baseline.md)

## 5. Ownership Boundaries by Layer
### 5.1 UI Layer (`apps/web`)
Belongs here:
- rendering, presentation state, user interaction
- Angular Material component composition and theming usage for web presentation
- request orchestration from UI to API
- auth token attachment/refresh flow wiring on the client
- accepted frontend boundary convention baseline:
  - `*ApiService` owns HTTP/backend endpoint calls and transport mapping, not durable backend-derived state ownership.
  - `*StateService` owns backend-derived state/resources and app-facing state methods; boundary components should consume state services.
  - presentational/reusable child components should prefer `input()/output()` and avoid `*ApiService`/`*StateService` injection unless a documented exception is approved.
  - auth refresh/interceptor/helper collaborators may be documented exception candidates when strict split is materially awkward.
  - adoption is phased; legacy non-compliant source is not immediate mandatory cleanup.

Does not belong here:
- server business/domain rules
- persistence rules
- one-off hardcoded domain exceptions

### 5.2 API Transport Layer (`apps/api` controllers/guards/strategies/interceptors)
Belongs here:
- route mapping, request/response shaping
- authentication/authorization transport checks
- structured request validation DTOs for request body/query/params transport inputs
- calling service/domain layer

Does not belong here:
- durable business/domain rules that should be reused outside one route
- schema/data-access rule decisions
- replacing entities/DB constraints/guards/services/domain rules with transport DTOs

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
  - request-validation DTOs are not auto-shared; keep app-local unless a spec/decision accepts shared external-contract scope
- `libs/shared/utils`:
  - pure reusable helpers, not a catch-all for domain rules

### 5.6 Enforced Module Boundaries
Workspace-level import/tag boundaries are enforced via:
- [`eslint.config.mjs`](./eslint.config.mjs)

## 6. Change Placement Guidance (Start Here)
- API behavior change in auth/session flow:
  - start in `apps/api/src/app/features/auth/*`
  - update persistence entities/migrations only if data model changes
- Web display or interaction change:
  - start in `apps/web/src/app/features/*` (or `apps/web/src/app/layout/*` for app-shell/layout concerns)
  - keep business rules in API/domain layer
- Contract shape change used by API and web:
  - start in `libs/shared/contracts/*`
  - then update API/web callers
- Structured API request-validation change:
  - start in owning API feature module DTO/pipes near the route/controller
  - keep request DTO app-local unless shared external-contract scope is explicitly accepted
- Schema/constraint/index change:
  - start with new migration in `apps/api/src/db/migrations/*`
  - update related entities in `apps/api/src/db/entities/*`
- Cross-cutting rule/policy change:
  - write/update a spec first in `specs/*`
  - record accepted trade-offs in [`DECISIONS.md`](./DECISIONS.md)

## 7. Documentation Boundaries
This file is architectural and placement-focused.

Use other docs for non-architectural detail:
- run commands and gate profiles: [`docs/commands-reference.md`](./docs/commands-reference.md)
- AI workflow/policy rules: [`AI_CONTRACT.md`](./AI_CONTRACT.md)
- local Skills usage policy and inventory handling: [`AI_SKILLS.md`](./AI_SKILLS.md)
- design decision log: [`DECISIONS.md`](./DECISIONS.md)
- concise project map artifact: [`projectmap.md`](./projectmap.md)
- auth/security behavior contracts and deferred scope: relevant files in [`specs/`](./specs/)
- supplementary documentation lives under `docs/*`.
- technology/framework implementation practices should use relevant local Skills as preferred modern-practice reference, following [`AI_SKILLS.md`](./AI_SKILLS.md).
