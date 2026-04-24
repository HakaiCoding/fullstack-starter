# Docs

Documentation entry point for architecture, AI workflow constraints, decisions, specs, and execution gates.

## Canonical Docs
- [`ARCHITECTURE.md`](./ARCHITECTURE.md): system map, ownership boundaries, and change placement
- [`AI_CONTRACT.md`](./AI_CONTRACT.md): AI-assisted workflow rules (`Existing/enforced`, `Accepted policy`, `Proposed/manual`)
- [`commands-reference.md`](./commands-reference.md): command catalog and gate profiles
- [`auth-security-baseline.md`](./auth-security-baseline.md): auth/security invariants, status, and known gaps
- [`DECISIONS.md`](./DECISIONS.md): architectural/policy decision log
- [`specs/_template.md`](./specs/_template.md): template for core-change specs
- [`implementation-baseline.md`](./implementation-baseline.md): implementation/status reference for persistence/env/testing baseline

## Required Read Order Before Coding
1. [`ARCHITECTURE.md`](./ARCHITECTURE.md)
2. [`AI_CONTRACT.md`](./AI_CONTRACT.md)
3. [`commands-reference.md`](./commands-reference.md)
4. Domain-specific docs as needed (for example [`auth-security-baseline.md`](./auth-security-baseline.md))
5. For technology/tooling/workflow guidance, check relevant local skills in `C:\Users\Development\.agents\skills\` (reference material only; project docs remain authoritative).

## What Codex Should Read Before Core Changes
For core changes (domain/auth/persistence/cross-module behavior):
1. Read architecture + AI contract + command gates.
2. Create or update a spec using [`specs/_template.md`](./specs/_template.md).
3. Check existing decisions in [`DECISIONS.md`](./DECISIONS.md).

## When a Spec Is Required
Create/update a spec for:
- auth/session behavior changes
- persistence schema or data rule changes
- shared contracts changes affecting API and web
- cross-module business/domain rule changes
- architectural boundary changes

## When `DECISIONS.md` Must Be Updated
Add/update a decision when:
- architecture boundaries change
- a non-trivial policy/rule is introduced or replaced
- a meaningful alternative is rejected in favor of one long-lived approach

## Where Commands and Gates Live
All executable commands and gate profiles are in:
- [`commands-reference.md`](./commands-reference.md)

## Local AI Skills Reference
- Location: `C:\Users\Development\.agents\skills\`
- Use local skills as reference material for technology/tooling/workflow practices.
- Project docs remain authoritative for project-specific architecture, rules, and decisions.
- If local skills conflict with project docs, flag the conflict instead of silently choosing one.

## Authoritative Sources
- Architecture/placement authority: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- AI workflow/policy authority: [`AI_CONTRACT.md`](./AI_CONTRACT.md)
- Command/gate authority: [`commands-reference.md`](./commands-reference.md)
- Decision authority: [`DECISIONS.md`](./DECISIONS.md)
- Auth/security baseline authority: [`auth-security-baseline.md`](./auth-security-baseline.md)

## Source of Truth
- Dependency versions and npm scripts: [`../package.json`](../package.json) and [`../package-lock.json`](../package-lock.json).
- Nx project targets: project `project.json` files (for example `apps/*/project.json`, `libs/**/project.json`).
- Enforced module-boundary rules: [`../eslint.config.mjs`](../eslint.config.mjs).
- Human-readable commands and gate profiles: [`commands-reference.md`](./commands-reference.md).
- Architecture boundaries and project map: [`ARCHITECTURE.md`](./ARCHITECTURE.md).
- AI-assisted coding rules: [`AI_CONTRACT.md`](./AI_CONTRACT.md).
- Long-lived architecture/policy decisions: [`DECISIONS.md`](./DECISIONS.md).