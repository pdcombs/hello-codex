---

description: "Dependency-ordered implementation tasks for Edit Entry Titles"
---

# Tasks: Edit Entry Titles

**Input**: Design documents from `/specs/005-edit-entry-titles/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by the Votiy constitution. Write each story's tests first and confirm they fail for the missing behavior before implementation.

**Organization**: Tasks are grouped by user story. Complete and validate each phase before starting the next implementation phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable because the task changes different files and does not depend on incomplete work in the same phase
- **[Story]**: User story mapping from `spec.md`
- Every task names an exact file path

## Phase 1: Setup (Shared Test Baseline)

**Purpose**: Establish deterministic fixtures and compatibility expectations without changing production behavior

- [X] T001 Add reusable host, non-host, multi-entry category, archived-entry, and stale-snapshot fixtures in `votiy-api/tests/support/edit-entry-titles.js`
- [X] T002 [P] Add browser fixture builders for unchanged, three-title, mixed category/title, invalid-title, and stale-edit states in `tests/e2e/fixtures/edit-entry-titles.js`
- [X] T003 [P] Record feature 005 additive schema and legacy-operation compatibility baseline in `votiy-api/tests/contract/edit-entry-titles.contract.test.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the shared contract, validation, repository boundaries, and client document required by both stories

**CRITICAL**: No user-story implementation starts until this phase passes.

- [X] T004 [P] Add failing unit tests for trimming, title limits, unique entry IDs, valid timestamps, 5,000-entry maximum, and indexed field-error paths in `votiy-api/tests/unit/update-event-category-validation.test.js`
- [X] T005 [P] Add failing persistence contract tests for exact active-entry snapshot reads and conditional changed-only title writes in `votiy-api/tests/contract/event-entry-persistence.contract.test.js`
- [X] T006 Extend the active GraphQL schema additively with `CategoryEntryTitleUpdateInput`, `UpdateEventCategoryInput`, and `updateEventCategory` while preserving `renameEventCategory` in `specs/003-entry-derived-participants/contracts/schema.graphql`
- [X] T007 Update schema snapshot and assertions for the additive mutation, timestamp fields, error union, and all legacy operations in `votiy-api/tests/contract/__snapshots__/schema.contract.test.js.snap` and `votiy-api/tests/contract/schema.contract.test.js`
- [X] T008 [P] Implement the full category snapshot validation schema and field-addressable issue mapping in `votiy-api/src/domain/validation.js`
- [X] T009 [P] Add transaction-session support for exact active category-entry snapshot reads and expected-timestamp changed-only bulk title updates in `votiy-api/src/repositories/event-entry-repository.js`
- [X] T010 [P] Add conditional category rename and event timestamp update operations accepting session and expected category timestamp in `votiy-api/src/repositories/event-repository.js`
- [X] T011 [P] Add the `entry.title_changed` audit allowlist and identifier-only metadata contract in `votiy-api/src/repositories/audit-event-repository.js`
- [X] T012 Wire the additive resolver dependency and service transaction collaborators without activating web behavior in `votiy-api/src/server.js` and `votiy-api/src/api/graphql/event-resolvers.js`
- [X] T013 Add the `updateEventCategory` GraphQL document, full snapshot input mapping, hydrated result normalization, and compatibility-safe errors in `votiy-web/src/features/events/events.graphql.js`

**Checkpoint**: Schema composes, legacy clients remain valid, validation paths are stable, and repository contracts support one atomic intent.

---

## Phase 3: User Story 1 - Edit Entry Titles in a Category (Priority: P1) MVP

**Goal**: A host edits one or many prefilled entry titles, optionally edits the category title, saves once, and sees the complete result across category and participant views.

**Independent Test**: Open a category containing three active entries, change all three titles, save once, and verify the category and participant views show all new titles while entry identity, owner, category, status, and creation time remain unchanged.

### Tests for User Story 1

- [X] T014 [P] [US1] Add failing unit tests for host authorization, full-snapshot comparison, changed-only calculation, mixed category/entry edits, no-op behavior, and idempotent replay/conflict in `votiy-api/tests/unit/update-event-category-service.test.js`
- [X] T015 [P] [US1] Add failing GraphQL contract tests for batch success, hydrated event response, host denial, legacy rename compatibility, and immutable entry fields in `votiy-api/tests/contract/edit-entry-titles.contract.test.js`
- [X] T016 [P] [US1] Add failing replica-set integration tests for atomic one/three/many-entry updates, mixed category edits, no-op, replay, rollback, category isolation, and preserved entry fields in `votiy-api/tests/integration/update-event-category.test.js`
- [X] T017 [P] [US1] Add failing component tests for prefilled controlled fields, three edits with one request, mixed edits, cancel, pending-state lock, successful exit, and hydrated refresh in `votiy-web/tests/component/edit-entry-titles.test.jsx`
- [X] T018 [P] [US1] Add failing keyboard, focus, field-label, and narrow-screen edit coverage in `votiy-web/tests/component/accessibility.test.jsx`
- [X] T019 [P] [US1] Add failing Playwright flows CUF-001, CUF-002, and CUF-004 for batch editing and separate entry archival in `tests/e2e/edit-entry-titles.spec.js`

