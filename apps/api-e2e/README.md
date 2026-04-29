# API E2E (`apps/api-e2e`)

End-to-end tests for the NestJS API using Jest.

## Scope

- Verifies runtime behavior through HTTP requests
- Currently covers baseline API root/liveness/readiness runtime checks, migration-backed schema checks, CORS behavior, stable error-envelope behavior on selected paths, and auth-flow behavior (`login`, `refresh`, `logout`, `auth/me`, session rotation/replacement, and role-change-on-refresh claim behavior)

## Nx Target

```sh
npx nx e2e api-e2e
```

## Notes

- Target depends on `api:build` and `api:serve`.
- Test setup configures Axios base URL from `HOST` and `PORT`.
