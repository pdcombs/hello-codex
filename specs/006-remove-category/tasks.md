---

description: "Dependency-ordered implementation tasks for Remove Category"
---

# Tasks: Remove Category

**Input**: Design documents from `/specs/006-remove-category/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by the Votiy constitution. Write each story's tests first and confirm they fail for missing behavior before implementation.

**Organization**: Tasks are grouped by user story. Complete and validate each phase before continuing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable because the task changes different files and does not depend on incomplete work in the same phase
- **[Story]**: User story mapping from `spec.md`
- Every task names an exact file path

## Phase 1: Setup (Shared Test Baseline)

**Purpose**: Establish deterministic lifecycle and browser fixtures without changing production behavior

- [x] T001 Add reusable legacy, active, archived, default, non-default, empty, populated, and stale category fixtures in `votiy-api/tests/support/remove-category.js`
- [x] T002 [P] Add browser fixture builders for confirm, cancel, populated removal, final-category, conflict, and unauthorized states in `tests/e2e/fixtures/remove-category.js`
- [x] T003 [P] Record feature 006 additive schema and legacy-operation compatibility baseline in `votiy-api/tests/contract/remove-category.contract.test.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add explicit category lifecycle, migration, shared contract, validation, persistence boundaries, and client operation

**CRITICAL**: No user-story implementation starts until this phase passes.

- [x] T004 [P] Add failing migration tests for legacy, partially migrated, active, archived, malformed, and rerun fixtures in `votiy-api/tests/integration/category-archival-migration.test.js`
- [x] T005 [P] Add failing domain tests for active/archived category lifecycle invariants and active-only projections in `votiy-api/tests/unit/category-archival-domain.test.js`
- [x] T006 [P] Add failing persistence contract tests for category lifecycle validator fields and active-category entry access in `votiy-api/tests/contract/category-archival-persistence.contract.test.js`
- [x] T007 Implement idempotent migration 004 for explicit category lifecycle and event schema version advancement in `votiy-api/src/migrations/004-category-archival.js`
- [x] T008 Wire migration 004 before validator enforcement and readiness in `votiy-api/src/server.js`
- [x] T009 Update event collection validation for required active/archived category lifecycle consistency in `votiy-api/src/repositories/indexes.js`
- [x] T010 [P] Add lifecycle constants, category-state validation, and active-category projection helpers in `votiy-api/src/domain/event-category.js`
- [x] T011 Update event projection, category lookup, uniqueness, and creation logic to operate on active categories while preserving archived records in `votiy-api/src/domain/event.js` and `votiy-api/src/repositories/event-repository.js`
- [x] T012 Extend the active GraphQL schema additively with `CategoryRemovalEntrySnapshotInput`, `ArchiveEventCategoryInput`, and `archiveEventCategory` in `specs/003-entry-derived-participants/contracts/schema.graphql`
- [x] T013 Update schema snapshot and assertions for the additive mutation while preserving all existing operations in `votiy-api/tests/contract/__snapshots__/schema.contract.test.js.snap` and `votiy-api/tests/contract/schema.contract.test.js`
- [x] T014 [P] Add removal input validation for timestamps, unique entry IDs, 5,000-entry bound, and UUID retry key in `votiy-api/src/domain/validation.js`
- [x] T015 [P] Add active-category exact snapshot and conditional `category_removed` entry archival repository operations in `votiy-api/src/repositories/event-entry-repository.js`
- [x] T016 [P] Add identifier-only category archival audit name, metadata allowlist, and transaction-session support in `votiy-api/src/repositories/audit-event-repository.js`
- [x] T017 Wire removal service collaborators and additive resolver dependency without activating web controls in `votiy-api/src/server.js` and `votiy-api/src/api/graphql/event-resolvers.js`
- [x] T018 Add the `archiveEventCategory` GraphQL document, snapshot input mapping, hydrated result normalization, and compatibility-safe errors in `votiy-web/src/features/events/events.graphql.js`

