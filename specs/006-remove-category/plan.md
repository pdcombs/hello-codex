# Implementation Plan: Remove Category

**Branch**: `main` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-remove-category/spec.md`

## Summary

Add a host-only, idempotent category archival operation to existing category edit mode. The operation revalidates the event/category snapshot, refuses the last active category, atomically archives the category and all active entries assigned to it, promotes the oldest remaining category when necessary, records privacy-safe audits, and returns a hydrated active-event projection. A versioned migration adds explicit category lifecycle fields to all existing events. Archived categories remain stored but are excluded from every active read and category choice; their titles may be reused only by new category identities.

## Technical Context

**Language/Version**: JavaScript on Node.js 24.x; React 19 client

**Primary Dependencies**: GraphQL 16, MongoDB driver 7, Zod 4, React Router 7, Vite 8

**Storage**: MongoDB 8; embedded categories in `events`, standalone `eventEntries`, `idempotencyRecords`, and `auditEvents`

**Testing**: Vitest unit/component/contract suites, MongoDB replica-set integration tests, Playwright critical-flow E2E tests

**Target Platform**: Current mobile and desktop browsers; Node service on Render; MongoDB Atlas production cluster

**Project Type**: React web client with Node GraphQL service and MongoDB persistence

**Performance Goals**: Confirmation appears immediately; successful removal and refreshed active projections complete within two seconds for categories containing up to 5,000 active entries

**Constraints**: Host-only; at least one active category; atomic archival; no hard deletion; deterministic default promotion; archived-title reuse through new identity only; optimistic concurrency; idempotent retry; no titles/contact data in logs or audits; 80% repository line and branch coverage

**Scale/Scope**: One category per mutation, up to 100 categories per event and 5,000 active entries in the removed category; one schema migration; one additive GraphQL mutation; no new service, package, environment variable, or index

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **User value and scope**: PASS — host cleanup, destructive warning, permanent archival, final-category protection, and explicit exclusions are defined.
- **Identity and ownership**: PASS — server revalidates event-host ownership and never changes participant accounts or entry ownership history.
- **Contracts and boundaries**: PASS — additive GraphQL contract, explicit lifecycle migration, validation, transaction, stale-snapshot rejection, and hydrated response are documented.
- **Layered quality**: PASS — unit, contract, real replica-set integration, component/accessibility, E2E, migration, and compatibility coverage are planned.
- **Continuous delivery**: PASS — migration is forward-only/idempotent, old operations remain compatible, CI blocks failure, and production smoke/rollback are defined.
- **Observability**: PASS — safe operation metrics, archival audits, privacy constraints, alerts, and diagnostics are specified.
- **Operational simplicity**: PASS — existing React/GraphQL/MongoDB layers and transaction/idempotency facilities are reused; no new runtime dependency.

## Phase 0: Research Decisions

Research outcomes are recorded in [research.md](./research.md). No unresolved technical clarification remains.

## Phase 1: Design and Contracts

- [data-model.md](./data-model.md) defines category lifecycle, entry cascade, default promotion, migration, and state transitions.
- [contracts/schema-extension.graphql](./contracts/schema-extension.graphql) defines the additive removal operation.
- [contracts/persistence.md](./contracts/persistence.md) defines transaction, concurrency, idempotency, migration, and audit invariants.
- [quickstart.md](./quickstart.md) defines runnable validation across every required test layer.
- This Spec Kit installation has no agent-context update script; no generated agent context file changes.

## Project Structure

### Documentation (this feature)

```text
specs/006-remove-category/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── schema-extension.graphql
│   └── persistence.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
votiy-api/
├── src/
│   ├── api/graphql/event-resolvers.js
│   ├── domain/validation.js
│   ├── migrations/004-category-archival.js
│   ├── repositories/
│   │   ├── event-repository.js
│   │   ├── event-entry-repository.js
│   │   └── audit-event-repository.js
│   └── services/event-category-service.js
└── tests/{unit,contract,integration}/

votiy-web/
├── src/features/events/
│   ├── EventCategoryList.jsx
│   └── events.graphql.js
└── tests/component/

