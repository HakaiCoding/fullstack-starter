# Local Skills Workflow Policy

## 1. Purpose and Status
- `AI_SKILLS.md` is a canonical project workflow artifact for local Skills usage policy.
- It defines how AI sessions should inspect, use, report, inventory, and resolve conflicts involving local Skills.
- It governs local/user Skills usage policy for this project workflow.
- Environment-specific system/runtime Skills are not part of this project's documented local Skills inventory.
- It does not replace or override:
  - [`AI_CONTRACT.md`](./AI_CONTRACT.md)
  - [`ARCHITECTURE.md`](./ARCHITECTURE.md)
  - [`DECISIONS.md`](./DECISIONS.md)
  - [`projectmap.md`](./projectmap.md)
  - accepted specs in [`specs/`](./specs/)
  - [`docs/commands-reference.md`](./docs/commands-reference.md)

## 2. What Local Skills Are For
- Relevant local Skills are preferred guidance for current technology, framework, tooling, workflow, and security practices.
- Generic model knowledge must not override relevant local Skills when a relevant Skill exists.
- Local Skills are guidance/reference material, not automatic project requirements.
- Local Skills do not automatically approve unresolved or proposed project behavior.

## 3. Authority Boundaries
- Accepted project artifacts, accepted specs, and accepted decisions remain authoritative for repo-specific rules, architecture boundaries, approved behavior, commands, gates, and implementation scope.
- Local Skills must not be used to silently override accepted project decisions.
- Local Skills must not be used to implement unresolved or proposed policy as though it were accepted.
- If a Skill conflicts with project docs/specs/decisions, Codex must report the conflict and follow the safest project-compatible path.
- If the conflict affects scope, architecture, security, persistence, or irreversible behavior, Codex must avoid irreversible changes until the conflict is clarified.

## 4. When Skills Must Be Checked
- For normal implementation and core changes, Codex must inspect relevant local Skills when the task involves technology, framework, tooling, security, workflow, or implementation practices covered by Skills.
- For tiny/local changes, Skills may be unnecessary; if so, Codex should report that no relevant Skill was needed.
- For core changes or spec-triggering changes, relevant Skills should be reflected in the design/spec workflow where applicable.
- Codex must not use stale chat memory as a substitute for inspecting relevant current docs/specs/code and Skills.

## 5. Reporting Requirements
Codex should report:
- which relevant Skills were inspected
- which Skills were used
- whether no relevant Skill was found
- whether a relevant Skill existed but was intentionally not used, and why
- any conflict or tension between Skills and project docs/specs/decisions
- whether the Skills inventory was verified during the current session when that matters to the task

## 6. Copying and Summarizing Rule
- Do not copy whole Skill contents into project docs/specs.
- Summarize only the task-relevant Skill guidance needed for traceability.
- Do not paste large Skill sections into specs, decisions, or workflow docs.
- If a Skill changes later, Codex must rely on the current Skill content, not an old summary.

## 7. Missing or Unresolved Guidance
"Inspect the relevant docs/spec/code. If the requirement is already documented, follow it. If it is not documented, report the gap and either propose a minimal safe option for approval or update the spec only if the project workflow allows that. Do not implement the unresolved detail as though it were already decided."

## 8. Available Local Skills Inventory
Available Local Skills Inventory

This inventory helps AI sessions discover relevant local Skills quickly. It is a discovery aid, not a substitute for inspecting the current Skills directory. Before relying on a Skill, Codex must verify that the Skill still exists and read the current Skill content.

