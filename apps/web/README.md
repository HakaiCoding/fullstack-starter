# Web App (`apps/web`)

Angular frontend application.

## Runtime

- Local URL: `http://localhost:4200`
- API access: proxied from `/api` to `http://localhost:3000` via `proxy.conf.json`

## Nx Targets

```sh
npx nx run web:serve
npx nx run web:build
npx nx run web:test
npx nx run web:lint
```

## Notes

- `web:serve` is configured to depend on `api:serve`.
- Use shared contracts from `@fullstack-starter/contracts`.
- Use shared utilities from `@fullstack-starter/utils`.
