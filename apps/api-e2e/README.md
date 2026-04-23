# API E2E (`apps/api-e2e`)

End-to-end tests for the NestJS API using Jest.

## Scope

- Verifies runtime behavior through HTTP requests
- Currently covers `GET /api/v1`

## Nx Target

```sh
npx nx e2e api-e2e
```

## Notes

- Target depends on `api:build` and `api:serve`.
- Test setup configures Axios base URL from `HOST` and `PORT`.