**Checkpoint**: Migration is idempotent, validators enforce lifecycle, schema composes, legacy clients remain valid, and archived categories are absent from active projections.

---

## Phase 3: User Story 1 - Remove an Unneeded Category (Priority: P1) MVP

**Goal**: Host reviews a destructive warning, confirms removal of a non-final category, and sees that category and all active entries disappear while archived history remains.

**Independent Test**: Remove a populated non-default category from an event with at least two active categories, then verify event and participant projections omit it while database records and privacy-safe audits retain category/entry identity, ownership, actor, time, and reason.

### Tests for User Story 1

- [x] T019 [P] [US1] Add failing unit tests for host authorization, exact snapshot validation, populated/empty cascade, changed-only archival, idempotent replay, changed-digest conflict, and privacy-safe telemetry in `votiy-api/tests/unit/archive-event-category-service.test.js`
- [x] T020 [P] [US1] Add failing GraphQL contract tests for removal success/error shapes, hydrated active event, immutable history, archived-title reuse, and legacy compatibility in `votiy-api/tests/contract/remove-category.contract.test.js`
- [x] T021 [P] [US1] Add failing replica-set integration tests for empty/populated non-default archival, atomic audit/idempotency, rollback, retry, participant derivation, and same-title new identity in `votiy-api/tests/integration/archive-event-category.test.js`
- [x] T022 [P] [US1] Add failing component tests for destructive action visibility, entry-count warning, cancel, confirm, pending lock, success refresh, failure retention, and separate title-save behavior in `votiy-web/tests/component/remove-category.test.jsx`
- [x] T023 [P] [US1] Add failing keyboard, focus-trap, Escape, warning announcement, focus-return, and narrow-screen coverage in `votiy-web/tests/component/accessibility.test.jsx`
- [x] T024 [P] [US1] Add failing Playwright flows CUF-001 and CUF-002 for populated removal and cancellation in `tests/e2e/remove-category.spec.js`

### Implementation for User Story 1

- [x] T025 [US1] Implement host-only removal orchestration, snapshot revalidation, populated/empty cascade, transaction, idempotency, and hydrated result in `votiy-api/src/services/event-category-service.js`
- [x] T026 [US1] Implement conditional embedded category archival preserving identity/history and excluding archived titles from active uniqueness in `votiy-api/src/repositories/event-repository.js`
- [x] T027 [US1] Enforce conditional active-entry archival matched counts and `category_removed` lifecycle metadata in `votiy-api/src/repositories/event-entry-repository.js`
- [x] T028 [US1] Persist one category audit and one audit per newly archived entry inside the removal transaction in `votiy-api/src/services/event-category-service.js` and `votiy-api/src/repositories/audit-event-repository.js`
- [x] T029 [US1] Expose `archiveEventCategory` through safe `EventResult` resolver handling with authorization-denial audit in `votiy-api/src/api/graphql/event-resolvers.js`
- [x] T030 [P] [US1] Build accessible destructive confirmation dialog with category name, affected-entry count, cancel, confirm, pending, and focus behavior in `votiy-web/src/features/events/RemoveCategoryDialog.jsx`
- [x] T031 [P] [US1] Add Remove category action to category edit mode without changing the existing title/entry Save action in `votiy-web/src/features/events/EventCategoryList.jsx`
- [x] T032 [US1] Integrate removal mutation, hydrated event replacement, conflict/error retention, and dialog focus return in `votiy-web/src/features/events/EventCategoryList.jsx` and `votiy-web/src/features/events/OwnerEventPage.jsx`
- [x] T033 [US1] Add responsive destructive-dialog, warning, disabled, pending, and category-removal styling in `votiy-web/src/App.css`
- [x] T034 [US1] Run US1 migration, unit, contract, replica-set integration, component, accessibility, E2E, coverage, lint, and build gates from `specs/006-remove-category/quickstart.md` and record results in `specs/006-remove-category/checklists/requirements.md`

