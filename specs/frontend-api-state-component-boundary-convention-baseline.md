# Feature Spec (Core Change)

## Feature/Change Name
- name: Frontend ApiService/StateService/component boundary convention baseline

## Date
- yyyy-mm-dd: 2026-04-30

## Status
- Accepted
- lifecycle note:
  - this convention is accepted as a docs-only architecture baseline.
  - adoption is phased; existing non-compliant source remains legacy/current state and is not immediate mandatory cleanup.
  - cleanup/refactor remains separate follow-up scope requiring explicit approval.

## Problem
- accepted docs already prohibit durable business/domain rules in UI components, but a detailed frontend convention for HTTP transport ownership, backend-derived state ownership, and component/service boundaries was not previously accepted.
- source currently shows mixed patterns in `apps/web/src/app/core/auth/*` (for example direct `AuthApiService` use by boundary components and `AuthApiService` state mutation paths), which increases review ambiguity.
- an accepted convention is needed to improve consistency while preserving the existing accepted auth/session and authorization baselines.

## Non-Goals
- no runtime behavior changes in this docs-only acceptance pass.
- no refactor or cleanup implementation in this pass.
- no auth/session semantic changes.
- no API contract/status behavior changes.
- no RBAC scope expansion, role additions, or frontend durable authorization policy rollout.
- no localStorage/sessionStorage token-storage change.
- no immediate full-repo frontend cleanup.
- no mandatory static/lint enforcement rollout in this baseline.

## Behavior Rules
- accepted convention rule 1 (`*ApiService`):
  - owns HTTP/backend endpoint calls and transport mapping.
  - should not own durable backend-derived UI/application state.
  - should not mutate `*StateService` state except through an explicitly documented exception.
- accepted convention rule 2 (`*StateService`):
  - owns backend-derived state/resources, loading/error state, derived readonly values, and app-facing methods.
  - may call `*ApiService` internally.
  - should expose readonly state/signals/resources to consumers where practical.
- accepted convention rule 3 (boundary/smart components):
  - route/page/shell/feature-boundary components may inject `*StateService`.
  - consume readonly state/signals/resources and call public `*StateService` methods.
- accepted convention rule 4 (presentational/reusable child components):
  - should prefer `input()/output()`.
  - should receive data through `input()` and emit user intent through `output()`.
  - should not inject `*ApiService`.
  - should not inject `*StateService` unless an explicit documented exception is approved.
- accepted convention rule 5 (local UI state):
  - purely visual, temporary, non-shared UI state may remain component-local.

## Existing Accepted Constraints Preserved
- keep existing accepted rule that UI/components must not contain durable business/domain rules (see `AI_CONTRACT.md` and `ARCHITECTURE.md`).
- keep existing accepted rule that durable authorization policy remains outside frontend UI (see RBAC/auth specs and decisions).
- keep accepted auth/session baseline unchanged:
  - access token storage in memory only.
  - refresh token in `HttpOnly` cookie.
  - one refresh attempt + one retry behavior remains unchanged.
- do not store access tokens in `localStorage` or `sessionStorage`.
- local Skills can support this direction but do not define project policy unless adopted by accepted project docs/decisions.

## Forbidden Behavior
- interpreting this accepted convention as immediate mandatory full-repo cleanup.
- claiming this docs-only acceptance pass performs implementation cleanup.
- moving durable business/domain/authorization policy into UI components.
- changing auth/session/runtime behavior while applying this convention later.
- converting Skill guidance into accepted project policy without explicit project-doc adoption.
- introducing silent exceptions not documented with rationale/scope.

## Affected Domains/Modules
- domains:
  - frontend architecture and layering convention for web app code.
  - frontend auth/client-state placement consistency.
- modules/files likely affected by later approved cleanup (not this pass):
  - `apps/web/src/app/core/auth/auth-api.service.ts`
  - `apps/web/src/app/core/auth/auth-state.service.ts`
  - `apps/web/src/app/core/auth/auth-refresh.service.ts`
  - `apps/web/src/app/features/auth/login/login.page.ts`
  - `apps/web/src/app/layout/user-menu/user-menu.component.ts`
  - related web tests/specs under `apps/web/src/app/**/*.spec.ts`
