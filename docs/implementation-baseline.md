# Full-Stack Starter Implementation Baseline

## 0. Status
- `state`: `planned baseline`
- `implemented_in_code`: `partial` (as of `2026-04-24`)
- notes:
  - `i18n`: not implemented yet
  - `typeorm/postgresql`: not implemented yet
  - `e2e projects`: scaffolded and runnable with local prerequisites
  - `web-e2e prerequisite`: run `npx playwright install chromium` once before first `npx nx e2e web-e2e`

## 1. Internationalization (i18n)
- library: `Transloco`
- supported_languages:
  - `en`
  - `es`
- fallback_language: `en`
- scope: `UI translations only`

## 2. Data Conventions
- id_strategy: `UUID`
- schema_change_strategy: `TypeORM migrations only`
- schema_sync: `disabled (no auto schema sync)`

## 3. Testing Baseline
- scope: `bare minimum for starter`
- e2e_projects:
  - `apps/web-e2e`: `keep`
  - `apps/api-e2e`: `keep`
- web_e2e.default_browser: `chromium`
- required_tests:
  - `API auth flow`: login, refresh, protected route
  - `Web auth interceptor`: single refresh + request retry
