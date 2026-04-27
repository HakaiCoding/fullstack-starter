# Feature Spec Template (Core Changes)

## Feature/Change Name
- name:

## Date
- yyyy-mm-dd:

## Status
- Proposed | In Progress | Accepted | Deprecated
- guidance:
  - accepted/deprecated specs may include concise lifecycle bullets (for example closure or superseded references).
  - avoid transient process notes tied to one cleanup/edit pass.

## Problem
- what is failing or missing today
- why this matters
- guidance:
  - keep this focused on the problem context and impact.
  - do not use this section as a broad repository-state dump.

## Non-Goals
- explicit things this change will not do

## Behavior Rules
- rule 1
- rule 2

## Forbidden Behavior
- shortcuts or patterns that must not be introduced

## Affected Domains/Modules
- domains:
- modules/files likely affected:

## Design Placement Summary
- where logic should live and why
- where logic should not live

## Relevant Local Skills
- policy authority: [`../AI_SKILLS.md`](../AI_SKILLS.md)
- skills inspected:
- skills used:
- why each skill is relevant:
- conflicts/tensions with project docs/spec:
- project-compatible decision:

## Edge Cases
- case 1
- case 2

## Risks
- risk 1 and mitigation
- risk 2 and mitigation

## Test Plan
- unit tests:
- integration/e2e tests:
- regression coverage:
- anti-hack coverage for behavior changes (general rule coverage, not only the shown example):
  - reject example-specific patches
  - reject hardcoded special cases when the real rule is broader
  - reject wrong-layer business-rule placement

## Required Gates
Use commands from [`../docs/commands-reference.md`](../docs/commands-reference.md).
- tiny/local gates (if applicable):
- normal implementation gates (if applicable):
- core gates:
- additional domain gates (if applicable):
- manual/proposed checks:

## Acceptance Checks
- observable outcomes that must be true before merge
- behavior tests prove the general rule, not only a single example
- no example-specific patches, hardcoded special cases, or wrong-layer business-rule placement introduced

## Documentation Updates Needed
- docs to update:
- guidance:
  - record durable documentation obligations or closure status.
  - avoid transient notes about a one-time cleanup/normalization pass.

## Decision Log Updates Needed
- whether [`../DECISIONS.md`](../DECISIONS.md) requires a new/updated entry
- guidance:
  - state clearly whether decision work is required, closed, or intentionally not needed.
  - if closed, reference the accepted decision entry.

