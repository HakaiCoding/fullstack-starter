# Feature Spec

## Feature/Change Name
- name: App folder convention baseline restructure (`apps/web/src`, `apps/api/src`)

## Date
- yyyy-mm-dd: 2026-04-26

## Status
- Accepted

## Problem
- `apps/web/src/app` currently mixes app-wide infrastructure (`auth`), layout (`app-shell`), and routed UI feature (`home`) at the same level without a clear starter convention.
- `apps/api/src/app` currently mixes feature modules (`auth`, `users`) with root/system files (`app.controller`, `app.service`, `database-readiness.service`) at the same level.
- This makes ownership and placement less obvious as features are added, increasing refactor risk and review friction.

## Non-Goals
- no runtime behavior changes
- no auth/session behavior changes
- no API contract changes
- no persistence/entity/schema/migration changes
- no dependency additions
- no speculative architecture layers
- no movement of shared contracts out of `libs/shared/contracts`
- no movement of persistence code out of `apps/api/src/db`

## Behavior Rules
- Preserve runtime behavior exactly; this is a placement/convention change only.
- Implement and adopt the following baseline structures:

```text
apps/web/src/
  app/
    app.ts
    app.html
    app.spec.ts
    app.config.ts
    app.routes.ts
    core/
      auth/
    layout/
      app-shell/
    features/
      home/

apps/api/src/
  app/
    app.module.ts
    config/
    system/
    features/
      auth/
      users/
  db/
```

- Required file moves:
  - `apps/web/src/app/auth/*` -> `apps/web/src/app/core/auth/*`
  - `apps/web/src/app/app-shell/*` -> `apps/web/src/app/layout/app-shell/*`
  - `apps/web/src/app/home/*` -> `apps/web/src/app/features/home/*`
  - `apps/api/src/app/auth/*` -> `apps/api/src/app/features/auth/*`
  - `apps/api/src/app/users/*` -> `apps/api/src/app/features/users/*`
  - `apps/api/src/app/app.controller*`, `app.service*`, `database-readiness.service*` -> `apps/api/src/app/system/*`
  - keep `apps/api/src/app/config/*` and `apps/api/src/db/*` in place
- Update all imports/references affected by file moves before merge.

## Forbidden Behavior
- introducing architectural depth beyond `core/layout/features` (web) and `config/system/features` (api) for this pass
- introducing code behavior changes while rewriting imports
- moving auth/session, contracts, or persistence ownership boundaries outside accepted locations

## Affected Domains/Modules
- domains:
  - web UI structure and routing placement
  - API module placement and root/system wiring
- modules/files likely affected:
  - `apps/web/src/app/**`
  - `apps/api/src/app/**`
  - `docs/ARCHITECTURE.md`
  - `docs/DECISIONS.md`
  - `apps/web/README.md`
  - `apps/api/README.md`

## Design Placement Summary
- Web:
  - `app/core/*` for app-wide infrastructure (auth services/interceptor/types)
  - `app/layout/*` for shell/layout components
  - `app/features/*` for routed/user-facing features
- API:
  - `app/config/*` for configuration parsing/validation
  - `app/system/*` for root app system files (root controller/service/readiness)
  - `app/features/*` for feature modules (`auth`, `users`)
  - `src/db/*` remains the persistence boundary
- Do not place durable business rules in Angular UI components or in wrong-layer Nest transport helpers/controllers.

## Relevant Local Skills
- skills inspected:
  - `nx-workspace-patterns`
  - `angular-best-practices`
  - `angular-routing`
  - `nestjs-best-practices`
- skills used:
  - `nx-workspace-patterns` for monorepo boundary consistency principles
  - `angular-best-practices` and `angular-routing` for feature-oriented Angular app organization
  - `nestjs-best-practices` for feature-module-first Nest organization
- why each skill is relevant:
  - this change is a framework + Nx placement convention change, not feature behavior work
- conflicts/tensions with project docs/spec:
  - Nest skill examples often colocate entities/DTOs with features; project docs keep persistence in `apps/api/src/db/*`
- project-compatible decision:
  - follow project docs as authority and keep `src/db` ownership unchanged

## Edge Cases
- stale relative imports after nested folder moves
- accidental partial moves leaving orphan spec imports
- unresolved old-path references in docs or tests

## Risks
- risk 1: stale import paths can break compile/lint
  - mitigation: targeted path rewrites + `rg` stale-path scan + full core gates
- risk 2: hidden module wiring regressions in API root module imports
  - mitigation: verify `AppModule` imports/providers/controllers after move and run test/build/e2e gates
- rollback/review risk:
  - broad path-only churn can hide accidental behavior edits
  - mitigation: keep changes scoped to moves/imports/docs and review diffs for non-path logic edits

## Test Plan
- unit tests:
  - run workspace tests via core gate command
- integration/e2e tests:
  - run `api-e2e` and `web-e2e` because app-boundary wiring changed
- regression coverage:
  - lint + test + build across all projects
- anti-hack coverage for behavior changes (general rule coverage, not only the shown example):
  - reject example-specific patches
  - reject hardcoded special cases when the real rule is broader
  - reject wrong-layer business-rule placement

## Required Gates
Use commands from [`../commands-reference.md`](../commands-reference.md).
- core gates:
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e`
  - `npx nx e2e web-e2e`
- manual/proposed checks:
  - verify architecture placement remains aligned with `docs/ARCHITECTURE.md` and `docs/AI_CONTRACT.md`
  - verify no runtime/auth/session/API contract/persistence behavior changes were introduced

## Acceptance Checks
- folder structure matches the approved baseline for `apps/web/src` and `apps/api/src`
- all moved files compile and tests resolve imports
- no behavior changes to runtime/API/auth/persistence
- no example-specific patches, hardcoded special cases, or wrong-layer business-rule placement introduced

## Documentation Updates Needed
- docs to update:
  - `docs/ARCHITECTURE.md` (path examples/ownership references)
  - `apps/web/README.md` (local structure guidance)
  - `apps/api/README.md` (local structure guidance)
- include this spec in `docs/specs/` as core-change record
- completion status:
  - completed in this implementation pass

## Decision Log Updates Needed
- `docs/DECISIONS.md` required a new accepted decision entry adopting the folder-convention baseline for `web` and `api` app sources
- completion status:
  - completed in this implementation pass
