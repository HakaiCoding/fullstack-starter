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

## Boundary Guidance
Before implementing web changes, read:
- [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)
- [`../../docs/AI_CONTRACT.md`](../../docs/AI_CONTRACT.md)

Placement reminders:
- UI/components handle rendering, interaction, and API call orchestration.
- Business/domain rules should not be implemented in UI components.
- Cross-app contracts should live in `libs/shared/contracts`.
