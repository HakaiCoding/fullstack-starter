# Full-Stack Starter Scaffolding Reference

## 0. Scope
- purpose: `reference defaults/commands for generating new projects`
- note: `this file documents scaffolding intent, not current runtime implementation status`

## 1. Initial Scaffolding CLI Defaults

### 1.1 Angular app (`web`)
- generator: `@nx/angular:application`
- generation_target: `apps/web` (recommended Nx monorepo layout)
- flags:
  - `--name=web`
  - `--tags=type:app,scope:web`
  - `--style=scss`
- workspace_generator_defaults (from `nx.json`):
  - `linter`: `eslint`
  - `unitTestRunner`: `vitest-angular`
  - `e2eTestRunner`: `playwright`
- component_generation_default:
  - `changeDetection`: `OnPush`

### 1.2 NestJS app (`api`)
- generator: `@nx/nest:application`
- generation_target: `apps/api` (recommended Nx monorepo layout)
- flags:
  - `--name=api`
  - `--tags=type:app,scope:api`
  - `--linter=eslint`
  - `--strict=true`
  - `--unitTestRunner=jest`
  - `--frontendProject=web`

### 1.3 Commands (recommended layout)
- angular:
  - `npx nx g @nx/angular:application apps/web --name=web --tags=type:app,scope:web --style=scss`
- nest:
  - `npx nx g @nx/nest:application apps/api --name=api --tags=type:app,scope:api --linter=eslint --strict=true --unitTestRunner=jest --frontendProject=web`