tests/e2e/
tests/smoke/
```

**Structure Decision**: Extend the existing category-management boundary. Category lifecycle remains embedded with the event; assigned entries retain their standalone authoritative records. Reuse current transaction/idempotency/audit infrastructure and active projection seams.

## Design Details

### Contract and compatibility

- Add `archiveEventCategory(input): EventResult!`; preserve category add/rename/batch-title edit, entry archive, Add Entry, participant, public event, and legacy operations.
- Input includes event/category IDs, expected event and category update timestamps, expected active-entry IDs/timestamps, and idempotency key.
- Full active-entry snapshot detects membership/title/archive changes after confirmation opens. Maximum 5,000 submitted entries matches current edit boundary.
- Success returns hydrated event containing active categories/entries only. The client replaces event state and exits edit mode.
- Safe errors distinguish validation, authentication, forbidden, not found, and conflict without exposing category membership or participant data.

### Category lifecycle migration

- Add category fields: `status`, `archiveReason`, `archivedAt`, and `archivedByAccountId`.
- Migration 004 idempotently sets all existing categories without `status` to `active` and nullable archive fields to null; it does not rewrite categories already migrated or archived.
- Update collection validation to require lifecycle fields on every category after migration; readiness remains false until migration and validator enforcement succeed.
- Active projections treat legacy missing status as active during the deployment compatibility window, then validator guarantees explicit status.

### Authorization, last-category guard, and default promotion

- In transaction, load event and verify actor owns it; locate an active input category and verify event/category timestamps.
- Require at least two active categories. The conditional event update independently asserts another active category exists, preventing concurrent removals from reaching zero.
- If removing default, choose the remaining active category with lowest `createdAt`, breaking ties by category ID; set it default in the same event update.
- Exactly one active category remains default after every successful operation. Archived category retains its former `isDefault` history but active projections ignore it.

### Atomic cascade and idempotency

- One MongoDB transaction conditionally archives the embedded category, promotes default if needed, archives all currently active assigned entries, writes category/entry audit events, and creates idempotency result.
- Entry archival sets status, reason `category_removed`, removal actor/time, and update time while preserving identity/owner/category/creation history.
- Verify entry matched/modified count equals validated active snapshot size; mismatch aborts everything.
- Same actor/event/operation/key and digest replays current hydrated event without duplicate writes/audits. Changed digest returns conflict.
- Archived category titles are excluded from active-title uniqueness checks; adding the same title creates a distinct category ID with no inherited entries/history.

### UI and accessibility

- Category edit form shows a destructive secondary action only to the host. With one active category it is disabled and accompanied by “Every event needs at least one category.”
- Removal opens an accessible confirmation dialog naming the category and stating all entries will be removed; include affected active-entry count when available.
- Confirm is destructive, prevents duplicate submission, and supports Escape/cancel/focus return. Failure retains edit state and announces a safe message.
- Success consumes hydrated event, removes the card immediately, and updates participant-derived views through existing active-entry projection behavior.

### Testing, delivery, and observability

- Unit: lifecycle validation, host denial, last-category guard, deterministic promotion, snapshot mismatch, no partial writes, retry/conflict, title reuse, and privacy-safe telemetry.
- Contract: additive schema, migration/validator shape, conditional event/entry filters, archival metadata allowlist, and legacy operation compatibility.
- Integration: real replica-set populated/empty/default/non-default removal, rollback, concurrent final-category attempts, stale membership, replay, migration idempotency, and participant projection changes.
- Component/E2E: confirmation/cancel, final-category explanation, successful refresh, error recovery, keyboard/focus/mobile behavior, and unauthorized absence.
- Emit `event.category_archive` outcome/duration/entry-count/default-promoted/correlation only. Audit `event.category_archived` once plus `entry.archived` per newly archived entry, identifiers only.
- Alert on error rate above 5% for ten minutes, p95 above two seconds for ten minutes, any invariant breach, migration failure, or production smoke failure.
- Production smoke creates a dedicated temporary category and entry, archives the category, verifies category/participant disappearance and database-level audit availability, then leaves archived synthetic history intentionally.
- Roll back application commit without reversing migration or deleting archived history; schema additions and lifecycle fields remain compatible domain data.

## Post-Design Constitution Re-check

PASS. Design enforces least privilege and permanent history, preserves compatible contracts, makes cross-document removal atomic and idempotent, protects the final category under concurrency, and includes all mandated quality/delivery/observability layers. No exception requires complexity tracking.

## Complexity Tracking

No constitution violations.
