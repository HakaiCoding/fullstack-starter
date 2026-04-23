# Full-Stack Starter Scaffolding Reference

## 1. Initial Scaffolding CLI Defaults

### 1.1 Angular app (`web`)
- generator: `@nx/angular:application`
- generation_target: `apps/web` (recommended Nx monorepo layout)
- flags:
  - `--name=web`
  - `--tags=type:app,scope:web`
  - `--style=scss`
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
