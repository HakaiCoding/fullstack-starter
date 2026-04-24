# Docs

Architecture and baseline references for the monorepo.

## Files

- [`foundation.md`](./foundation.md) - foundation contract, source-of-truth policy, synced stack snapshot, and boundary model
- [`auth-security-baseline.md`](./auth-security-baseline.md) - planned auth, authorization, cookie, and CORS baseline
- [`implementation-baseline.md`](./implementation-baseline.md) - current implementation baseline (implemented vs planned) for i18n, data/persistence, and testing
- [`commands-reference.md`](./commands-reference.md) - practical daily commands for Nx, npm scripts, Docker, Playwright, and TypeORM

## Boundary Model

- Boundary constraints are summarized in:
  - [`foundation.md`](./foundation.md)
- Runtime enforcement is defined in:
  - [`../eslint.config.mjs`](../eslint.config.mjs)

## Maintenance Rule

Use `package.json` and `package-lock.json` as authoritative version sources, and keep these docs synchronized to them.
