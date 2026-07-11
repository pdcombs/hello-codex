---

description: "Implementation tasks for event categories and entries"
---

# Tasks: Event Categories and Entries

**Input**: Design documents from `/specs/002-event-categories-entries/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/schema.graphql`, `quickstart.md`

**Tests**: Required at unit, contract, integration, component, E2E, coverage, and post-deploy smoke layers under the Votiy constitution.

**Organization**: Tasks are grouped by prioritized user story and written for test-first implementation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align local/runtime infrastructure and contract sources before domain work.

- [ ] T001 Configure MongoDB as a single-node replica set with a health check that confirms primary readiness in `compose.yaml` and `votiy-database/init-replica.js`
- [ ] T002 Document replica-set startup, recovery, and transaction prerequisites in `README.md` and `docs/operations.md`
- [ ] T003 Validate/stage the breaking contract and add a disabled-by-default web activation gate without switching runtime behavior in `votiy-api/tests/contract/schema.contract.test.js`, `votiy-web/src/config/features.js`, and `specs/002-event-categories-entries/contracts/schema.graphql`
- [ ] T004 [P] Add shared event-category and entry fixtures/builders in `votiy-api/tests/support/event-setup.js`
- [ ] T005 [P] Add reusable browser fixtures for category/entry host flows in `tests/e2e/fixtures/event-setup.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish version-2 persistence, migrations, domain objects, and transaction support used by every story.

**⚠️ CRITICAL**: No user-story implementation begins until this phase passes.

- [ ] T006 [P] Write failing unit tests for required account display names, category/entry construction, normalization, limits, and email-prefix/phone-only fallback derivation in `votiy-api/tests/unit/event-setup-domain.test.js`
- [ ] T007 [P] Write failing persistence contract tests for version-2 accounts, event categories, and active/removed registration entries in `votiy-api/tests/contract/persistence-event-setup.contract.test.js`
- [ ] T008 [P] Write failing migration integration tests covering every account and registration status, deterministic names/titles, checkpoints, idempotent restart, and validator ordering in `votiy-api/tests/integration/event-setup-migration.test.js`
- [ ] T009 Implement Category and Entry domain constructors/projections in `votiy-api/src/domain/event-category.js` and `votiy-api/src/domain/event-entry.js`
- [ ] T010 Add dormant schema-version-2 account, event/default-category, and registration/entry constructors without activating writes in `votiy-api/src/domain/account.js`, `votiy-api/src/domain/event.js`, and `votiy-api/src/domain/event-registration.js`
- [ ] T011 Add transitional validators accepting version 1 and 2 display-name/category/entry documents in `votiy-api/src/repositories/indexes.js`
- [ ] T012 Implement transaction/session plumbing for repository operations in `votiy-api/src/repositories/mongo.js`, `votiy-api/src/repositories/account-repository.js`, `votiy-api/src/repositories/event-registration-repository.js`, and `votiy-api/src/repositories/idempotency-repository.js`
- [ ] T013 Implement idempotent migration 002 for all accounts, events, and active/removed registrations with email-prefix display names, phone-only fallbacks, and stable entry titles in `votiy-api/src/migrations/002-event-categories-entries.js`
- [ ] T014 Run idempotent migration 002 before HTTP readiness while retaining transitional validators for subsequent task-level deployments in `votiy-api/src/server.js`
- [ ] T015 Add account/event/all-registration migration outcome logs, readiness failure behavior, and privacy assertions in `votiy-api/src/observability/logger.js`, `votiy-api/src/api/health.js`, and `votiy-api/tests/integration/event-setup-migration.test.js`

**Checkpoint**: Replica-set transactions, version-2 documents, migration, validators, and fixtures pass before story work.

---

## Phase 3: User Story 1 - Register Participants with Entries (Priority: P1) 🎯 MVP

**Goal**: Require display names and collect one or more titled, categorized entries for both host-managed and OPEN-event self-registration.

**Independent Test**: Register a display-named participant with three entries across two categories, then self-register another display-named account with the prepopulated default entry row; verify ownership, atomic failure, field errors, and retry.

### Tests for User Story 1

- [ ] T016 [P] [US1] Write failing host/self registration service tests for display name, required entry inputs, default category, authorization, atomicity, and idempotency in `votiy-api/tests/unit/event-registration-service.test.js`
- [ ] T017 [P] [US1] Write failing account/event contract tests for required display names, required host/self entry inputs, and nested field errors in `votiy-api/tests/contract/account.contract.test.js` and `votiy-api/tests/contract/event-setup.contract.test.js`
- [ ] T018 [P] [US1] Write failing real-Mongo transaction tests for host/self registration, provisional display names, embedded entries, rollback, revival, and retry in `votiy-api/tests/integration/participant-entries.test.js`
- [ ] T019 [P] [US1] Write failing React tests for account display name, host/self entry rows, default category, preserved errors, and optional phone in `votiy-web/tests/component/registration.test.jsx` and `votiy-web/tests/component/participant-entries.test.jsx`
- [ ] T020 [P] [US1] Write failing CUF-001 E2E coverage for display-named account signup, host multi-entry registration, and OPEN-event self-registration entry collection in `tests/e2e/event-setup.spec.js`

### Implementation for User Story 1

- [ ] T021 [US1] Add account display-name and required host/self participant-entry schemas with nested field-error paths in `votiy-api/src/domain/validation.js`
- [ ] T022 [US1] Extend event repositories to load and validate same-event category IDs inside transaction sessions in `votiy-api/src/repositories/event-repository.js`
- [ ] T023 [US1] Create/revive host and self registrations only with complete embedded entry arrays in `votiy-api/src/repositories/event-registration-repository.js`
- [ ] T024 [US1] Implement display-name account signup plus atomic host/self account/entries/idempotency orchestration and rollback in `votiy-api/src/services/registration-service.js` and `votiy-api/src/services/event-registration-service.js`
- [ ] T025 [US1] Extend account/event projections and registration resolution, activate default-category event creation, and add safe unavailable category-mutation placeholders in `votiy-api/src/services/event-service.js`, `votiy-api/src/repositories/event-repository.js`, `votiy-api/src/api/graphql/account-resolvers.js`, and `votiy-api/src/api/graphql/event-resolvers.js`
- [ ] T026 [US1] Extend account/event web operations and errors for display names and nested entry inputs in `votiy-web/src/features/auth/account.graphql.js` and `votiy-web/src/features/events/events.graphql.js`
- [ ] T027 [US1] Add gated display-name signup/participant fields and reusable entry/category controls while preserving old submissions when disabled in `votiy-web/src/features/auth/RegisterPage.jsx`, `votiy-web/src/features/events/ParticipantEntryFields.jsx`, `votiy-web/src/components/Form.jsx`, and `votiy-web/src/config/features.js`
- [ ] T028 [US1] Integrate gated entry rows, default category, atomic submission, and preserved failures into host and OPEN self-registration in `votiy-web/src/features/events/EventParticipantsPanel.jsx` and `votiy-web/src/features/events/EventPage.jsx`
- [ ] T029 [US1] Emit privacy-safe audit signals, rerun migration, enforce strict validators, add actionable stale-client reload errors, and atomically activate the combined schema plus web gate in `votiy-api/src/api/graphql/event-resolvers.js`, `votiy-api/src/repositories/audit-event-repository.js`, `votiy-api/src/repositories/indexes.js`, `votiy-api/src/server.js`, `votiy-api/src/api/graphql/schema.js`, and `votiy-web/src/config/features.js`

**Checkpoint**: User Story 1 is independently usable with seeded/default categories and passes all five test layers.

---

## Phase 4: User Story 2 - Configure Event Categories (Priority: P2)

**Goal**: Automatically create the default category and allow only the event host to add or rename unique categories.

**Independent Test**: Create `Peyton's event`, verify `Peyton's event participants`, rename it, add a second category, reject duplicate/blank/101st categories, and deny another account.

### Tests for User Story 2

- [ ] T030 [P] [US2] Write failing category-service unit tests for default naming, normalized uniqueness, limits, rename, and every ownership branch in `votiy-api/tests/unit/event-category-service.test.js`
- [ ] T031 [P] [US2] Extend failing GraphQL category mutation contract tests in `votiy-api/tests/contract/event-setup.contract.test.js`
- [ ] T032 [P] [US2] Write failing real-Mongo category create/rename concurrency and authorization tests in `votiy-api/tests/integration/event-categories.test.js`
- [ ] T033 [P] [US2] Write failing category management component tests for empty, loading, validation, duplicate, and success states in `votiy-web/tests/component/event-categories.test.jsx`
- [ ] T034 [P] [US2] Extend E2E coverage for CUF-002 and CUF-004 in `tests/e2e/event-setup.spec.js`

### Implementation for User Story 2

- [ ] T035 [US2] Project persisted default and additional categories for mutation responses in `votiy-api/src/services/event-service.js` and `votiy-api/src/repositories/event-repository.js`
- [ ] T036 [US2] Implement host-only category create/rename validation and idempotency in `votiy-api/src/services/event-category-service.js`
- [ ] T037 [US2] Implement conditional category append/rename persistence with normalized uniqueness and 100-category limit in `votiy-api/src/repositories/event-repository.js`
- [ ] T038 [US2] Add category mutations, field errors, audit events, and denied-attempt auditing in `votiy-api/src/api/graphql/event-resolvers.js` and `votiy-api/src/repositories/audit-event-repository.js`
- [ ] T039 [US2] Add web category GraphQL operations in `votiy-web/src/features/events/events.graphql.js`
- [ ] T040 [US2] Build host category list, add form, and rename form with shared field validation in `votiy-web/src/features/events/EventCategoryManager.jsx`
- [ ] T041 [US2] Integrate category management into the event Setup tab and refresh participant category choices in `votiy-web/src/features/events/OwnerEventPage.jsx`

**Checkpoint**: User Story 2 works independently on a newly created event and all unauthorized mutations fail safely.

---

## Phase 5: User Story 3 - Browse Categories and Entries (Priority: P3)

**Goal**: Make category-grouped entries with title and account display-name owner the primary event-detail content.

**Independent Test**: Load an event with populated and empty categories and verify stable grouping, one appearance per entry, correct display-name owners, privacy, and responsive rendering.

### Tests for User Story 3

- [ ] T042 [P] [US3] Write failing grouped projection tests for stable order, empty categories, display-name owners, removed-registration exclusion, and contact privacy in `votiy-api/tests/unit/event-setup-view.test.js`
- [ ] T043 [P] [US3] Extend GraphQL public-read contract tests for grouped categories and entries in `votiy-api/tests/contract/event-setup.contract.test.js`
- [ ] T044 [P] [US3] Write failing real-Mongo grouped read tests that enforce the two-second outcome at 100 categories, 1,000 participants, and 5,000 entries in `votiy-api/tests/integration/event-setup-view.test.js`
- [ ] T045 [P] [US3] Write failing responsive/accessibility component tests for setup tabs and grouped category cards in `votiy-web/tests/component/event-setup-view.test.jsx`
- [ ] T046 [P] [US3] Extend anonymous and host E2E category-grouped view coverage in `tests/e2e/event-setup.spec.js`

### Implementation for User Story 3

- [ ] T047 [US3] Implement grouped category/entry projection with account display-name owners in `votiy-api/src/services/event-service.js`
- [ ] T048 [US3] Extend public event GraphQL fields without exposing registration contact data in `votiy-api/src/api/graphql/event-resolvers.js`
- [ ] T049 [US3] Extend web event queries and normalized view models for grouped setup data in `votiy-web/src/features/events/events.graphql.js`
- [ ] T050 [US3] Build reusable setup tabs, category cards, empty states, and entry rows in `votiy-web/src/features/events/EventSetupTabs.jsx`, `votiy-web/src/features/events/EventCategoryList.jsx`, and `votiy-web/src/features/events/EventEntryRow.jsx`
- [ ] T051 [US3] Make category-grouped setup the primary content for owner and public event pages in `votiy-web/src/features/events/OwnerEventPage.jsx` and `votiy-web/src/features/events/EventPage.jsx`
- [ ] T052 [US3] Add grouped-view latency/error signals and privacy-safe diagnostic logging in `votiy-api/src/observability/logger.js` and `docs/operations.md`

**Checkpoint**: User Story 3 clearly presents voter-facing setup without leaking email or phone.

---

## Phase 6: User Story 4 - Review Participants Separately (Priority: P4)

**Goal**: Move participant administration to a secondary tab showing each participant once with total entry count.

**Independent Test**: Open Participants for a host fixture with entries across categories and verify correct totals, private access, and existing add/remove behavior.

### Tests for User Story 4

- [ ] T053 [P] [US4] Write failing participant summary and count unit tests in `votiy-api/tests/unit/event-registration-service.test.js`
- [ ] T054 [P] [US4] Extend host-only participant list contract tests with entry counts in `votiy-api/tests/contract/event-setup.contract.test.js`
- [ ] T055 [P] [US4] Write failing participant-tab component tests for counts, navigation, loading, empty, and error states in `votiy-web/tests/component/event-participants-tab.test.jsx`
- [ ] T056 [P] [US4] Extend CUF-003 E2E coverage in `tests/e2e/event-setup.spec.js`

### Implementation for User Story 4

- [ ] T057 [US4] Project entry counts and enforce host-only participant list access in `votiy-api/src/services/event-registration-service.js` and `votiy-api/src/api/graphql/event-resolvers.js`
- [ ] T058 [US4] Add participant summary fields to web queries in `votiy-web/src/features/events/events.graphql.js`
- [ ] T059 [US4] Move participant administration into a lazy secondary tab and display entry counts in `votiy-web/src/features/events/OwnerEventPage.jsx` and `votiy-web/src/features/events/EventParticipantsPanel.jsx`

**Checkpoint**: Participant administration is secondary, count-correct, and owner-only.

---

## Phase 7: Polish and Cross-Cutting Quality

**Purpose**: Close quality, delivery, migration, observability, and documentation requirements across all stories.

- [ ] T060 [P] Close decision-path and 80% line/branch coverage gaps in `votiy-api/tests/unit/`, `votiy-api/tests/contract/`, and `votiy-web/tests/component/`
- [ ] T061 [P] Add production migration/setup read smoke checks and exact-commit diagnostics in `tests/smoke/production-smoke.js` and `.github/workflows/ci.yml`
- [ ] T062 [P] Document setup SLI queries, 5% mutation-error alert, migration alert, privacy checks, and rollback steps in `docs/operations.md`
- [ ] T063 Validate keyboard, focus, labels, error announcements, and mobile layouts in `tests/e2e/responsive-accessibility.spec.js`
- [ ] T064 Validate stale-client reload diagnostics, remove display-name/contact/title logging, and verify audit event allowlists in `votiy-api/src/observability/logger.js` and `votiy-api/src/repositories/audit-event-repository.js`
- [ ] T065 Execute every scenario and quality gate in `specs/002-event-categories-entries/quickstart.md` and record any deviations in `specs/002-event-categories-entries/checklists/requirements.md`

---

## Dependencies and Execution Order

### Phase dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Setup and blocks every story.
- **US1 (Phase 3)**: Depends on Foundation; provides the MVP participant-entry write flow using seeded/default categories.
- **US2 (Phase 4)**: Depends on Foundation; event creation integration also supports US1's default category.
- **US3 (Phase 5)**: Depends on US1 data projections and US2 category lifecycle for complete production behavior.
- **US4 (Phase 6)**: Depends on US1 entries for meaningful counts and US3 tab shell for final placement.
- **Polish (Phase 7)**: Depends on all selected stories.

### User story dependency graph

```text
Foundation ─┬─> US1 Register with entries ─┬─> US3 Grouped setup view ─> US4 Participant tab
            └─> US2 Configure categories ─┘
