# Shared Utils (`libs/shared/utils`)

Shared pure utility functions used across apps and libraries.

## Public Import Path

```ts
import { utils } from '@fullstack-starter/utils';
```

## Responsibility

- Hold small, reusable, framework-agnostic helpers.
- Keep functions deterministic and easy to unit test.

## Nx Targets

```sh
npx nx build utils
npx nx test utils
npx nx lint utils
```

## Boundaries

- Project tags: `type:util`, `scope:shared`
- Allowed dependency direction: `type:util` -> `type:util`