**Checkpoint**: Host can safely archive a non-final category and its active entries end-to-end; cancellation and existing category edit flows remain valid.

---

## Phase 4: User Story 2 - Protect the Event's Final Category (Priority: P2)

**Goal**: UI and persistence both prevent removal of the only active category, while concurrent removals deterministically preserve one active default category.

**Independent Test**: Verify the only active category shows a disabled/unavailable removal explanation, direct mutation is rejected, and concurrent removal attempts against two categories allow at most one success with exactly one active default remaining.

### Tests for User Story 2

- [x] T035 [P] [US2] Add failing unit tests for final-category rejection, deterministic oldest-category promotion, timestamp tie break, stale event/category snapshot, and concurrent conditional failure in `votiy-api/tests/unit/archive-event-category-service.test.js`
- [x] T036 [P] [US2] Add failing persistence contract tests for another-active-category guard and atomic default promotion filter/update in `votiy-api/tests/contract/category-archival-persistence.contract.test.js`
- [x] T037 [P] [US2] Add failing replica-set integration tests for direct last-category denial, concurrent two-category removal, default/non-default races, promotion rollback, and exactly-one-active-default invariant in `votiy-api/tests/integration/archive-event-category.test.js`
- [x] T038 [P] [US2] Add failing component tests for one-category explanation, disabled action semantics, conflict refresh, and retained edit state in `votiy-web/tests/component/remove-category.test.jsx`
- [x] T039 [P] [US2] Add failing Playwright flows CUF-003, CUF-004, and CUF-005 for final-category protection, concurrent safety, and unauthorized absence in `tests/e2e/remove-category.spec.js`

### Implementation for User Story 2

- [x] T040 [US2] Add conditional another-active-category guard and deterministic oldest-active default promotion to the event archival write in `votiy-api/src/repositories/event-repository.js`
- [x] T041 [US2] Revalidate final-category count, event/category timestamps, and promoted default inside the transaction with safe conflict outcomes in `votiy-api/src/services/event-category-service.js`
- [x] T042 [US2] Disable or hide final-category removal, associate the explanatory message, and expose conflict refresh without discarding staged title edits in `votiy-web/src/features/events/EventCategoryList.jsx`
- [x] T043 [US2] Add invariant-breach, conflict, denial, affected-count, and default-promotion signals without titles/contact data in `votiy-api/src/services/event-category-service.js`
- [x] T044 [US2] Run US2 concurrency, invariant, authorization, component, E2E, privacy-log, coverage, lint, and build gates from `specs/006-remove-category/quickstart.md` and record results in `specs/006-remove-category/checklists/requirements.md`

**Checkpoint**: Successful, failed, retried, and concurrent operations always leave at least one active category and exactly one active default.

---

## Phase 5: Polish & Cross-Cutting Production Gates

**Purpose**: Close compatibility, observability, delivery, migration, and production validation

