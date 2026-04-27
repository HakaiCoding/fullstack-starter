# Shared Utils (`libs/shared/utils`)

Shared pure utility functions used across apps and libraries.

## Public Import Path
```ts
import { utils } from '@fullstack-starter/utils';
```

## Responsibility
- Hold small, reusable, framework-agnostic helpers.
- Keep functions deterministic and easy to unit test.
- Do not treat this library as a home for domain/business rules.

## Nx Targets
```sh
npx nx build utils
npx nx test utils
npx nx lint utils
```

## Boundaries
- Project tags: `type:util`, `scope:shared`
- Allowed dependency direction: `type:util` -> `type:util`
- Allowed scope direction: `scope:shared` -> `scope:shared`

For repository-wide AI and placement rules:
- [`../../../AI_CONTRACT.md`](../../../AI_CONTRACT.md)
- [`../../../ARCHITECTURE.md`](../../../ARCHITECTURE.md)
