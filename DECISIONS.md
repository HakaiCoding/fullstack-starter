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
## YYYY-MM-DD - Decision title
Status:
Context:
Decision:
Alternatives considered:
Consequences:
Related docs/specs:
```

## 2026-04-24 - Enforce Nx module boundaries with project tags
Status: Accepted
Context: The workspace contains multiple apps and shared libraries that must remain decoupled.
Decision: Use `@nx/enforce-module-boundaries` constraints for `type:*` and `scope:*` tags as the enforced dependency model.
Alternatives considered: Unrestricted imports; convention-only boundaries.
Consequences: Architectural drift is reduced; some cross-module shortcuts are blocked and require explicit shared-library design.
Related docs/specs: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`eslint.config.mjs`](./eslint.config.mjs)

## 2026-04-24 - Use JWT access tokens with rotating refresh sessions
Status: Accepted
Context: Auth baseline requires short-lived access tokens plus revocable session continuity.
Decision: Use JWT access tokens and refresh tokens stored as hashed session records with rotation and single-session replacement behavior. Frontend baseline uses access-token storage in memory only, refresh-token storage in `HttpOnly` cookie, and one refresh attempt followed by one retry of the original request.
Alternatives considered: Stateless long-lived JWT only; server session-only auth.
Consequences: Better revocation/session control; additional session persistence and refresh flow complexity.
Related docs/specs: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`specs/role-persistence-jwt-claim-rbac-baseline.md`](./specs/role-persistence-jwt-claim-rbac-baseline.md)

## 2026-04-24 - Use migration-driven schema changes (no auto sync)
Status: Accepted
Context: Database evolution should be reviewable and reproducible.
Decision: Apply schema changes via TypeORM migrations only and keep schema auto-sync disabled.
Alternatives considered: Runtime schema sync; manual out-of-band SQL changes only.
Consequences: Stronger change traceability; migration maintenance is required for every schema change.
Related docs/specs: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`docs/commands-reference.md`](./docs/commands-reference.md)

## 2026-04-24 - Establish AI contract workflow for core changes
Status: Accepted
Context: AI sessions can over-optimize local fixes and place logic in the wrong layer without explicit workflow constraints.
Decision: Use [`AI_CONTRACT.md`](./AI_CONTRACT.md) as the required session workflow and completion checklist for AI-assisted coding.
Alternatives considered: Keep guidance only in ad hoc chat prompts; rely on reviewer discretion only.
Consequences: More predictable AI sessions and clearer review criteria; requires ongoing discipline until automated enforcement exists.
Related docs/specs: [`AI_CONTRACT.md`](./AI_CONTRACT.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## 2026-04-24 - Require feature specs for core changes
Status: Accepted
Context: Core-domain changes need explicit problem/rule/edge-case/test constraints before implementation.
Decision: For core changes, create or update a feature spec using [`specs/_template.md`](./specs/_template.md) before coding.
Alternatives considered: Ticket-only descriptions; implementation-first approach.
Consequences: Better systemic correctness and traceability; adds a lightweight upfront documentation step.
Related docs/specs: [`specs/_template.md`](./specs/_template.md), [`AI_CONTRACT.md`](./AI_CONTRACT.md)

## 2026-04-24 - Use local skills as preferred technology-practice reference for AI-assisted work
Status: Accepted
Context: AI-assisted sessions need current technology/tooling/workflow guidance and can drift when relying on generic model assumptions alone.
Decision: For technology-specific, framework-specific, library-specific, tooling-specific, security-sensitive, and workflow-specific tasks, AI sessions are expected to inspect and use relevant local skills in `C:\Users\Development\.agents\skills\` by default. Canonical project artifacts/specs/decisions remain authoritative for repository-specific architecture, boundaries, and accepted policy.
Alternatives considered: Treat local skills as optional references; rely on generic model memory for best-practice guidance.
Consequences: Guidance quality should stay current with local skill updates; conflicts with repository artifacts/specs/decisions must be surfaced explicitly and resolved using the safest project-compatible option; non-trivial implementation/planning outputs should report relevant skills inspected/used and any conflicts or tensions.
Related docs/specs: [`AI_CONTRACT.md`](./AI_CONTRACT.md), [`docs/README.md`](./docs/README.md), [`specs/_template.md`](./specs/_template.md), [`docs/commands-reference.md`](./docs/commands-reference.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## 2026-04-25 - Use `GET /api/v1/users` as first live RBAC route
Status: Accepted
Context: RBAC primitives (`Roles(...)` + `RolesGuard`) were implemented, but live route-level enforcement and end-to-end allow/deny assertions were still pending.
Decision: Adopt `GET /api/v1/users` as the first live RBAC-protected route with admin-only access and explicit behavior: unauthenticated requests return `401`, authenticated `user` role requests return `403`, and authenticated `admin` role requests return `200` with `{ users: UserListItem[] }` where each item contains only `id`, `email`, `displayName`, and `role`.
Alternatives considered: Protect health/readiness endpoints; defer route-level RBAC further; add fake/demo endpoints only to claim completion.
Consequences: RBAC is now exercised on a real API route with deterministic list ordering and payload-shaping constraints. Lifecycle note: pagination/sort query contracts and paginated envelope were later accepted and implemented (see `2026-04-29 - Define users-list pagination/sorting query and paginated envelope baseline` plus current repo code/tests); first narrow filtering support (`role` exact + `email` case-insensitive partial) was later accepted and implemented, while ownership logic and broader user-management scope remain explicitly deferred.
Related docs/specs: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`specs/first-meaningful-rbac-protected-route-decision.md`](./specs/first-meaningful-rbac-protected-route-decision.md), [`specs/role-persistence-jwt-claim-rbac-baseline.md`](./specs/role-persistence-jwt-claim-rbac-baseline.md)

## 2026-04-25 - Use Angular Material as the `apps/web` UI component library baseline
Status: Accepted
Context: The web app needed a standardized, maintained component library and theming baseline for consistent UI implementation.
Decision: Adopt Angular Material (`@angular/material`) with Angular CDK (`@angular/cdk`) as the default UI component library for `apps/web`, with Material theming configured in `apps/web/src/styles.scss` and animation providers configured in app bootstrap.
Alternatives considered: No shared UI component library; custom-only component implementations; postpone UI library standardization.
Consequences: Faster and more consistent UI development with established accessibility primitives; frontend implementation should prefer Material/CDK primitives unless there is a clear project-specific reason not to.
Related docs/specs: [`apps/web/README.md`](./apps/web/README.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## 2026-04-26 - Consolidate shared auth-user external contracts in `libs/shared/contracts`
Status: Accepted
Context: External auth/user API contract shapes were duplicated across API and web while `libs/shared/contracts` remained scaffold-only for this surface.
Decision: `libs/shared/contracts` is the accepted home for shared API/web external auth-user contract shapes in this consolidation scope. The first-pass shared set is exactly `AuthRole`, `AccessTokenResponse`, `LogoutResponse`, `AuthMeResponse`, `UserListItem`, and `UsersListResponse`. `LoginRequest` remains deferred for this first pass. API-internal, persistence/entity, guard/decorator/strategy, token-internal, request-user, and controller-validation internals remain excluded from shared contracts.
Alternatives considered: Keep duplicate app-local contract types; include deferred `LoginRequest` in the first pass; move API-internal or persistence-layer types into the shared contracts library.
Consequences: API and web now compile against a single shared external contract source for the approved set with unchanged runtime/API semantics; follow-up consolidations must remain boundary-safe and explicit about deferred/internal exclusions.
Related docs/specs: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`AI_CONTRACT.md`](./AI_CONTRACT.md), [`specs/auth-user-shared-contract-consolidation.md`](./specs/auth-user-shared-contract-consolidation.md)

## 2026-04-26 - Adopt baseline app folder conventions for web and api apps
Status: Accepted
Context: `apps/web/src/app` and `apps/api/src/app` had mixed placement of app-wide infrastructure, layout/system files, and feature modules, which reduced clarity for change placement and onboarding.
Decision: Adopt a simple default app-folder baseline:
- web: `apps/web/src/app/core/*` for app-wide infrastructure, `apps/web/src/app/layout/*` for shell/layout components, and `apps/web/src/app/features/*` for routed/user-facing features.
- api: `apps/api/src/app/config/*` for config, `apps/api/src/app/system/*` for root app system files, and `apps/api/src/app/features/*` for API feature modules.
- keep `apps/api/src/db/*` as the persistence boundary.
Alternatives considered: Keep flat/legacy placement under `app/*`; adopt deeper layered structures (`feature/data/ui/model` or similar) in this pass.
Consequences: Placement conventions are clearer and consistent across apps where useful, while preserving framework-specific boundaries; implementation requires path-only file moves and import updates without behavior changes.
Related docs/specs: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`specs/app-folder-convention-baseline-restructure.md`](./specs/app-folder-convention-baseline-restructure.md), [`apps/web/README.md`](./apps/web/README.md), [`apps/api/README.md`](./apps/api/README.md)

## 2026-04-27 - Adopt DTO/class-validator as backend structured request-validation baseline
Status: Accepted
Context: Auth invalid-input handling was manually validated in controller code and docs still described DTO/class-validator request validation as optional future hardening.
Decision: DTO/class-validator is the accepted backend baseline for structured HTTP request validation at the API transport layer (request body/query/params). DTOs are transport request-validation objects and do not replace TypeORM entities, DB constraints, guards, services, or domain/auth rules. DTOs should live near their owning API feature/module unless another convention is documented. This pass applies the baseline first to `POST /api/v1/auth/login` with an app-local login request DTO.
Alternatives considered: Keep manual controller validation per endpoint; defer DTO/class-validator baseline; roll out global ValidationPipe in this pass.
Consequences: Malformed semantic login payloads continue to return `400` and invalid credentials continue to return `401`, while framework-default error body details remained non-stable at the time of this decision. Future endpoints with structured request bodies/query params are expected to follow this baseline unless a spec documents an exception. Request contracts are not auto-promoted into `libs/shared/contracts`, and `LoginRequest` remains app-local in this pass. Covered baseline `400/401/403` body-envelope/code stability is later defined by `2026-04-29 - Stabilize baseline API error response envelope for current 400/401/403 auth-validation-rbac cases`.
Related docs/specs: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`specs/auth-invalid-input-auth-error-behavior-baseline.md`](./specs/auth-invalid-input-auth-error-behavior-baseline.md)

## 2026-04-27 - Define auth account and authorization baseline model
Status: Accepted
Context: Durable auth/account semantics were previously summarized in supplementary baseline docs and need canonical decision placement.
Decision: Use the following baseline account and authorization model: persisted authenticated roles are `admin` and `user`; unauthenticated requests/users are treated as a public visitor context (not a persisted role); request-time authorization trusts validated access-token role claim until token expiry; protected-route semantics remain `401` for unauthenticated requests and `403` for authenticated requests without the required role; live admin-only RBAC scope remains intentionally limited to `GET /api/v1/users` until expanded by explicit spec/decision.
Alternatives considered: Keep account model semantics only in supplementary baseline docs; expand immediately to a broader permissions matrix.
Consequences: Canonical source-of-truth for account/authorization semantics no longer depends on supplementary baseline docs; broader authorization scope still requires explicit follow-up specs/decisions.
Related docs/specs: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`specs/role-persistence-jwt-claim-rbac-baseline.md`](./specs/role-persistence-jwt-claim-rbac-baseline.md), [`specs/first-meaningful-rbac-protected-route-decision.md`](./specs/first-meaningful-rbac-protected-route-decision.md)

## 2026-04-27 - Define refresh-cookie and CORS safety baseline
Status: Accepted
Context: Runtime cookie/CORS safety constraints were previously captured in supplementary baseline docs and need canonical decision placement.
Decision: Adopt the following baseline transport-safety posture: refresh cookie uses `HttpOnly=true`, `path=/`, and `sameSite=Lax`; runtime must enforce `AUTH_REFRESH_COOKIE_SECURE=true` in production and when `AUTH_REFRESH_COOKIE_SAME_SITE=none`; CORS uses explicit allowlisted origins from `API_CORS_ALLOWED_ORIGINS` with credentials enabled, while requests without `Origin` remain allowed.
Alternatives considered: Leave cookie/CORS constraints as implementation-only details; require stricter defaults immediately without preserving current accepted baseline.
Consequences: Canonical source-of-truth for accepted cookie/CORS safety constraints is preserved without supplementary baseline docs; stricter hardening options remain explicit future scope.
Related docs/specs: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`specs/auth-invalid-input-auth-error-behavior-baseline.md`](./specs/auth-invalid-input-auth-error-behavior-baseline.md), [`specs/global-validationpipe-rollout-decision.md`](./specs/global-validationpipe-rollout-decision.md)

## 2026-04-27 - Add AI_SKILLS.md as canonical local Skills workflow artifact
Status: Accepted
Context: Local Skills policy/reporting and inventory handling were spread across multiple artifacts, making discovery and consistent application harder in AI-assisted sessions.
Decision: Adopt [`AI_SKILLS.md`](./AI_SKILLS.md) as the canonical artifact for local Skills usage policy (inspection, use, reporting, inventory, and conflict handling). Local Skills remain subordinate to accepted project artifacts/specs/decisions for repo-specific authority.
Alternatives considered: Keep local Skills policy only in [`AI_CONTRACT.md`](./AI_CONTRACT.md) and distributed references across docs/specs.
Consequences: Skills workflow expectations are easier to discover and apply consistently; cross-doc references should point to `AI_SKILLS.md` instead of duplicating long policy text; accepted project artifacts/specs/decisions remain the authority for architecture, behavior, commands, gates, and scope.
Related docs/specs: [`AI_SKILLS.md`](./AI_SKILLS.md), [`AI_CONTRACT.md`](./AI_CONTRACT.md), [`docs/README.md`](./docs/README.md), [`projectmap.md`](./projectmap.md), [`specs/_template.md`](./specs/_template.md), [`docs/commands-reference.md`](./docs/commands-reference.md)

## 2026-04-28 - Accept global ValidationPipe rollout policy profile
Status: Accepted
Context: DTO/class-validator transport validation baseline is accepted and the global ValidationPipe profile was accepted, but runtime validation had previously remained route-local on login. A follow-up implementation slice completed runtime activation in API bootstrap.
Decision: Accept the global ValidationPipe rollout target profile:
- `transform: true`
- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transformOptions.enableImplicitConversion: true`
Activate this profile globally in API bootstrap. Keep the DTO-bound unknown-field contract that extra unknown fields return `400`, keep framework-default error-body details non-stable unless separately accepted, and keep malformed JSON parser-layer behavior out of this decision scope. Covered baseline `400/401/403` body-envelope/code stability is later defined by `2026-04-29 - Stabilize baseline API error response envelope for current 400/401/403 auth-validation-rbac cases`.
Alternatives considered: Keep route-local validation only; defer strict unknown-field policy; accept transform-only profile first.
Consequences: Global DTO/class-validator transport validation is now active for DTO-bound request surfaces under the accepted profile. Accepted auth/RBAC status behavior remains preserved (`400` malformed semantic login payload, `401` invalid credentials, `401/403` protected-route semantics), unknown-field rejection is covered, routes without DTO-bound inputs are not automatically validated, and DTO-specific numeric/boolean implicit-conversion tests remain required when such fields are introduced.
Related docs/specs: [`specs/global-validationpipe-rollout-decision.md`](./specs/global-validationpipe-rollout-decision.md), [`specs/auth-invalid-input-auth-error-behavior-baseline.md`](./specs/auth-invalid-input-auth-error-behavior-baseline.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`docs/commands-reference.md`](./docs/commands-reference.md)

## 2026-04-28 - Stabilize malformed syntactic login JSON status contract
Status: Accepted
Context: Accepted auth invalid-input behavior covered malformed semantic payloads (`400`) and invalid credentials (`401`), but malformed syntactic JSON for `POST /api/v1/auth/login` had remained unresolved and untested as a contract.
Decision: Accept malformed syntactic JSON sent to `POST /api/v1/auth/login` as stable status-level behavior returning `400`. Keep malformed semantic login payloads at stable `400` and invalid credentials at stable `401`. Do not stabilize malformed-JSON response-body fields/messages in this decision; framework/default body details remained non-stable here unless explicitly accepted later.
Alternatives considered: Keep malformed syntactic JSON non-contract/framework-default; defer until a broader API/global error-contract policy decision.
Consequences: Auth login invalid-input/error behavior now has explicit status-level coverage for syntactic malformed JSON without promoting framework parser error body shape into stable API contract. ValidationPipe rollout policy scope remains unchanged. Covered baseline `400/401/403` body-envelope/code stability is later defined by `2026-04-29 - Stabilize baseline API error response envelope for current 400/401/403 auth-validation-rbac cases`.
Related docs/specs: [`specs/auth-invalid-input-auth-error-behavior-baseline.md`](./specs/auth-invalid-input-auth-error-behavior-baseline.md), [`specs/global-validationpipe-rollout-decision.md`](./specs/global-validationpipe-rollout-decision.md), [`docs/commands-reference.md`](./docs/commands-reference.md)

## 2026-04-28 - Treat global Material theme as styling authority for Material components
Status: Accepted
Context: Angular Material is already the accepted `apps/web` UI library baseline with a detailed global theme in `apps/web/src/styles.scss`. AI-assisted feature work can still drift into ad hoc local restyling of Material components without an explicit long-lived policy boundary.
Decision: For `apps/web`, Angular Material remains the default UI component library, and the global Material theme in `apps/web/src/styles.scss` is the baseline styling authority for Angular Material components. Feature/component work should use themed Material components by default. Do not add local Angular Material component styling, wrapper-specific overrides, deep selectors, or one-off visual patches just to restyle a Material component already covered by the global theme. If a local override is truly needed, it must be feature-specific, justified, documented near the change, and kept as narrow as possible. Do not modify the global theme or component styles during ordinary feature implementation unless the task explicitly requests a theming/design-system change. Generic Angular Material examples, Skill guidance, or AI suggestions are not approval to override this project theme policy.
Alternatives considered: Keep this as an informal convention only; allow local per-component Material restyling by default.
Consequences: Material styling decisions become more consistent and reviewable across sessions, with clearer guardrails against style drift and wrong-layer visual patches. Legitimate exceptions remain possible but must be explicit and narrowly scoped.
Related docs/specs: [`apps/web/README.md`](./apps/web/README.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`AI_SKILLS.md`](./AI_SKILLS.md)

## 2026-04-29 - Stabilize baseline API error response envelope for current 400/401/403 auth-validation-rbac cases
Status: Accepted
Context: Existing accepted auth/validation/RBAC docs stabilized status-code behavior for baseline error paths but left error response bodies intentionally non-stable and framework-default. That created contract drift risk for API clients and tests.
Decision: Introduce a stable public error envelope for covered baseline error cases:
- shape: `{ statusCode, error: { code, message, details? } }`
- covered statuses in this first slice: `400`, `401`, `403`
- stable first-slice codes:
  - `REQUEST_VALIDATION_FAILED`
  - `REQUEST_UNKNOWN_FIELD`
  - `REQUEST_MALFORMED_JSON`
  - `AUTH_UNAUTHENTICATED`
  - `AUTH_INVALID_CREDENTIALS`
  - `AUTH_INVALID_OR_EXPIRED_TOKEN`
  - `AUTH_FORBIDDEN`
Keep existing baseline status semantics unchanged and keep non-covered statuses/error families out of scope in this slice. Public error response types are part of shared external contracts, while API-internal exception/filter/validation implementation details remain app-local.
Alternatives considered: Continue framework-default/non-stable error bodies; stabilize only status-level behavior; defer malformed-JSON body normalization.
Consequences: Covered baseline API errors now have a deterministic response body contract without changing auth/session/RBAC semantics. Existing "non-stable body" assumptions for these covered baseline cases are superseded by this decision and its spec.
Related docs/specs: [`specs/stable-api-error-response-contract-baseline.md`](./specs/stable-api-error-response-contract-baseline.md), [`specs/auth-invalid-input-auth-error-behavior-baseline.md`](./specs/auth-invalid-input-auth-error-behavior-baseline.md), [`specs/global-validationpipe-rollout-decision.md`](./specs/global-validationpipe-rollout-decision.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## 2026-04-29 - Define users-list pagination/sorting query and paginated envelope baseline
Status: Accepted
Context: The accepted first live RBAC users-route baseline intentionally deferred pagination/filter/sort query contracts and paginated envelope metadata, leaving implementation sequencing blocked on unresolved API contract details.
Decision: For `GET /api/v1/users`, accept baseline query parameters `page`, `pageSize`, `sortBy`, and `sortDir` with defaults/bounds documented in the spec; keep filtering explicitly deferred in this baseline; preserve top-level `users` and add `pagination` metadata as the accepted success envelope; keep invalid query behavior aligned with existing stable `400` error envelope/code policy (`REQUEST_VALIDATION_FAILED`, `REQUEST_UNKNOWN_FIELD`) and keep existing `401`/`403` auth/RBAC semantics unchanged.
Alternatives considered: Keep pagination/sort/envelope behavior undocumented until implementation; expand immediately into filtering contract scope; replace `{ users: [...] }` with a fully new incompatible envelope shape.
Consequences: Contract scope is explicit and implemented in current repo code/tests across API transport (`ListUsersQueryDto`), users service pagination/sort behavior, shared external contracts, API e2e coverage, and web client query/envelope consumption. Lifecycle note: first narrow users-list filtering (`role` exact + `email` case-insensitive partial) is accepted and implemented in a follow-up slice, while broader filtering scope remains deferred. Auth/session behavior remains unchanged, and unresolved follow-up questions (future sort-key expansion and out-of-range-page policy) remain open.
Related docs/specs: [`specs/users-list-pagination-sort-paginated-envelope-baseline.md`](./specs/users-list-pagination-sort-paginated-envelope-baseline.md), [`specs/first-meaningful-rbac-protected-route-decision.md`](./specs/first-meaningful-rbac-protected-route-decision.md), [`specs/stable-api-error-response-contract-baseline.md`](./specs/stable-api-error-response-contract-baseline.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## 2026-04-29 - Accept first narrow users-list filtering baseline (`role` + `email`)
Status: Accepted
Context: Users-list pagination/sort/envelope behavior was accepted and implemented while filtering remained deferred. A narrow first filtering slice was approved to unblock practical querying without broadening users-management scope.
Decision: For `GET /api/v1/users`, accept flat optional query params `role` and `email` only. `role` must be an exact match against accepted role values (`admin | user`). `email` must be a non-empty string and is applied as a case-insensitive partial match. When multiple accepted filters are provided, combine them with logical AND. Preserve existing auth/RBAC behavior, pagination behavior, sorting behavior, deterministic tie-break behavior, and paginated success envelope behavior. Keep unknown query params rejected under existing unknown-field validation behavior, keep invalid/empty filter values mapped to existing stable validation error behavior, and do not add migration/index/schema work in this slice.
Alternatives considered: Defer filtering further; introduce broader field/operator filtering in first slice; add nested filter syntax; add schema/index work preemptively.
Consequences: API/users DTO and service behavior, shared users-list query contract typing, API e2e coverage, and web API-client query wiring now support the accepted narrow filtering baseline. Broader filtering scope (additional fields/operators/syntax) remains deferred to explicit follow-up spec/decision slices.
Related docs/specs: [`specs/users-list-filtering-baseline.md`](./specs/users-list-filtering-baseline.md), [`specs/users-list-pagination-sort-paginated-envelope-baseline.md`](./specs/users-list-pagination-sort-paginated-envelope-baseline.md), [`specs/first-meaningful-rbac-protected-route-decision.md`](./specs/first-meaningful-rbac-protected-route-decision.md), [`specs/stable-api-error-response-contract-baseline.md`](./specs/stable-api-error-response-contract-baseline.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## 2026-04-29 - Expand stable API error envelope coverage to 404, 409, and sanitized 500 fallback
Status: Accepted
Context: The accepted stable API error envelope contract covered baseline `400/401/403` cases, while `404`, `409`, and unexpected `500` responses were framework-default or non-contract, creating client drift and leakage risk.
Decision: Preserve the accepted envelope shape `{ statusCode, error: { code, message, details? } }` and existing `400/401/403` semantics, then extend stable coverage with three new codes: `RESOURCE_NOT_FOUND` (`404`), `RESOURCE_CONFLICT` (`409`), and `INTERNAL_SERVER_ERROR` (`500` fallback). Apply `404` and `409` mapping in the existing API normalizer/filter layer and add a sanitized `500` fallback for unhandled/unexpected server errors and `500` exceptions. Keep response sanitization strict for `500` (no stack traces, raw exception messages, SQL details, file paths, class names, or framework internals).
Alternatives considered: Keep `404/409/500` as framework-default response bodies; introduce a broad generic domain-error framework in this slice; add new product behavior purely to produce a real `409` endpoint conflict.
Consequences: Covered API error families now have deterministic envelope/code behavior across auth/validation/RBAC and route-level not-found paths plus server-error fallback, while existing baseline `400/401/403` behavior remains stable. Where no real current route-level product conflict source exists, `409` contract coverage is provided by focused normalizer tests without inventing new product endpoints.
Related docs/specs: [`specs/stable-api-error-response-contract-baseline.md`](./specs/stable-api-error-response-contract-baseline.md), [`specs/auth-invalid-input-auth-error-behavior-baseline.md`](./specs/auth-invalid-input-auth-error-behavior-baseline.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## 2026-04-29 - Accept API root/liveness/readiness baseline and stable 503 readiness-failure envelope
Status: Accepted
Context: API root and DB-readiness behavior existed as implementation details but lacked a clearly accepted stable baseline contract for reusable starter usage. Liveness endpoint behavior was missing, and DB-readiness `503` failure did not have stable envelope coverage.
Decision: Accept the following public contracts:
- `GET /api/v1` -> `{ name: "Fullstack Starter API", version: "v1", status: "ok" }`
- `GET /api/v1/health` -> `{ status: "ok", checks: { api: "ok" } }`
- `GET /api/v1/health/db` success -> `{ status: "ok", checks: { database: "ok" } }`
- `GET /api/v1/health/db` failure -> stable error envelope with `503` mapped to `{ statusCode: 503, error: { code: "SERVICE_UNAVAILABLE", message: "Service unavailable." } }`
Also preserve liveness/readiness separation: root and liveness endpoints do not perform DB checks; DB readiness check is isolated to `GET /api/v1/health/db`.
Alternatives considered: Keep legacy root payload (`{ message: "Hello API" }`); keep no dedicated liveness endpoint; keep readiness `503` body non-stable/framework-default; introduce dependency-specific readiness error codes.
Consequences: Starter baseline now has explicit, test-backed system endpoint contracts with minimal scope and stable `503` error-envelope coverage for readiness failure using existing normalizer/filter architecture.
Related docs/specs: [`specs/api-root-health-readiness-baseline.md`](./specs/api-root-health-readiness-baseline.md), [`specs/stable-api-error-response-contract-baseline.md`](./specs/stable-api-error-response-contract-baseline.md), [`apps/api/README.md`](./apps/api/README.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)
