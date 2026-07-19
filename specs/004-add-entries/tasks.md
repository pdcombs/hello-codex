---

description: "Dependency-ordered implementation tasks for Add Entries"
---

# Tasks: Add Entries

**Input**: Design documents from `/specs/004-add-entries/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by Votiy constitution. Write each story's tests first and confirm they fail for missing behavior before implementation.

**Organization**: Tasks grouped by user story. Complete and validate each phase before next phase; commit and push validated stage per project workflow.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable because task changes different files and does not depend on incomplete task in same phase
- **[Story]**: User story mapping from `spec.md`
- Every task names exact file path

## Phase 1: Setup (Shared Test Fixtures)

**Purpose**: Establish deterministic feature fixtures without changing production behavior

- [X] T001 Add reusable host, category, existing-account, recent-owner, archived-owner, and unused-contact fixtures in `votiy-api/tests/support/add-entries.js`
- [X] T002 [P] Add browser fixture builders for empty/populated categories, recent participants, global matches, and provisional contacts in `tests/e2e/fixtures/add-entries.js`
- [X] T003 [P] Record feature 004 schema-composition expectations and compatibility baseline in `votiy-api/tests/contract/add-entries.contract.test.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Additive contracts, shared validation, authorization, persistence index, and client primitives required by all stories

**CRITICAL**: No user-story implementation starts until foundation passes.

- [X] T004 [P] Add failing unit coverage for event-manager authorization, owner-source exclusivity, contact normalization, three-character minimum, and ten-result limit in `votiy-api/tests/unit/add-entry-foundation.test.js`
- [X] T005 [P] Add failing persistence contract coverage for `entry_event_recent_owners` and unchanged account contact indexes in `votiy-api/tests/contract/event-entry-persistence.contract.test.js`
- [X] T006 Extend active GraphQL schema additively with `EntryOwnerChoice`, `entryOwnerChoices`, provisional owner input, and `createEventEntry` in `specs/003-entry-derived-participants/contracts/schema.graphql`
- [X] T007 Update schema snapshot and compatibility assertions for old plus new operations in `votiy-api/tests/contract/__snapshots__/schema.contract.test.js.snap` and `votiy-api/tests/contract/schema.contract.test.js`
- [X] T008 [P] Add owner-choice and single-entry input validation schemas with field-addressable errors in `votiy-api/src/domain/validation.js`
- [X] T009 [P] Add privacy-safe `EntryOwnerChoice` projection and contact normalization helpers in `votiy-api/src/domain/event-entry.js`
- [X] T010 Add centralized current-owner event-management authorization boundary for lookup and mutation reuse in `votiy-api/src/services/event-access-service.js`
- [X] T011 Add `entry_event_recent_owners` index definition without changing existing indexes in `votiy-api/src/repositories/indexes.js`
- [X] T012 Wire event access service and additive resolver dependencies without activating UI behavior in `votiy-api/src/server.js` and `votiy-api/src/api/graphql/event-resolvers.js`
- [X] T013 Add GraphQL client documents, result normalization, and schema-mismatch-safe errors for owner choices and single-entry creation in `votiy-web/src/features/events/events.graphql.js`

**Checkpoint**: Schema composes, existing clients remain valid, foundation tests pass, no contact data is exposed publicly.

---

## Phase 3: User Story 1 - Add an Entry to a Category (Priority: P1) MVP

**Goal**: Host opens Add entry from chosen category, selects existing account, enters title, saves exactly one entry, and sees category/participant projections refresh.

**Independent Test**: From empty category, open modal, select existing account fixture, enter valid title, save, then verify one entry in originating category and one derived participant.

### Tests for User Story 1

- [X] T014 [P] [US1] Add failing unit tests for existing-owner single-entry creation, manager denial, invalid category/account, idempotent replay, changed-digest conflict, and transaction failure in `votiy-api/tests/unit/add-event-entry-service.test.js`
- [X] T015 [P] [US1] Add failing GraphQL contract tests for `createEventEntry` success/error shapes and exactly-one-owner validation in `votiy-api/tests/contract/add-entries.contract.test.js`
- [X] T016 [P] [US1] Add failing replica-set integration tests for existing-owner transaction, rollback, retry, category isolation, and participant derivation in `votiy-api/tests/integration/add-event-entry.test.js`
- [X] T017 [P] [US1] Add failing component tests for empty/populated category actions, modal step transitions, fixed category, title validation, retry preservation, close, and event refresh in `votiy-web/tests/component/add-entry-modal.test.jsx`
- [X] T018 [P] [US1] Add failing keyboard/focus/mobile accessibility coverage for modal trap, Escape, Back, errors, and initiator focus return in `votiy-web/tests/component/accessibility.test.jsx`
- [X] T019 [P] [US1] Add failing Playwright flow CUF-001 for existing-account entry creation in `tests/e2e/add-entries.spec.js`