- modules/files affected in this acceptance pass:
  - this spec file
  - `DECISIONS.md`
  - `apps/web/README.md`
  - `ARCHITECTURE.md`

## Legacy/Current-Source Status at Acceptance
- observed partial alignment:
  - `AuthStateService` already uses private writable signal + readonly exposure (`asReadonly`, `computed`).
- observed divergence from strict convention:
  - `AuthApiService` mutates auth state on login/logout success.
  - boundary components call `AuthApiService` directly.
  - backend-derived user state is partly owned in component-local signal state.
- accepted handling:
  - current source is not fully compliant and is treated as legacy/current-state evidence.
  - non-compliance is not an automatic violation requiring immediate cleanup.
  - cleanup/refactor remains separate follow-up work requiring explicit approval.

## Design Placement Summary
- where this accepted rule lives:
  - accepted durable policy record in `DECISIONS.md`.
  - detailed accepted spec in this file.
  - actionable frontend-local guidance in `apps/web/README.md`.
  - concise architectural consistency note in `ARCHITECTURE.md`.
- where this rule should not live:
  - do not elevate it into `AI_CONTRACT.md` as a non-negotiable AI workflow rule unless explicitly approved in a separate policy change.
  - do not rely on ad hoc code comments or review folklore as the only policy source.

## Provenance and Authority Boundaries
- accepted existing project rules remain authoritative for current behavior:
  - UI/components must not contain durable business/domain rules.
  - durable authorization policy remains outside frontend UI.
  - accepted auth/session baseline remains unchanged.
- this accepted spec defines frontend layering convention; it does not reclassify accepted auth/security behavior.
- local Skills guidance informs implementation direction but does not by itself define accepted repository policy.

## Relevant Local Skills
- policy authority: [`../AI_SKILLS.md`](../AI_SKILLS.md)
- skills inspected:
  - `angular-http`
  - `angular-signals`
  - `angular-di`
  - `angular-routing`
  - `angular-best-practices`
  - `jwt-security`
  - `nx-workspace-patterns`
- skills used:
  - `angular-http` (HTTP call placement and interceptor patterns)
  - `angular-signals` (private writable + readonly public state patterns)
  - `angular-di` (service DI/facade composition)
  - `angular-best-practices` (`input()/output()` and boundary guidance)
  - `jwt-security` (token storage/auth safety posture compatibility check)
  - `nx-workspace-patterns` (boundary/governance discipline context)
- conflicts/tensions with project docs/spec:
  - `angular-routing` can suggest frontend role-guard patterns; accepted project policy keeps durable authorization policy in API/domain scope.
  - `nx-workspace-patterns` can model API+state together; accepted project convention here is a stricter split with explicit exceptions.
  - `jwt-security` prefers asymmetric signing generally; accepted project auth baseline remains authoritative and unchanged.
- project-compatible decision:
  - accepted docs/specs/decisions remain authoritative; Skills are applied as guidance only.

## Phased Rollout (Accepted Baseline)
- phase 1 (`docs acceptance and forward-use baseline`):
  - use this convention for new frontend code and materially touched slices.
  - do not require immediate conversion of unrelated legacy files.
- phase 2 (`targeted cleanup slices, separately approved`):
  - perform bounded cleanup/refactor only after explicit approval.
  - each cleanup slice must preserve accepted auth/session and authorization constraints.
- phase 3 (`optional hardening, future scope`):
  - consider static/lint enforcement only after rollout stability and separate approval.
  - static/lint enforcement remains optional future work, not a baseline requirement.

## Exception Policy (Accepted Baseline)
- default expectation:
  - follow `ApiService` transport ownership + `StateService` backend-derived state ownership + boundary/presentational component split.
- exception criteria:
  - use exceptions only when strict split is materially awkward or creates higher infrastructure risk.
  - document rationale, scope boundaries, and affected collaborators/files.
  - keep exception minimal and local; do not generalize by default.
- documentation location:
  - feature/spec-level documentation is sufficient for local exceptions.
  - `DECISIONS.md` is required for durable cross-cutting, security-sensitive, or architecture-wide exceptions.
- safety constraints:
  - exceptions must not move durable domain/business/authorization policy into UI components.
  - exceptions must not change accepted auth/session baseline behavior.
  - exceptions must not introduce access-token storage in `localStorage` or `sessionStorage`.

