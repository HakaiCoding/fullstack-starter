# Full-Stack Starter Decisions Log

## 1. When to Add a Decision
Add an entry when a change:
- affects architecture boundaries or ownership
- introduces or changes non-trivial project policy
- chooses one long-lived approach over meaningful alternatives
- deprecates or supersedes a previous decision

## 2. Status Labels
- `Proposed`: candidate, not yet adopted as project standard
- `Accepted`: adopted and expected to be followed
- `Superseded`: replaced by a newer accepted decision
- `Deprecated`: intentionally phased out without a direct replacement

## 3. Entry Format
Use this format for every entry:

```md
## YYYY-MM-DD — Decision title
Status:
Context:
Decision:
Alternatives considered:
Consequences:
Related docs/specs:
```

## 2026-04-24 — Enforce Nx module boundaries with project tags
Status: Accepted
Context: The workspace contains multiple apps and shared libraries that must remain decoupled.
Decision: Use `@nx/enforce-module-boundaries` constraints for `type:*` and `scope:*` tags as the enforced dependency model.
Alternatives considered: Unrestricted imports; convention-only boundaries.
Consequences: Architectural drift is reduced; some cross-module shortcuts are blocked and require explicit shared-library design.
Related docs/specs: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`../eslint.config.mjs`](../eslint.config.mjs)

## 2026-04-24 — Use JWT access tokens with rotating refresh sessions
Status: Accepted
Context: Auth baseline requires short-lived access tokens plus revocable session continuity.
Decision: Use JWT access tokens and refresh tokens stored as hashed session records with rotation and single-session replacement behavior.
Alternatives considered: Stateless long-lived JWT only; server session-only auth.
Consequences: Better revocation/session control; additional session persistence and refresh flow complexity.
Related docs/specs: [`auth-security-baseline.md`](./auth-security-baseline.md)

## 2026-04-24 — Use migration-driven schema changes (no auto sync)
Status: Accepted
Context: Database evolution should be reviewable and reproducible.
Decision: Apply schema changes via TypeORM migrations only and keep schema auto-sync disabled.
Alternatives considered: Runtime schema sync; manual out-of-band SQL changes only.
Consequences: Stronger change traceability; migration maintenance is required for every schema change.
Related docs/specs: [`implementation-baseline.md`](./implementation-baseline.md), [`commands-reference.md`](./commands-reference.md)

## 2026-04-24 — Establish AI contract workflow for core changes
Status: Accepted
Context: AI sessions can over-optimize local fixes and place logic in the wrong layer without explicit workflow constraints.
Decision: Use [`AI_CONTRACT.md`](./AI_CONTRACT.md) as the required session workflow and completion checklist for AI-assisted coding.
Alternatives considered: Keep guidance only in ad hoc chat prompts; rely on reviewer discretion only.
Consequences: More predictable AI sessions and clearer review criteria; requires ongoing discipline until automated enforcement exists.
Related docs/specs: [`AI_CONTRACT.md`](./AI_CONTRACT.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## 2026-04-24 — Require feature specs for core changes
Status: Accepted
Context: Core-domain changes need explicit problem/rule/edge-case/test constraints before implementation.
Decision: For core changes, create or update a feature spec using [`specs/_template.md`](./specs/_template.md) before coding.
Alternatives considered: Ticket-only descriptions; implementation-first approach.
Consequences: Better systemic correctness and traceability; adds a lightweight upfront documentation step.
Related docs/specs: [`specs/_template.md`](./specs/_template.md), [`AI_CONTRACT.md`](./AI_CONTRACT.md)