```

US1 and US2 can be developed in parallel after Foundation using seeded categories in US1 tests. US3 integrates both; US4 completes the secondary flow.

### Within each story

- Write the story's tests first and confirm they fail for the intended behavior.
- Implement domain and repository behavior before services.
- Implement services before GraphQL resolvers and UI operations.
- Complete observability and authorization before declaring the checkpoint complete.

## Parallel Opportunities

- T004 and T005 can proceed independently after T003 establishes the contract source.
- T006–T008 target different test layers/files and can proceed in parallel.
- Within each story, unit, contract, integration, component, and E2E test scaffolds marked `[P]` can proceed in parallel.
- US1 and US2 can proceed in parallel after T015; coordinate shared repository/resolver files before merging.
- T060–T062 cover independent quality, delivery, and operations surfaces.

## Parallel Example: User Story 1

```text
Task T016: Domain/service unit tests in votiy-api/tests/unit/event-registration-service.test.js
Task T017: GraphQL contract tests in votiy-api/tests/contract/event-setup.contract.test.js
Task T018: Transaction integration tests in votiy-api/tests/integration/participant-entries.test.js
Task T019: React component tests in votiy-web/tests/component/participant-entries.test.jsx
Task T020: Critical-flow E2E tests in tests/e2e/event-setup.spec.js
```

## Implementation Strategy

### MVP first

1. Complete Setup and Foundation.
2. Complete US1 with default/seeded category support.
3. Validate atomic participant registration with multiple entries.
4. Add US2 before broad production use so hosts can manage categories.

### Incremental delivery

1. Foundation establishes safe migration and transactions.
2. US1 makes entries first-class during registration.
3. US2 makes categories configurable.
4. US3 shifts event details to category-grouped entries.
5. US4 moves participants to the secondary tab.
6. Polish closes deployment, accessibility, performance, and observability gates.

## Notes

- `[P]` tasks modify different files or independent test layers.
- `[US#]` labels map directly to prioritized specification stories.
- Every task includes an exact file path and follows the required checkbox format.
- Work directly on `main`; keep every intermediate implementation commit deployable, run task-specific validation, then commit and push each implementation task before beginning the next.
- Keep intentionally failing test-first tasks local and pair them with the first implementation task that makes them pass; never push a red test commit to `main`.
