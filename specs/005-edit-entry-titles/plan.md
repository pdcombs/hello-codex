# Implementation Plan: Edit Entry Titles

**Branch**: `main` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-edit-entry-titles/spec.md`

## Summary

Extend existing category edit form so every active entry title is a controlled, prefilled field. Replace category-only rename submission with one additive batch category-update operation that validates full category/entry snapshot, rechecks host authorization, and atomically applies category and changed entry titles in one idempotent transaction. Existing entry removal stays separate and compatible. Successful response returns hydrated event data for category and participant projection refresh.

## Technical Context

**Language/Version**: JavaScript on Node.js 24.x; React 19 client

**Primary Dependencies**: GraphQL 16, MongoDB driver 7, Zod 4, React Router 7, Vite 8

**Storage**: MongoDB 8; embedded categories in `events`, standalone `eventEntries`, `idempotencyRecords`, and `auditEvents`

**Testing**: Vitest unit/component/contract suites, MongoDB replica-set integration tests, Playwright critical-flow E2E tests

**Target Platform**: Current mobile and desktop browsers; Node service on Render; MongoDB Atlas production cluster

**Project Type**: Web application with React frontend and Node GraphQL backend

**Performance Goals**: Host sees saved category and entry titles within two seconds for categories containing up to 5,000 active entries; first-time host edits three titles in under 45 seconds

**Constraints**: Host-only authorization; 160-character entry-title and 120-character category-title limits; all-or-nothing title update; optimistic stale-snapshot rejection; idempotent retry; no title text in logs/audits; 80% repository line and branch coverage; no hard deletion or ownership/category changes

**Scale/Scope**: One category per mutation, up to 5,000 active entries in worst-case category, one existing edit surface, one additive GraphQL mutation, no new service/dependency/environment variable/migration

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **User value and scope**: PASS — event host, one-save title editing, measurable completion outcomes, and explicit exclusions are defined; deletion redesign removed from scope.
- **Identity and ownership**: PASS — server revalidates host ownership; entry owner/category/status remain immutable through this operation.
- **Contracts and boundaries**: PASS — controlled UI state, additive batch contract, validation, optimistic concurrency, transaction, hydrated response, and field errors are defined.
- **Layered quality**: PASS — unit decisions, schema/persistence contracts, replica-set transaction tests, component accessibility, and five critical UI flows are planned.
- **Continuous delivery**: PASS — current operations remain compatible; CI, exact-commit deploy, feature smoke, and rollback checks are specified.
- **Observability**: PASS — safe counts/durations/correlation, title-change audits without title text, SLI queries, alerts, and diagnostics are planned.
- **Operational simplicity**: PASS — existing React/GraphQL/MongoDB layers and transaction helper are reused; no package, service, environment, or migration added.

## Phase 0: Research Decisions

Research outcomes recorded in [research.md](./research.md). No unresolved technical clarification remains.

## Phase 1: Design and Contracts

- [data-model.md](./data-model.md) defines category-edit intent, entry-title changes, invariants, validation, and state transitions.
- [contracts/schema-extension.graphql](./contracts/schema-extension.graphql) defines additive category batch-update input and mutation.
- [contracts/persistence.md](./contracts/persistence.md) defines snapshot validation, transaction, idempotency, update, and audit invariants.
- [quickstart.md](./quickstart.md) defines runnable unit, contract, integration, component, E2E, observability, and deployment validation.
- Spec Kit installation has no agent-context update script; no generated agent context file changes.

## Project Structure

### Documentation (this feature)

```text
specs/005-edit-entry-titles/
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
│   ├── repositories/
│   │   ├── event-repository.js
│   │   ├── event-entry-repository.js
│   │   └── audit-event-repository.js
│   └── services/event-category-service.js
└── tests/
    ├── contract/
    ├── integration/
    └── unit/

votiy-web/
├── src/features/events/
│   ├── EventCategoryList.jsx
│   └── events.graphql.js
└── tests/component/