## Auth Infrastructure Exception Note (Accepted Baseline)
- explicit candidate exception class:
  - auth refresh/interceptor/helper collaborators (for example refresh orchestration and request retry helpers) may be exception candidates.
- rationale:
  - these collaborators are infrastructure-adjacent and may not map cleanly to a strict `ApiService` vs `StateService` split.
- scope limits:
  - exception usage must preserve accepted auth/session semantics and security posture.
  - durable authorization policy remains outside frontend UI and outside ad hoc helper logic.

## Enforcement (Accepted Baseline)
- enforcement mode for this baseline:
  - review-based enforcement only (spec + PR review + reviewer judgment).
- baseline non-requirement:
  - no required static/lint enforcement in this baseline.
- optional future work:
  - static/lint rules may be evaluated in a later, separately approved follow-up.

## Edge Cases
- infra/auth transport helpers can blur strict API-vs-state boundaries and may require documented exceptions.
- tiny components that are both reusable and route-adjacent may need explicit classification.
- reactive resource usage (`resource()/httpResource()`) can blur API-vs-state layering if not consistently wrapped.

## Risks
- risk 1 and mitigation:
  - risk: over-strict interpretation could block pragmatic infrastructure patterns.
  - mitigation: explicit exception policy with rationale+scope requirements.
- risk 2 and mitigation:
  - risk: readers may assume current source is fully compliant.
  - mitigation: explicit legacy/current-state statement and separate cleanup scope.
- risk 3 and mitigation:
  - risk: accidental auth/session behavior drift during future cleanup.
  - mitigation: preserve accepted auth/session constraints and apply auth-relevant gates when cleanup is implemented.
- risk 4 and mitigation:
  - risk: conflict between Skills examples and project-specific authority.
  - mitigation: preserve authority order (`accepted docs/specs/decisions` > `Skills guidance`).

## Test Plan
- this docs-only acceptance pass:
  - no runtime tests required; no runtime behavior changes are made.
- later approved cleanup slices:
  - unit tests for service boundaries and readonly state exposure.
  - component tests for boundary/presentational contracts.
  - auth regression checks where auth wiring is touched.

## Required Gates
Use commands from [`../docs/commands-reference.md`](../docs/commands-reference.md).
- tiny/local gates (this pass):
  - docs-only change with no runtime impact; runtime gates may be skipped per section `8.1`.
- normal implementation gates (later approved cleanup slices):
  - apply section `8.2`.
- core gates (if later cleanup slices are classified `core`):
  - `npx nx run-many -t lint,test,build --all`
  - `npx nx e2e api-e2e` when auth/API contract behavior is impacted.
  - `npx nx e2e web-e2e` when web auth/routing/runtime behavior is impacted.
- additional domain gates (later approved cleanup slices):
  - apply auth/security and e2e overlays as applicable.
- manual/proposed checks:
  - verify accepted constraints remain unchanged.
  - verify enforcement remains review-based in this baseline.
  - verify static/lint enforcement remains optional future work only.

## Acceptance Checks
- status is `Accepted` and aligns with accepted decision-log documentation.
- accepted convention rules are explicit and actionable.
- phased rollout is explicit and does not require immediate full-repo cleanup.
- legacy/current-source handling is explicit and does not imply immediate mandatory cleanup.
- exception policy and auth infrastructure exception candidates are explicit with rationale/scope constraints.
- enforcement is explicitly review-based for this baseline.
- static/lint enforcement remains optional future work only.
- no implementation cleanup/refactor is performed in this pass.

## Documentation Updates Needed
- docs updated in this acceptance pass:
  - this spec status and policy text updated to accepted baseline.
  - `DECISIONS.md` updated with durable acceptance decision entry.
  - `apps/web/README.md` updated with actionable frontend guidance.
  - `ARCHITECTURE.md` updated with concise UI-layer consistency note.
- intentionally not updated:
  - `AI_CONTRACT.md` (no explicit approval to elevate this into non-negotiable AI workflow policy).

## Decision Log Updates Needed
- status: closed in this pass.
- accepted decision entry added in `DECISIONS.md` for this convention baseline.

## Remaining Open Questions
- none for this accepted baseline.