### Implementation for User Story 1

- [X] T020 [US1] Implement existing-account `createEntry` transaction, category/account revalidation, idempotency replay, and hydrated result in `votiy-api/src/services/event-entry-service.js`
- [X] T021 [US1] Expose `createEventEntry` resolver with safe union errors and manager authorization in `votiy-api/src/api/graphql/event-resolvers.js`
- [X] T022 [US1] Add privacy-safe `entry.created` audit metadata and `event.entry_create` structured outcome/duration logging in `votiy-api/src/repositories/audit-event-repository.js` and `votiy-api/src/services/event-entry-service.js`
- [X] T023 [P] [US1] Build accessible two-step dialog shell, state preservation, focus management, and existing-owner selection contract in `votiy-web/src/features/events/AddEntryModal.jsx`
- [X] T024 [P] [US1] Build category empty-state and populated-category Add entry controls in `votiy-web/src/features/events/EventCategoryList.jsx`
- [X] T025 [US1] Integrate modal open/save/close and hydrated event reload in `votiy-web/src/features/events/OwnerEventPage.jsx`
- [X] T026 [US1] Add responsive modal, selected-owner, step, error, and category action styling in `votiy-web/src/App.css`
- [ ] T027 [US1] Run US1 unit, contract, integration, component, E2E, coverage, lint, and build gates using commands in `specs/004-add-entries/quickstart.md`; record outcomes in `specs/004-add-entries/checklists/requirements.md`

**Checkpoint**: Existing account entry creation works end-to-end without recent ordering or global typeahead.

---

## Phase 4: User Story 2 - Quickly Reuse a Recent Participant (Priority: P2)

**Goal**: Modal initially lists distinct active event participants newest-entry-owner first for fast reselection.

**Independent Test**: Seed multiple active and archived owner entries at known times; open modal; verify distinct active owners ordered by newest active entry and select first choice without search.

### Tests for User Story 2

- [X] T028 [P] [US2] Add failing unit tests for distinct recent-owner grouping, latest timestamp ordering, deterministic ties, bound, and archived exclusion in `votiy-api/tests/unit/entry-owner-choices.test.js`
- [X] T029 [P] [US2] Add failing GraphQL contract tests for empty-search recent choices, nullable contact fields, and unauthorized safe errors in `votiy-api/tests/contract/add-entries.contract.test.js`
- [X] T030 [P] [US2] Add failing replica-set integration tests for indexed recent-owner scan, account hydration order, duplicate ownership, and archived-only exclusion in `votiy-api/tests/integration/entry-owner-choices.test.js`
- [X] T031 [P] [US2] Add failing component tests for recent list loading/empty/failure, identity display, direct selection, and newest-owner-first rendering in `votiy-web/tests/component/add-entry-owner-choices.test.jsx`
- [X] T032 [P] [US2] Add failing Playwright flow CUF-003 for repeated entry creation and last-used participant promotion in `tests/e2e/add-entries.spec.js`

### Implementation for User Story 2

- [X] T033 [US2] Implement indexed recent distinct owner lookup preserving newest-entry order in `votiy-api/src/repositories/event-entry-repository.js`
- [X] T034 [US2] Implement empty-search recent owner choice hydration and manager-only service response in `votiy-api/src/services/event-entry-service.js`
- [X] T035 [US2] Expose recent mode through `entryOwnerChoices` resolver and privacy-safe error union in `votiy-api/src/api/graphql/event-resolvers.js`
- [X] T036 [US2] Load and render recent participant choices with name, email, phone, loading, empty, failure, and selection states in `votiy-web/src/features/events/AddEntryOwnerStep.jsx`
- [X] T037 [US2] Integrate recent owner step into modal and refresh recency after successful entry creation in `votiy-web/src/features/events/AddEntryModal.jsx`
- [X] T038 [US2] Add `entry.owner_choices_read` duration/result-count logs without identity values in `votiy-api/src/services/event-entry-service.js`
- [ ] T039 [US2] Run US2 unit, contract, integration, component, E2E, coverage, and indexed-query-plan gates from `specs/004-add-entries/quickstart.md`; record outcomes in `specs/004-add-entries/checklists/requirements.md`

**Checkpoint**: Recent participant quick selection works; US1 existing-account save remains valid.

---

## Phase 5: User Story 3 - Find or Create Account by Contact (Priority: P3)

