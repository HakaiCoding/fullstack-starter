# Web App (`apps/web`)

Angular frontend application.

## Runtime
- Local URL: `http://localhost:4200`
- API access: proxied from `/api` to `http://localhost:3000` via `proxy.conf.json`

## UI Baseline
- UI component library: Angular Material (`@angular/material`) with CDK (`@angular/cdk`)
- Theme baseline: Material 3 theme configured in `src/styles.scss` via `mat.theme(...)`
- Styling authority: global Material theme in `src/styles.scss` is the default styling source for Angular Material components
- Override boundary: avoid local Material restyling/one-off overrides unless there is an explicit, documented feature-specific exception
- Policy reference: see `2026-04-28 - Treat global Material theme as styling authority for Material components` in [`../../DECISIONS.md`](../../DECISIONS.md)
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
- [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md)
- [`../../AI_CONTRACT.md`](../../AI_CONTRACT.md)

Placement reminders:
- UI/components handle rendering, interaction, and API call orchestration.
- Business/domain rules should not be implemented in UI components.
- Cross-app contracts should live in `libs/shared/contracts`.

## Frontend Service/Component Boundary Convention
- Policy status: accepted frontend baseline.
- `*ApiService` responsibilities:
  - own HTTP/backend endpoint calls and transport mapping.
  - do not own durable backend-derived UI/application state.
  - do not mutate `*StateService` state except through explicitly documented exceptions.
- `*StateService` responsibilities:
  - own backend-derived state/resources, loading/error state, derived readonly values, and app-facing methods.
  - may call `*ApiService` internally.
  - expose readonly state/signals/resources to consumers where practical.
- Component boundaries:
  - route/page/shell/feature-boundary components may inject `*StateService` and call public state methods.
  - presentational/reusable child components should prefer `input()/output()`.
  - presentational/reusable child components should not inject `*ApiService`.
  - presentational/reusable child components should not inject `*StateService` unless an explicit documented exception is approved.
  - purely visual, temporary, non-shared UI state may remain component-local.
- Adoption/enforcement:
  - rollout is phased; existing non-compliant source is legacy/current state, not immediate mandatory cleanup.
  - cleanup/refactor requires separate explicit approval.
  - enforcement is review-based for this baseline.
  - static/lint enforcement is optional future work.
- Exception handling:
  - auth refresh/interceptor/helper collaborators are valid exception candidates when strict split is materially awkward.
  - document exception rationale and scope in feature/spec docs.
  - use `DECISIONS.md` for durable cross-cutting, security-sensitive, or architecture-wide exceptions.
- Policy references:
  - [`../../DECISIONS.md`](../../DECISIONS.md) (`2026-04-30 - Accept frontend ApiService/StateService/component boundary convention baseline`)
  - [`../../specs/frontend-api-state-component-boundary-convention-baseline.md`](../../specs/frontend-api-state-component-boundary-convention-baseline.md)

## Source Structure Baseline
- `src/app/core/*`: app-wide infrastructure (for example auth services/interceptors/types)
- `src/app/layout/*`: shell/layout components
- `src/app/features/*`: routed/user-facing features
- keep root app bootstrap/wiring files in `src/app/` (`app.ts`, `app.config.ts`, `app.routes.ts`)
