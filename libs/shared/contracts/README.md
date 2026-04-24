# Shared Contracts (`libs/shared/contracts`)

Shared cross-app contracts and types.

## Public Import Path
```ts
import { contracts } from '@fullstack-starter/contracts';
```

## Responsibility
- Hold DTO-like shapes and API contract primitives shared by web and api.
- Avoid business logic and runtime side effects.

## Nx Targets
```sh
npx nx build contracts
npx nx test contracts
npx nx lint contracts
```

## Boundaries
- Project tags: `type:contracts`, `scope:shared`
- Allowed dependency direction: `type:contracts` -> `type:contracts`
- Allowed scope direction: `scope:shared` -> `scope:shared`

For repository-wide AI and placement rules:
- [`../../../docs/AI_CONTRACT.md`](../../../docs/AI_CONTRACT.md)
- [`../../../docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md)