**Goal**: Host searches global accounts by bounded email/phone prefix, ignores stale results, selects match, or creates provisional owner atomically when no match exists.

**Independent Test**: Search known global account by progressive contact input and save entry; then search unused complete contact, create provisional owner plus entry, and verify unauthorized lookup returns no identity data.

### Tests for User Story 3

- [X] T040 [P] [US3] Add failing unit tests for search mode normalization, three-character minimum, ten-result cap, contact-type detection, event recency enrichment, and no PII logs in `votiy-api/tests/unit/entry-owner-search.test.js`
- [X] T041 [P] [US3] Add failing unit tests for provisional owner validation, exact account reuse, conflicting email/phone identities, idempotency, and rollback in `votiy-api/tests/unit/add-event-entry-service.test.js`
- [X] T042 [P] [US3] Add failing contract tests for search arguments, provisional input, nullable contacts, field errors, and public-schema contact isolation in `votiy-api/tests/contract/add-entries.contract.test.js`
- [X] T043 [P] [US3] Add failing replica-set integration tests for indexed email/phone prefix search, bounds, unauthorized no-read, concurrent provisional resolution, unique-contact conflict, and atomic rollback in `votiy-api/tests/integration/entry-owner-search.test.js`
- [X] T044 [P] [US3] Add failing component tests for debounce, stale-response suppression, current-query results, no-results, retry, and match selection in `votiy-web/tests/component/add-entry-owner-search.test.jsx`
- [X] T045 [P] [US3] Add failing component tests for provisional display/contact validation, owner confirmation, preserved state, and final save in `votiy-web/tests/component/add-entry-provisional-owner.test.jsx`
- [X] T046 [P] [US3] Add failing Playwright flows CUF-002, CUF-004, and CUF-005 for global lookup, provisional creation/retry, and unauthorized denial in `tests/e2e/add-entries.spec.js`

### Implementation for User Story 3

- [X] T047 [US3] Implement bounded indexed normalized email/phone prefix queries and deterministic result order in `votiy-api/src/repositories/account-repository.js`
- [X] T048 [US3] Implement global search owner choices, active-event recency enrichment, and contact-minimizing response in `votiy-api/src/services/event-entry-service.js`
- [X] T049 [US3] Implement transactional provisional resolve/reuse/create, conflicting-identity rejection, and single-entry commit in `votiy-api/src/services/event-entry-service.js`
- [X] T050 [US3] Extend `entryOwnerChoices` and `createEventEntry` resolvers for search/provisional paths with no contact leakage on denial in `votiy-api/src/api/graphql/event-resolvers.js`
- [X] T051 [P] [US3] Build debounced typeahead with request cancellation/sequence guard, keyboard choice navigation, loading, no-results, and retry in `votiy-web/src/features/events/AddEntryOwnerStep.jsx`
- [X] T052 [P] [US3] Build provisional owner form and validation using complete searched contact plus required display name in `votiy-web/src/features/events/AddEntryProvisionalOwner.jsx`
- [X] T053 [US3] Integrate global match and provisional paths into modal step state and save payload in `votiy-web/src/features/events/AddEntryModal.jsx`
- [X] T054 [US3] Add search/provisional structured logs and audit metadata limited to outcome, counts, IDs, durations, correlation, and provisional boolean in `votiy-api/src/services/event-entry-service.js` and `votiy-api/src/repositories/audit-event-repository.js`
- [ ] T055 [US3] Run US3 unit, contract, integration, component, E2E, privacy-log, coverage, lint, and build gates from `specs/004-add-entries/quickstart.md`; record outcomes in `specs/004-add-entries/checklists/requirements.md`

**Checkpoint**: All three stories work independently through additive contract; no unauthorized contact disclosure or partial write remains.

---

## Phase 6: Polish & Cross-Cutting Production Gates

**Purpose**: Close quality, operations, compatibility, and deployment requirements across stories

