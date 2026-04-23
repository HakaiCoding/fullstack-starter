# Full-Stack Starter Implementation Baseline

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
- required_tests:
  - `API auth flow`: login, refresh, protected route
  - `Web auth interceptor`: single refresh + request retry
