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
5. For technology/tooling/workflow guidance, inspect and use relevant local skills in `C:\Users\Development\.agents\skills\` by default (especially for core changes, auth/security work, framework usage, database/migration work, testing, and build/tooling work).
6. Keep project docs/specs/decisions authoritative for repository-specific architecture, boundaries, and accepted policies.

## Lightweight Workflow Tiers
- `tiny/local`: docs/copy/style or small isolated non-behavioral changes.
- `normal implementation`: bounded implementation changes within existing module boundaries.
- `core`: domain/auth/persistence/cross-module/security/business-rule changes.
- for `tiny/local` edits, use the minimal relevant doc subset needed to stay inside boundaries.
- By default, specs are not required for `tiny/local` or `normal implementation`.
- If a change matches the "When a Spec Is Required" criteria below, treat it as `core`.

## What Codex Should Read Before Core Changes
For core changes (domain/auth/persistence/cross-module/security/business-rule behavior):
1. Read architecture + AI contract + command gates.
2. Create or update a spec using [`specs/_template.md`](./specs/_template.md).
3. Check existing decisions in [`DECISIONS.md`](./DECISIONS.md).

## When a Spec Is Required
Create/update a spec for:
- auth/session behavior changes
- security-sensitive policy/rule changes
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
- Inspect and use relevant local skills by default for technology/tooling/workflow guidance.
- Local skills are the preferred reference source for current technology/framework/tooling best practices.
- For `normal implementation` and `core` work, report skills inspected/used and conflicts/tensions found.
- For `tiny/local` work, explicitly state when no relevant skill was needed.
- Project docs/specs/decisions remain authoritative for repository-specific architecture, boundaries, and accepted policies.
- If local skills conflict with project docs/specs/decisions, flag the conflict and choose the safest project-compatible option.

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
- No separate `projectmap.md` is currently required; [`ARCHITECTURE.md`](./ARCHITECTURE.md) serves that role in this repository.
- AI-assisted coding rules: [`AI_CONTRACT.md`](./AI_CONTRACT.md).
- Long-lived architecture/policy decisions: [`DECISIONS.md`](./DECISIONS.md).
