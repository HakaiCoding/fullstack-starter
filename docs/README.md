# Docs Index

Supplementary documentation index for this repository.

## Canonical Root Artifacts
- [`../AI_CONTRACT.md`](../AI_CONTRACT.md): AI-assisted workflow contract (tiers, spec triggers, completion checklist, skills policy/reporting).
- [`../projectmap.md`](../projectmap.md): concise project map.
- [`../ARCHITECTURE.md`](../ARCHITECTURE.md): architecture, ownership, and placement boundaries.
- [`../DECISIONS.md`](../DECISIONS.md): decision log and status lifecycle.
- [`../specs/`](../specs/): feature/change specs and [`../specs/_template.md`](../specs/_template.md).

## Supplementary Docs (This Folder)
- [`commands-reference.md`](./commands-reference.md): runnable command bundles and gate profiles.

## Workflow Docs Export Utility
- [`../Export-AiWorkflowDocs.ps1`](../Export-AiWorkflowDocs.ps1): exports shareable AI workflow docs zip, recursively including local linked markdown files while preserving repo-relative paths.
- run from repo root: `.\Export-AiWorkflowDocs.ps1` (optional: `-OutputPath .\ai-workflow-docs.zip`)

## Normal Read Order Before Coding
1. [`../AI_CONTRACT.md`](../AI_CONTRACT.md)
2. [`../projectmap.md`](../projectmap.md)
3. [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
4. [`../DECISIONS.md`](../DECISIONS.md)
5. [`commands-reference.md`](./commands-reference.md)
6. Relevant file(s) in [`../specs/`](../specs/)

## Scope Notes
- `docs/` is supplementary; canonical workflow/architecture/decision/spec authority lives in root artifacts and `specs/`.
- Use [`../AI_CONTRACT.md`](../AI_CONTRACT.md) for workflow obligations and spec-trigger criteria.
- Use [`../ARCHITECTURE.md`](../ARCHITECTURE.md) for architecture and placement boundaries.
- Use [`../DECISIONS.md`](../DECISIONS.md) for decision status and trade-off records.
- Use [`commands-reference.md`](./commands-reference.md) for commands and gate bundles.

## Pointer Policy
- Compatibility pointer files are not used by design.
- Use root canonical artifacts directly.
