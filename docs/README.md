# Docs

Architecture and baseline references for the monorepo.

## Files

- [`fullstack-starter-foundation-notes.md`](./fullstack-starter-foundation-notes.md) - high-level foundation summary and source-of-truth policy
- [`fullstack-starter-auth-security-baseline.md`](./fullstack-starter-auth-security-baseline.md) - auth, authorization, cookie, and CORS baseline
- [`fullstack-starter-implementation-baseline.md`](./fullstack-starter-implementation-baseline.md) - i18n, data conventions, and testing baseline
- [`fullstack-starter-scaffolding-reference.md`](./fullstack-starter-scaffolding-reference.md) - generation defaults and scaffold commands

## Boundary Model

- Boundary constraints are summarized in:
  - [`fullstack-starter-foundation-notes.md`](./fullstack-starter-foundation-notes.md)
- Runtime enforcement is defined in:
  - [`../eslint.config.mjs`](../eslint.config.mjs)

## Maintenance Rule

Use `package.json` and `package-lock.json` as authoritative version sources, and keep these docs synchronized to them.