- [x] T045 [P] Extend narrow/short viewport, keyboard-only, reduced-motion, warning, and focus-return E2E coverage in `tests/e2e/responsive-accessibility.spec.js`
- [x] T046 [P] Add synthetic category creation, entry creation, category archival, active-projection verification, audit verification, and invariant checks in `tests/smoke/production-smoke.js`
- [x] T047 [P] Document migration, archival SLIs, privacy-safe queries, 5% error and two-second p95 alerts, invariant diagnostics, synthetic setup, and rollback in `docs/operations.md`
- [x] T048 Update CI to enforce feature 006 migration, schema/persistence contracts, replica-set concurrency, critical E2E, build, and smoke syntax gates in `.github/workflows/ci.yml`
- [x] T049 Verify category add/title edit, Add Entry, individual entry archive, participant projection, public event, and archived-title reuse remain compatible in `votiy-api/tests/contract/schema.contract.test.js` and `votiy-web/tests/component/events.test.jsx`
- [x] T050 Run the full local validation matrix in `specs/006-remove-category/quickstart.md`, resolve every failure, and record aggregate results in `specs/006-remove-category/checklists/requirements.md`
- [x] T051 Reconcile implementation against every FR, SC, and CUF and document any approved deviation in `specs/006-remove-category/checklists/requirements.md`
- [ ] T052 Run post-deploy synthetic smoke against the exact tested `main` commit, verify dashboard/alert and rollback readiness, and record the privacy-safe outcome in `specs/006-remove-category/checklists/requirements.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: Starts immediately.
- **Phase 2 Foundation**: Depends on Setup; blocks all story work because lifecycle and migration must precede archival.
- **US1 Phase 3**: Depends on Foundation and delivers the removal MVP.
- **US2 Phase 4**: Depends on US1's transaction seam and adds final-category/concurrency safety as an independently testable boundary.
- **Phase 5 Polish**: Depends on both stories; post-deploy validation follows all local and CI gates.

### User Story Dependency Graph

```text
Setup
  |
Lifecycle migration + additive contract
  |
US1 Confirmed category + entry archival (MVP)
  |
US2 Final-category + concurrent-removal protection
  |
Production gates
```

US2 builds on the US1 archival transaction but is independently demonstrable through final-category and concurrent-removal fixtures.

### Within Each User Story

1. Write listed tests and confirm failure for missing behavior.
2. Implement domain/repository behavior before service orchestration.
3. Implement service before resolver/client integration.
4. Keep audit and idempotency writes inside the same transaction.
5. Run checkpoint gates and fix failures before continuing.

## Parallel Opportunities

- T002 and T003 can run in parallel after fixture expectations are agreed.
- T004–T006 can run in parallel; T010, T014–T016 affect separate files after migration shape stabilizes.
- US1 test tasks T019–T024 can run in parallel; dialog T030 and category control T031 can proceed in parallel after client contract settles.
- US2 test tasks T035–T039 can run in parallel before guard/promotion implementation.
- Production tasks T045–T047 can run in parallel before CI and aggregate validation tasks T048–T052.

## Parallel Example: User Story 1

```text
Task T019: archival service decisions in votiy-api/tests/unit/archive-event-category-service.test.js
Task T020: GraphQL contract in votiy-api/tests/contract/remove-category.contract.test.js
Task T021: transaction integration in votiy-api/tests/integration/archive-event-category.test.js
Task T022: confirmation component behavior in votiy-web/tests/component/remove-category.test.jsx
Task T023: keyboard/focus behavior in votiy-web/tests/component/accessibility.test.jsx
Task T024: browser confirmation/cancel flows in tests/e2e/remove-category.spec.js
```

## Parallel Example: User Story 2

```text
Task T035: final-category/promotion unit tests
Task T036: conditional persistence contract
Task T037: concurrent replica-set integration tests
Task T038: disabled/conflict component tests
Task T039: final-category/concurrency/denial browser flows
```

## Implementation Strategy

### MVP First

1. Complete T001–T018.
2. Complete T019–T034.
3. Stop and validate US1 independently.
4. Commit and push only after every US1 checkpoint gate passes when requested.

MVP archives a confirmed non-final category and all active entries atomically while preserving history and current category-edit behavior.

### Incremental Delivery

1. Foundation migrates lifecycle and introduces compatible contracts.
2. US1 delivers confirmed archival and audit history.
3. US2 proves final-category and concurrency invariants.
4. Production phase proves compatibility, observability, smoke history, and rollback.

## Notes

- `[P]` denotes safe file-level parallelism, not permission to skip dependencies.
- Category titles, entry titles, display names, email, and phone never enter operational logs or audit metadata.
- Removed categories and entries are permanently archived and never hard deleted or restored.
- Same-title creation always produces a new category identity.
- Preserve unrelated dirty-worktree changes.