### Implementation for User Story 1

- [X] T020 [US1] Implement host-only batch orchestration, normalized change calculation, exact snapshot revalidation, atomic transaction, no-op, and idempotency in `votiy-api/src/services/event-category-service.js`
- [X] T021 [US1] Expose `updateEventCategory` through safe `EventResult` resolver handling in `votiy-api/src/api/graphql/event-resolvers.js`
- [X] T022 [US1] Emit privacy-safe `event.category_batch_update` logs and one identifier-only `entry.title_changed` audit per effective entry change in `votiy-api/src/services/event-category-service.js` and `votiy-api/src/repositories/audit-event-repository.js`
- [X] T023 [P] [US1] Convert category and entry title editing to controlled prefilled form state while keeping delete as a separate action in `votiy-web/src/features/events/EventCategoryList.jsx`
- [X] T024 [P] [US1] Render labelled editable entry-title fields with read-only owner context and icon-only archive control in `votiy-web/src/features/events/EventEntryRow.jsx`
- [X] T025 [US1] Submit one category snapshot mutation, replace local event state from the hydrated response, exit edit mode, and preserve Add Entry/archive behavior in `votiy-web/src/features/events/EventCategoryList.jsx` and `votiy-web/src/features/events/OwnerEventPage.jsx`
- [X] T026 [US1] Add responsive entry-edit field, owner context, focus, pending, and action styling consistent with shared form components in `votiy-web/src/App.css`
- [X] T027 [US1] Run US1 unit, contract, replica-set integration, component, accessibility, E2E, coverage, lint, and build gates from `specs/005-edit-entry-titles/quickstart.md` and record results in `specs/005-edit-entry-titles/checklists/requirements.md`

**Checkpoint**: Host batch editing works end-to-end; legacy rename, Add Entry, entry archive, and participant projection flows remain valid.

---

## Phase 4: User Story 2 - Correct Invalid Batch Changes (Priority: P2)

**Goal**: Invalid, unauthorized, or stale saves change nothing, identify the actionable problem, and retain every staged title so the host can correct and retry.

**Independent Test**: Change multiple titles, leave one blank, save, verify the exact field is highlighted and nothing persists, then correct it and confirm the full batch saves; repeat with a concurrent archive and verify conflict with zero partial changes.

### Tests for User Story 2

- [X] T028 [P] [US2] Add failing unit tests for indexed validation errors, archived/cross-category IDs, exact-set mismatch, stale category/entry timestamps, write-count mismatch, and zero partial writes in `votiy-api/tests/unit/update-event-category-service.test.js`
- [X] T029 [P] [US2] Add failing contract tests for `entryTitles.<index>.title` errors, safe conflict/not-found/forbidden outcomes, and rejection above 5,000 entries in `votiy-api/tests/contract/edit-entry-titles.contract.test.js`
- [X] T030 [P] [US2] Add failing replica-set race tests for concurrent entry add/archive/title edit, category rename, transaction failure before idempotency insert, and retry recovery in `votiy-api/tests/integration/update-event-category.test.js`
- [X] T031 [P] [US2] Add failing component tests for exact field highlighting, associated error text, preserved mixed edits after validation/conflict/network failure, correction retry, and announced form errors in `votiy-web/tests/component/edit-entry-titles.test.jsx`
- [X] T032 [P] [US2] Add failing Playwright flows CUF-003 and CUF-005 for validation recovery and unauthorized denial in `tests/e2e/edit-entry-titles.spec.js`

### Implementation for User Story 2

- [X] T033 [US2] Map validation, authorization, missing entity, stale snapshot, and write-count failures to safe operation errors with stable indexed paths in `votiy-api/src/services/event-category-service.js`
- [X] T034 [US2] Enforce exact active-entry ID and expected timestamp equality inside the transaction before any effective title write in `votiy-api/src/services/event-category-service.js`
- [X] T035 [US2] Abort on conditional repository count mismatch and preserve idempotency absence for failed transactions in `votiy-api/src/repositories/event-entry-repository.js` and `votiy-api/src/services/event-category-service.js`
- [X] T036 [US2] Map indexed API field errors to entry IDs, retain controlled values on every failure, announce summary errors, and focus the first invalid field in `votiy-web/src/features/events/EventCategoryList.jsx`
- [X] T037 [US2] Add conflict recovery messaging that retains edits and offers current-event refresh without automatic overwrite in `votiy-web/src/features/events/EventCategoryList.jsx` and `votiy-web/src/features/events/OwnerEventPage.jsx`
- [X] T038 [US2] Run US2 unit, contract, replica-set race, component, E2E, privacy-log, coverage, lint, and build gates from `specs/005-edit-entry-titles/quickstart.md` and record results in `specs/005-edit-entry-titles/checklists/requirements.md`

**Checkpoint**: Invalid and concurrent saves are atomic, actionable, accessible, and recoverable without losing staged values.

