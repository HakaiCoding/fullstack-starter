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

## 2026-04-24 — Use local skills as preferred technology-practice reference for AI-assisted work
Status: Accepted
Context: AI-assisted sessions need current technology/tooling/workflow guidance and can drift when relying on generic model assumptions alone.
Decision: For technology-specific, framework-specific, library-specific, tooling-specific, security-sensitive, and workflow-specific tasks, AI sessions are expected to inspect and use relevant local skills in `C:\Users\Development\.agents\skills\` by default. Project docs/specs/decisions remain authoritative for repository-specific architecture, boundaries, and accepted policy.
Alternatives considered: Treat local skills as optional references; rely on generic model memory for best-practice guidance.
Consequences: Guidance quality should stay current with local skill updates; conflicts with repository docs/specs/decisions must be surfaced explicitly and resolved using the safest project-compatible option; non-trivial implementation/planning outputs should report relevant skills inspected/used and any conflicts or tensions.
Related docs/specs: [`AI_CONTRACT.md`](./AI_CONTRACT.md), [`README.md`](./README.md), [`specs/_template.md`](./specs/_template.md), [`commands-reference.md`](./commands-reference.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## 2026-04-25 - Use `GET /api/v1/users` as first live RBAC route
Status: Accepted
Context: RBAC primitives (`Roles(...)` + `RolesGuard`) were implemented, but live route-level enforcement and end-to-end allow/deny assertions were still pending.
Decision: Adopt `GET /api/v1/users` as the first live RBAC-protected route with admin-only access and explicit behavior: unauthenticated requests return `401`, authenticated `user` role requests return `403`, and authenticated `admin` role requests return `200` with `{ users: UserListItem[] }` where each item contains only `id`, `email`, `displayName`, and `role`.
Alternatives considered: Protect health/readiness endpoints; defer route-level RBAC further; add fake/demo endpoints only to claim completion.
Consequences: RBAC is now exercised on a real API route with deterministic list ordering and payload-shaping constraints, while ownership logic, pagination/filter/sort query contracts, and broader user-management scope remain explicitly deferred.
Related docs/specs: [`auth-security-baseline.md`](./auth-security-baseline.md), [`implementation-baseline.md`](./implementation-baseline.md), [`specs/first-meaningful-rbac-protected-route-decision.md`](./specs/first-meaningful-rbac-protected-route-decision.md), [`specs/role-persistence-jwt-claim-rbac-baseline.md`](./specs/role-persistence-jwt-claim-rbac-baseline.md)

## 2026-04-25 - Use Angular Material as the `apps/web` UI component library baseline
Status: Accepted
Context: The web app needed a standardized, maintained component library and theming baseline for consistent UI implementation.
Decision: Adopt Angular Material (`@angular/material`) with Angular CDK (`@angular/cdk`) as the default UI component library for `apps/web`, with Material theming configured in `apps/web/src/styles.scss` and animation providers configured in app bootstrap.
Alternatives considered: No shared UI component library; custom-only component implementations; postpone UI library standardization.
Consequences: Faster and more consistent UI development with established accessibility primitives; frontend implementation should prefer Material/CDK primitives unless there is a clear project-specific reason not to.
Related docs/specs: [`../apps/web/README.md`](../apps/web/README.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`implementation-baseline.md`](./implementation-baseline.md)