- [X] T056 [P] Extend narrow/short viewport, reduced-motion, keyboard-only, and focus-return E2E coverage in `tests/e2e/responsive-accessibility.spec.js`
- [X] T057 [P] Add isolated synthetic owner-choice, entry-create, projection, and archive cleanup sequence in `tests/smoke/production-smoke.js`
- [X] T058 [P] Document lookup/create SLIs, privacy-safe queries, 5% error alerts, one-second p95 alert, diagnostic steps, synthetic fixture setup, and rollback in `docs/operations.md`
- [X] T059 Update CI to enforce API/web 80% line and branch coverage plus Add Entries contract, replica-set integration, E2E, build, and smoke syntax gates in `.github/workflows/ci.yml`
- [X] T060 Verify old GraphQL operations and current participant/category pages remain compatible in `votiy-api/tests/contract/schema.contract.test.js` and `votiy-web/tests/component/events.test.jsx`
- [ ] T061 Run full `specs/004-add-entries/quickstart.md` locally against production-equivalent MongoDB, capture aggregate outcomes, and resolve every failed check in `specs/004-add-entries/checklists/requirements.md`
- [ ] T062 Run post-deploy synthetic smoke against exact tested `main` commit, verify dashboards/alerts and rollback readiness, and record privacy-safe outcome in `specs/004-add-entries/checklists/requirements.md`
- [X] T063 Reconcile implementation against all FR/SC/CUF items and document any approved deviation in `specs/004-add-entries/checklists/requirements.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: Starts immediately.
- **Phase 2 Foundation**: Depends on Phase 1; blocks stories.
- **US1 Phase 3**: Depends on Foundation; MVP.
- **US2 Phase 4**: Depends on Foundation and reuses US1 modal/create shell; independently validated through recent-owner fixture.
- **US3 Phase 5**: Depends on Foundation and reuses US1 modal/create shell; global search can develop parallel with US2 after shared query contract stabilizes, but final modal integration follows both owner modes.
- **Phase 6 Polish**: Depends on desired stories; full completion requires all stories.

### User Story Dependency Graph

```text
Setup
  |
Foundation
  |
US1 Add one existing-owner entry (MVP)
  |\
  | US3 Global search + provisional owner
  |
US2 Recent participant quick reuse
  \_______________________________/
                  |
          Production gates
```

US2 and US3 both extend US1 and may run in parallel after US1 contract/modal seams stabilize. Neither changes US1 entry-creation outcome.

### Within Each Story

1. Write listed tests and confirm failure for missing behavior.
2. Implement repository/domain behavior before service orchestration.
3. Implement service before resolver/client UI integration.
4. Add privacy-safe observability with behavior.
5. Run story checkpoint gates; fix failures before next phase.

## Parallel Opportunities

- T002 and T003 parallel with T001.
- T004 and T005 parallel; T008, T009, and T010 use different files.
- US1 test tasks T014–T019 parallel; modal T023 and category controls T024 parallel after contract settles.
- US2 test tasks T028–T032 parallel; API recent lookup and UI choice presentation can proceed in parallel after expected contract locks.
- US3 test tasks T040–T046 parallel; repository search T047 and UI components T051–T052 can proceed in parallel.
- Production tasks T056–T058 parallel before CI/full validation tasks T059–T063.

## Parallel Example: User Story 1

```text
Task T014: unit service decisions in votiy-api/tests/unit/add-event-entry-service.test.js
Task T015: GraphQL contract in votiy-api/tests/contract/add-entries.contract.test.js
Task T016: transaction integration in votiy-api/tests/integration/add-event-entry.test.js
Task T017: modal component in votiy-web/tests/component/add-entry-modal.test.jsx
Task T018: accessibility component in votiy-web/tests/component/accessibility.test.jsx
Task T019: browser critical flow in tests/e2e/add-entries.spec.js
```

## Parallel Example: User Story 2

```text
Task T028: recent grouping unit tests
Task T029: recent-choice contract tests
Task T030: indexed recent lookup integration tests
Task T031: recent list component tests
Task T032: repeated-entry Playwright flow
```

## Parallel Example: User Story 3

```text
Task T040: search service unit tests
Task T041: provisional transaction unit tests
Task T042: search/provisional contract tests
Task T043: indexed/concurrent integration tests
Task T044: typeahead stale-response component tests
Task T045: provisional owner component tests
Task T046: global/provisional/denial Playwright flows
```

## Implementation Strategy

### MVP First

1. Complete T001–T013.
2. Complete T014–T027.
3. Stop; validate US1 independently.
4. Commit/push only after all US1 checkpoint gates pass.

MVP permits host to add one titled entry for existing selectable account from fixed category. Recent optimization and unmatched-account creation follow.

### Incremental Delivery

1. Foundation adds compatible schema/security/index only.
2. US1 delivers core owned entry creation.
3. US2 optimizes repeated host workflow with recent participants.
4. US3 adds bounded global discovery and provisional accounts.
5. Production phase validates full privacy, accessibility, telemetry, smoke, and rollback.

## Notes

- `[P]` means safe parallel file ownership, not permission to skip dependencies.
- Contact values, search input, display names, and entry titles never enter logs/audit metadata.
- Current manager authorization resolves event owner only; delegated administrator lifecycle remains separate feature.
- Preserve unrelated dirty-worktree changes.
- Commit and push each validated implementation stage per project workflow.
