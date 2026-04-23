# Apps

Deployable applications and their end-to-end test projects.

## Projects

- [`api`](./api/README.md) - NestJS backend (`type:app`, `scope:api`)
- [`web`](./web/README.md) - Angular frontend (`type:app`, `scope:web`)
- [`api-e2e`](./api-e2e/README.md) - e2e tests for API
- [`web-e2e`](./web-e2e/README.md) - e2e tests for Web

## Useful Commands

```sh
# Start backend only
npx nx run api:serve

# Start frontend (also starts backend because of target dependency)
npx nx run web:serve

# Run all app-level e2e tests
npx nx run-many -t e2e -p api-e2e web-e2e
```
