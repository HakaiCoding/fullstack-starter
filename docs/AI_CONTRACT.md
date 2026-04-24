# Full-Stack Starter AI Contract

## 1. Scope
Applies to all AI-assisted coding sessions in this repository.

This contract uses explicit status labels:
- `Existing/enforced`: already backed by code, config, or current implementation.
- `Accepted policy`: adopted project workflow, expected to be followed, but not necessarily CI-enforced.
- `Proposed/manual`: useful guidance not yet formally adopted or automated.

## 2. Existing/Enforced Rules (Current Repository Constraints)
- `Existing/enforced`: Respect Nx module boundaries enforced by ESLint (`@nx/enforce-module-boundaries`).
- `Existing/enforced`: `libs/shared/contracts` holds shared contract shapes and must avoid business logic/runtime side effects.
- `Existing/enforced`: `libs/shared/utils` holds deterministic reusable helpers.
- `Existing/enforced`: Database schema changes are migration-driven (TypeORM migrations, no auto schema sync).
- `Existing/enforced`: Auth/session baseline behavior is documented in [`auth-security-baseline.md`](./auth-security-baseline.md).

## 3. Accepted Policy Rules (AI Workflow)
- `Accepted policy`: No one-off hardcoded fixes for specific values.
- `Accepted policy`: UI/components must not contain business/domain rules.
- `Accepted policy`: Domain rules must not be hidden in controllers, interceptors, helpers, or unrelated utils.
- `Accepted policy`: A fix is incomplete if it only satisfies the shown example but not the general rule.
- `Accepted policy`: Architectural trade-offs must be documented in [`DECISIONS.md`](./DECISIONS.md).

## 4. Accepted Policy Forbidden Patterns
- `Accepted policy`: Value-specific patches (`if value == "x" then special-case`) when the real rule is domain metadata/logic.
- `Accepted policy`: Business rules implemented in web components, templates, or presentation-only files.
- `Accepted policy`: Controller/interceptor/helper code becoming the primary home of domain policy.
- `Accepted policy`: "Pass this test case only" behavior that does not generalize across equivalent inputs.
- `Accepted policy`: Merging architecture/rule changes without spec/decision updates.

## 5. Required Workflow (Accepted Policy)
1. Classify the change:
- `Accepted policy`: `local` (small isolated change) vs `core` (domain/auth/persistence/cross-module behavior).

2. Read relevant docs before editing:
- `Accepted policy`: Always read [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`commands-reference.md`](./commands-reference.md).
- `Accepted policy`: Also read domain docs (for example [`auth-security-baseline.md`](./auth-security-baseline.md)) when applicable.

3. For `core` changes, create or update a spec first:
- `Accepted policy`: Use [`specs/_template.md`](./specs/_template.md).

4. Perform a design/placement pass before implementation:
- `Accepted policy`: Identify target modules/files and justify why each is the right layer.

5. Implement in small ordered slices:
- `Accepted policy`: domain/data model -> service/business logic -> transport/UI wiring -> tests -> docs.

6. Update docs when rules/architecture change:
- `Accepted policy`: Update architecture/spec/decision docs as needed.

## 6. Completion Checklist (Accepted Policy)
- `Accepted policy`: Explain which files changed.
- `Accepted policy`: Explain why each changed file was the correct layer.
- `Accepted policy`: Run and report relevant gates from [`commands-reference.md`](./commands-reference.md).
- `Accepted policy`: Explicitly state any gates not run.
- `Accepted policy`: State docs/spec/decision updates completed or still required.

## 7. Local Skills Reference Guidance
- `Accepted policy`: For technology-specific, framework-specific, library-specific, tooling-specific, security-sensitive, or workflow-specific tasks, inspect and use relevant local skills in `C:\Users\Development\.agents\skills\` by default.
- `Accepted policy`: Local skills are the preferred reference source for current technology/tooling/framework best practices.
- `Accepted policy`: Project docs, approved specs, and [`DECISIONS.md`](./DECISIONS.md) remain authoritative for repository-specific architecture, boundaries, and accepted policy.
- `Accepted policy`: Generic model knowledge must not override relevant local skills.
- `Accepted policy`: If no relevant local skill exists, explicitly say so.
- `Accepted policy`: If a relevant local skill is intentionally not used, explicitly explain why.
- `Accepted policy`: For implementation tasks, report which skills were inspected, which were used, and any conflicts/tensions found.
- `Accepted policy`: If local skill guidance conflicts with project docs/specs/decisions, flag the conflict and follow the safest project-compatible option.
- `Accepted policy`: Do not copy large skill contents into project docs; summarize only what is needed.
