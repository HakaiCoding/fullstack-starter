# Shared Libs

Cross-application libraries used by both `apps/web` and `apps/api`.

## Projects

- [`contracts`](./contracts/README.md) - shared contracts and API-facing types
- [`utils`](./utils/README.md) - shared utility functions

## Boundaries

- `contracts` tag: `type:contracts`
- `utils` tag: `type:util`
- `apps/*` may depend on these libraries