- Documented local Skills root path in current project workflow docs: `C:\Users\Development\.agents\skills\`
- Verification date: `2026-04-27`
- Inventory authority note: this inventory is a discovery aid, not permanent technical authority, and does not make any Skill guidance automatically accepted project policy.
- Environment-specific system/runtime Skills (for example under `.codex` runtime/system directories) are excluded from this project local/user Skills inventory.
- If a Skills directory is inaccessible, do not invent Skills, paths, or scopes.
- If the intended local/user Skills directory is not accessible in the current session, report that live local/user inventory could not be verified rather than inventorying system/runtime Skills.
- If live inventory cannot be verified, include only documented paths/Skills and clearly mark them unverified for the current session.
- If no Skills path is documented and live directories are inaccessible, report that inventory cannot be created without inventing information.

| Skill name | Path | Apparent scope/purpose | Verification note |
| --- | --- | --- | --- |
| angular-best-practices | `C:\Users\Development\.agents\skills\angular-best-practices` | Modern Angular best practices for Angular apps. | Live directory and `SKILL.md` verified in session. |
| angular-best-practices-material | `C:\Users\Development\.agents\skills\angular-best-practices-material` | Angular Material and CDK best practices. | Live directory and `SKILL.md` verified in session. |
| angular-best-practices-transloco | `C:\Users\Development\.agents\skills\angular-best-practices-transloco` | Transloco i18n best practices for Angular. | Live directory and `SKILL.md` verified in session. |
| angular-component | `C:\Users\Development\.agents\skills\angular-component` | Angular standalone component implementation guidance. | Live directory and `SKILL.md` verified in session. |
| angular-di | `C:\Users\Development\.agents\skills\angular-di` | Angular DI patterns with `inject()` and tokens. | Live directory and `SKILL.md` verified in session. |
| angular-directives | `C:\Users\Development\.agents\skills\angular-directives` | Angular custom directive patterns. | Live directory and `SKILL.md` verified in session. |
| angular-forms | `C:\Users\Development\.agents\skills\angular-forms` | Angular signal-based forms guidance. | Live directory and `SKILL.md` verified in session. |
| angular-http | `C:\Users\Development\.agents\skills\angular-http` | Angular HTTP and resource/httpResource usage. | Live directory and `SKILL.md` verified in session. |
| angular-routing | `C:\Users\Development\.agents\skills\angular-routing` | Angular routing with lazy loading, guards, and resolvers. | Live directory and `SKILL.md` verified in session. |
| angular-signals | `C:\Users\Development\.agents\skills\angular-signals` | Angular signal-based state patterns. | Live directory and `SKILL.md` verified in session. |
| caveman-commit | `C:\Users\Development\.agents\skills\caveman-commit` | Ultra-compressed Conventional Commits message generation. | Live directory and `SKILL.md` verified in session. |
| docker-expert | `C:\Users\Development\.agents\skills\docker-expert` | Advanced Docker/containerization guidance. | Live directory and `SKILL.md` verified in session. |
| jwt-security | `C:\Users\Development\.agents\skills\jwt-security` | JWT authentication security best practices. | Live directory and `SKILL.md` verified in session. |
| nestjs-best-practices | `C:\Users\Development\.agents\skills\nestjs-best-practices` | NestJS architecture and implementation best practices. | Live directory and `SKILL.md` verified in session. |
| nx-workspace-patterns | `C:\Users\Development\.agents\skills\nx-workspace-patterns` | Nx workspace configuration and monorepo patterns. | Live directory and `SKILL.md` verified in session. |
| postgresql-best-practices | `C:\Users\Development\.agents\skills\postgresql-best-practices` | PostgreSQL schema/query/database development practices. | Live directory and `SKILL.md` verified in session. |
| postgresql-table-design | `C:\Users\Development\.agents\skills\postgresql-table-design` | PostgreSQL table/schema design guidance. | Live directory and `SKILL.md` verified in session. |
| typeorm | `C:\Users\Development\.agents\skills\typeorm` | TypeORM development guidance. | Live directory and `SKILL.md` verified in session. |
| typescript-advanced-types | `C:\Users\Development\.agents\skills\typescript-advanced-types` | Advanced TypeScript type-system patterns. | Live directory and `SKILL.md` verified in session. |
