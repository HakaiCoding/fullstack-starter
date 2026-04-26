# Web App (`apps/web`)

Angular frontend application.

## Runtime
- Local URL: `http://localhost:4200`
- API access: proxied from `/api` to `http://localhost:3000` via `proxy.conf.json`

## UI Baseline
- UI component library: Angular Material (`@angular/material`) with CDK (`@angular/cdk`)
- Theme baseline: Material 3 theme configured in `src/styles.scss` via `mat.theme(...)`
- Animations baseline: `provideAnimationsAsync()` in `src/app/app.config.ts`
- Typography/icons baseline: Roboto + Material Icons loaded in `src/index.html`

## Nx Targets
```sh
npx nx run web:serve
npx nx run web:build
npx nx run web:test
npx nx run web:lint
```

## Boundary Guidance
Before implementing web changes, read:
- [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)
- [`../../docs/AI_CONTRACT.md`](../../docs/AI_CONTRACT.md)

Placement reminders:
- UI/components handle rendering, interaction, and API call orchestration.
- Business/domain rules should not be implemented in UI components.
- Cross-app contracts should live in `libs/shared/contracts`.

## Source Structure Baseline
- `src/app/core/*`: app-wide infrastructure (for example auth services/interceptors/types)
- `src/app/layout/*`: shell/layout components
- `src/app/features/*`: routed/user-facing features
- keep root app bootstrap/wiring files in `src/app/` (`app.ts`, `app.config.ts`, `app.routes.ts`)