---

## Phase 5: Polish & Cross-Cutting Production Gates

**Purpose**: Close compatibility, performance, observability, delivery, and production-validation requirements

- [X] T039 [P] Extend narrow/short viewport, keyboard-only, focus-return, and failure-recovery E2E coverage in `tests/e2e/responsive-accessibility.spec.js`
- [X] T040 [P] Add isolated synthetic entry-title edit, category/participant projection verification, title restoration, and safe cleanup sequence in `tests/smoke/production-smoke.js`
- [X] T041 [P] Document batch-update latency/error/conflict/denial queries, 5% error and two-second p95 alerts, first diagnostics, privacy constraints, synthetic fixture, and rollback in `docs/operations.md`
- [X] T042 Update CI to enforce feature 005 unit coverage, schema contract, replica-set transaction, critical E2E, build, and smoke syntax gates in `.github/workflows/ci.yml`
- [X] T043 Verify legacy category rename, Add Entry, entry archive, participant projection, and event-page clients remain compatible in `votiy-api/tests/contract/schema.contract.test.js` and `votiy-web/tests/component/events.test.jsx`
- [X] T044 Run the full local validation matrix in `specs/005-edit-entry-titles/quickstart.md`, resolve every failure, and record aggregate results in `specs/005-edit-entry-titles/checklists/requirements.md`
- [X] T045 Reconcile implementation against every FR, SC, and CUF and document any approved deviation in `specs/005-edit-entry-titles/checklists/requirements.md`
- [ ] T046 Run post-deploy synthetic smoke against the exact tested `main` commit, verify dashboard/alert and rollback readiness, and record the privacy-safe outcome in `specs/005-edit-entry-titles/checklists/requirements.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: Starts immediately.
- **Phase 2 Foundation**: Depends on Phase 1 and blocks both user stories.
- **US1 Phase 3**: Depends on Foundation and delivers the MVP.
- **US2 Phase 4**: Depends on the US1 service and controlled-form seams; validates rejection and recovery independently.
- **Phase 5 Polish**: Depends on both stories; post-deploy validation follows all local and CI gates.

### User Story Dependency Graph

```text
Setup
  |
Foundation
  |
US1 Atomic category + entry title editing (MVP)
  |
US2 Invalid/stale save recovery
  |
Production gates
```

US2 builds on US1's batch boundary but remains independently testable with invalid and concurrent fixtures. Existing entry deletion stays an independent archive operation throughout.

### Within Each User Story

1. Write listed tests and confirm failure for missing behavior.
2. Implement repository/domain behavior before service orchestration.
3. Implement service behavior before resolver and client integration.
4. Add privacy-safe observability with the behavior it describes.
5. Run the story checkpoint gates and fix failures before continuing.

## Parallel Opportunities

- T002 and T003 can run in parallel after fixture expectations are agreed.
- T004 and T005 can run in parallel; T008, T009, T010, and T011 affect separate boundaries.
- US1 test tasks T014–T019 can run in parallel; UI tasks T023–T024 can run parallel after the client contract stabilizes.
- US2 test tasks T028–T032 can run in parallel before rejection/recovery implementation.
- Production tasks T039–T041 can run in parallel before CI and aggregate validation tasks T042–T046.

## Parallel Example: User Story 1

```text
Task T014: service decision tests in votiy-api/tests/unit/update-event-category-service.test.js
Task T015: GraphQL compatibility tests in votiy-api/tests/contract/edit-entry-titles.contract.test.js
Task T016: atomic transaction tests in votiy-api/tests/integration/update-event-category.test.js
Task T017: controlled-form tests in votiy-web/tests/component/edit-entry-titles.test.jsx
Task T018: accessibility tests in votiy-web/tests/component/accessibility.test.jsx
Task T019: critical browser flows in tests/e2e/edit-entry-titles.spec.js
```

## Parallel Example: User Story 2

```text
Task T028: stale/invalid service unit tests
Task T029: indexed-error contract tests
Task T030: replica-set concurrency tests
Task T031: field-error recovery component tests
Task T032: validation and denial browser flows
```

## Implementation Strategy

### MVP First

1. Complete T001–T013.
2. Complete T014–T027.
3. Stop and validate US1 independently.
4. Commit and push only after every US1 checkpoint gate passes when requested.

The MVP lets a host edit multiple entry titles and the category title with one atomic Save while preserving current removal and Add Entry behavior.

### Incremental Delivery

1. Foundation adds a backward-compatible contract and transaction boundary.
2. US1 delivers the host's complete batch-edit journey.
3. US2 hardens validation, concurrency, and failure recovery.
4. Production phase proves compatibility, observability, smoke restoration, and rollback.

## Notes

- `[P]` denotes safe file-level parallelism, not permission to skip dependencies.
- Entry and category title values never enter logs or audit metadata.
- No migration, package, service, environment variable, or new index is required.
- Existing entry removal remains a separate soft-archive action and is never staged into this batch.
- Preserve unrelated dirty-worktree changes.