tests/e2e/
tests/smoke/
```

**Structure Decision**: Extend current category service/repositories and category edit component. Batch belongs to category-management boundary because category title and its entries form one host edit intent. Reuse transaction/idempotency infrastructure; keep standalone entry creation/archive operations unchanged.

## Design Details

### Contract and compatibility

- Add `updateEventCategory(input)` alongside `renameEventCategory`; do not remove or change current mutation, result unions, entry archive, Add Entry, event reads, or participant reads.
- Input includes event/category IDs, desired category title, category snapshot timestamp, full active-entry title snapshot, and idempotency key.
- Each entry item includes entry ID, desired title, and expected `updatedAt`. Full active snapshot detects an entry added, archived, moved, or edited after form load.
- Return existing `EventResult` with fully hydrated categories/entries. Stable `OperationError.fieldErrors` paths use `entryTitles.<index>.title` for entry fields and `title` for category title.
- New web client submits batch operation. Legacy clients retain category-only rename contract.

### Authorization, validation, and concurrency

- Validate shape, unique entry IDs, maximum 5,000 items, category/entry title rules, timestamps, and UUID before database work.
- In transaction, load event, verify viewer is owner, locate category, and require category `updatedAt` to match expected value.
- Load every active entry in event/category. Require exact ID set and matching `updatedAt` values against submitted snapshot. Any mismatch returns conflict and changes nothing.
- Archived or cross-event/category entry IDs return safe conflict/not-found behavior without exposing unrelated data.
- Compare normalized desired values with stored titles. Update only effective changes; unchanged entries retain `updatedAt` and create no audit.

### Atomic write and idempotency

- One MongoDB transaction revalidates snapshot, conditionally renames embedded category, updates changed `eventEntries`, and writes idempotency result.
- Event `updatedAt` advances once for any effective title change; category `updatedAt` advances only if category title changes. Changed entries receive one shared timestamp.
- Idempotency identity scopes actor + event + operation + key. Same digest replays hydrated event; changed digest returns conflict.
- Empty effective change returns current hydrated event without title-change audit. Idempotency still records completed intent so retry outcome is stable.
- Existing entry removal remains its own archive transaction and mutation. A removal concurrent with batch save changes active snapshot, causing safe batch conflict.

### UI and accessibility

- Category edit form owns controlled values keyed by category and entry IDs. Every active entry uses labelled text input prefilled from current title; owner remains read-only context.
- Existing Save submits category title plus full active-entry snapshot once. Cancel discards controlled edits. Save disables while pending.
- Client maps indexed field errors to exact entry input and keeps all typed values after validation/conflict/network failure.
- Success replaces event state from hydrated response and exits edit mode. Participant page reads updated titles through existing projection.
- Keyboard order follows category title, entry titles, delete actions, Cancel, Save. Errors are associated and announced. Mobile form remains scrollable without full-width action regressions.

### Persistence and audits

- Add repository method to list active entries by event/category within session and bulk-update title + `updatedAt` using entry/event/category/status/expected timestamp filters.
- Verify matched/modified counts equal intended changed-entry count; otherwise abort transaction.
- Extend category repository rename method for expected category timestamp and transaction options, or add batch-specific conditional rename method.
- Add `entry.title_changed` audit name. Append one audit per changed entry after committed transaction with actor/event/category/entry IDs, correlation ID, and no title values.
- Log `event.category_batch_update` with outcome, changed entry count, category-title-changed boolean, duration, and correlation ID only.

### Testing, delivery, and observability

- Unit: validation, unique IDs, field paths, normalization, no-op, host denial, category/entry mismatch, stale snapshots, changed-only writes, idempotency replay/conflict, and privacy-safe logging.
- Contract: additive schema, backward compatibility, 5,000-item bound, persistence filters, audit allowlist, and no title metadata.
- Integration: real replica-set atomic category + 1/3/many entry changes, rollback, stale add/archive/title races, no-op, replay, category isolation, preserved identity/ownership/status/timestamps.
- Component: prefilled inputs, three edits/one request, mixed category/entry edit, field errors, state preservation, no-op, cancel, saving disabled, refresh, keyboard and mobile behavior.
- E2E: CUF-001 through CUF-005 plus legacy Add Entry/removal/participant/category flows.
- Track batch-update duration, error/conflict/denial rate, changed-entry count, and critical-flow success. Alert above 5% errors for 10 minutes, p95 above two seconds for 10 minutes, or smoke failure.
- Post-deploy smoke edits synthetic entry title, verifies category + participant projections, restores original title, and confirms exact tested commit. Synthetic title text is never logged.
- Rollback prior application commit. Additive schema and unchanged document shapes need no data rollback; title changes already committed remain valid domain data.

## Post-Design Constitution Re-check

PASS. Design preserves least privilege and stable ownership, adds backward-compatible contract, performs atomic idempotent writes with stale-snapshot protection, covers all mandated test layers and production signals, and adds no operational dependency. No exception requires complexity tracking.

## Complexity Tracking

No constitution violations.
