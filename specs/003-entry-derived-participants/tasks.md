---

description: "Implementation tasks for entry-derived participants"
---

# Tasks: Entry-Derived Participants

**Input**: Design documents from `/specs/003-entry-derived-participants/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/schema.graphql`, `quickstart.md`

**Tests**: Required at unit, contract, integration, component, E2E, coverage, migration, privacy, and post-deploy smoke layers under the Votiy constitution.

**Organization**: Tasks are grouped by prioritized user story and use test-first implementation while keeping every pushed `main` commit deployable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Stage the v3 contract, compatibility controls, and reusable fixtures without changing production behavior.

- [ ] T001 Add a disabled-by-default entry-derived participant activation gate and document coordinated activation in `votiy-api/src/config/env.js`, `votiy-web/src/config/features.js`, and `docs/operations.md`
- [ ] T002 [P] Add standalone active/archived entry and participant-projection fixtures in `votiy-api/tests/support/entry-derived-participants.js`
- [ ] T003 [P] Add reusable participant-card and archive browser fixtures in `tests/e2e/fixtures/entry-derived-participants.js`
- [ ] T004 Stage and syntax-test the v3 GraphQL contract without switching the runtime schema in `specs/003-entry-derived-participants/contracts/schema.graphql` and `votiy-api/tests/contract/schema.contract.test.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish standalone archival entries, validators, indexes, repositories, migration 003, and dual-compatible readiness before story behavior changes.

**⚠️ CRITICAL**: No user-story implementation begins until this phase passes.

- [ ] T005 [P] Write failing entry lifecycle unit tests for active/archive invariants, immutable ownership/category data, reasons, and privacy-safe projections in `votiy-api/tests/unit/event-entry-lifecycle.test.js`
- [ ] T006 [P] Write failing persistence contract tests for `eventEntries` validation, archival fields, no TTL, and all query indexes in `votiy-api/tests/contract/event-entry-persistence.contract.test.js`
- [ ] T007 [P] Write failing migration integration tests covering active/removed registrations, preserved IDs/references, invalid references, checkpoints, mismatches, and idempotent restart in `votiy-api/tests/integration/entry-derived-participant-migration.test.js`
- [ ] T008 Extend the Entry domain with standalone active/archive document construction and state transitions in `votiy-api/src/domain/event-entry.js`
- [ ] T009 Add strict `eventEntries` collection validation and event/category/owner indexes without changing legacy registration validators in `votiy-api/src/repositories/indexes.js`
- [ ] T010 Implement standalone entry lookup, insertion, grouping, conditional archive, and transactional batch archive persistence in `votiy-api/src/repositories/event-entry-repository.js`
- [ ] T011 Register the entry repository and transaction dependencies without activating application reads or writes in `votiy-api/src/server.js`
- [ ] T012 Implement checkpointed idempotent migration 003 from every active/removed embedded registration entry into standalone entries in `votiy-api/src/migrations/003-entry-derived-participants.js`
- [ ] T013 Run migration 003 before readiness, verify counts/references, and retain registration data for compatibility rollback in `votiy-api/src/server.js` and `votiy-api/src/api/health.js`
- [ ] T014 Add privacy-safe migration metrics, mismatch diagnostics, and readiness tests in `votiy-api/src/observability/logger.js` and `votiy-api/tests/integration/entry-derived-participant-migration.test.js`

**Checkpoint**: Standalone entries mirror all legacy embedded entries, rerun safely, and remain dormant until story activation.

---

## Phase 3: User Story 1 - Derive Participants from Entries (Priority: P1) 🎯 MVP

**Goal**: Make active standalone entry ownership the only source of event participation and stop creating or reviving registration membership.

**Independent Test**: Create active entries for accounts across events, verify the distinct active owners are the exact participants, archive the final active entry, and verify participation disappears while account/history remain.

### Tests for User Story 1

- [ ] T015 [P] [US1] Write failing service tests for first-entry participation, no-entry exclusion, cross-event isolation, and pre-archived final-entry exclusion in `votiy-api/tests/unit/event-entry-service.test.js`
- [ ] T016 [P] [US1] Write failing GraphQL contract tests for separate entry-creation payloads and entry-derived category projections in `votiy-api/tests/contract/entry-derived-participants.contract.test.js`
- [ ] T017 [P] [US1] Write failing real-Mongo transaction tests for host/self account-entry creation, rollback, idempotency, and no registration writes in `votiy-api/tests/integration/event-entry-creation.test.js`
- [ ] T018 [P] [US1] Write failing grouped event-view tests proving only active standalone entries populate categories and owners in `votiy-api/tests/unit/event-setup-view.test.js`
- [ ] T019 [P] [US1] Add CUF-001 E2E coverage for first entry automatically creating derived participation in `tests/e2e/entry-derived-participants.spec.js`

### Implementation for User Story 1

- [ ] T020 [US1] Add standalone entry creation and archive input validation with field-specific failures in `votiy-api/src/domain/validation.js`
- [ ] T021 [US1] Implement atomic host/self account plus standalone-entry plus idempotency orchestration without registration writes in `votiy-api/src/services/event-entry-service.js`
- [ ] T022 [US1] Project category-grouped event details exclusively from active standalone entries in `votiy-api/src/services/event-service.js`
- [ ] T023 [US1] Add entry-creation GraphQL resolver adapters and deprecated registration compatibility responses in `votiy-api/src/api/graphql/event-resolvers.js`
- [ ] T024 [US1] Update host and OPEN-event web mutations to consume standalone entry mutation results while preserving current forms in `votiy-web/src/features/events/events.graphql.js`, `votiy-web/src/features/events/EventParticipantsPanel.jsx`, and `votiy-web/src/features/events/EventPage.jsx`
- [ ] T025 [US1] Emit privacy-safe entry-created audit events and operation signals without titles/contact data in `votiy-api/src/api/graphql/event-resolvers.js`, `votiy-api/src/repositories/audit-event-repository.js`, and `votiy-api/src/observability/logger.js`

**Checkpoint**: New host/self entries create participation solely through active entry ownership; active views no longer read membership status.

---

## Phase 4: User Story 2 - Review Participant Cards (Priority: P2)

**Goal**: Give hosts one participant card per active entry owner with name, email, entry titles, and right-aligned count.

**Independent Test**: Load an event whose accounts own different active entries and verify one accurate card per owner, no card for zero-entry accounts, and a clear empty state.

### Tests for User Story 2

- [ ] T026 [P] [US2] Write failing participant projection unit tests for grouping, stable order, duplicate titles, missing email fallback, exact counts, and archived exclusion in `votiy-api/tests/unit/event-participant-projection.test.js`
- [ ] T027 [P] [US2] Write failing host-only `eventParticipants` GraphQL shape, authorization, and contact-privacy contract tests in `votiy-api/tests/contract/entry-derived-participants.contract.test.js`
- [ ] T028 [P] [US2] Write failing real-Mongo participant projection tests at 1,000 owners/5,000 entries with the two-second outcome in `votiy-api/tests/integration/event-participant-projection.test.js`
- [ ] T029 [P] [US2] Write failing accessible participant-card component tests for title, subtitle, entry list, right-aligned count, loading, empty, failure, and mobile layout in `votiy-web/tests/component/event-participant-cards.test.jsx`
- [ ] T030 [P] [US2] Add CUF-002 and CUF-005 E2E coverage for host cards and unauthorized contact denial in `tests/e2e/entry-derived-participants.spec.js`

### Implementation for User Story 2

- [ ] T031 [US2] Implement active-entry owner grouping and batched account resolution in `votiy-api/src/services/event-entry-service.js`
- [ ] T032 [US2] Add host-only `eventParticipants` resolver, projection types, and safe failure responses in `votiy-api/src/api/graphql/event-resolvers.js` and `votiy-api/src/api/graphql/schema.js`
- [ ] T033 [US2] Add participant-card query and normalization while retaining a temporary legacy-query fallback in `votiy-web/src/features/events/events.graphql.js`
- [ ] T034 [US2] Build the reusable accessible participant card and list components in `votiy-web/src/features/events/EventParticipantCard.jsx` and `votiy-web/src/features/events/EventParticipantCardList.jsx`
- [ ] T035 [US2] Replace registration rows with participant cards and host-only empty/loading/failure states in `votiy-web/src/features/events/EventParticipantsPanel.jsx`
- [ ] T036 [US2] Add responsive participant-card layout, right-aligned count, and long-title overflow handling in `votiy-web/src/App.css`
- [ ] T037 [US2] Emit participant-read latency/error/count signals without email or titles and document the diagnostic query in `votiy-api/src/observability/logger.js` and `docs/operations.md`

**Checkpoint**: The Participants tab exactly reflects distinct active entry owners and exposes email only to the event host.

---

## Phase 5: User Story 3 - Keep Entry Changes Consistent (Priority: P3)

**Goal**: Archive one entry or all entries for a participant without hard deletion, partial state, stale views, or cross-event effects.

**Independent Test**: Archive one of several entries, the final entry, and an entire participant; verify confirmation, counts/membership, category consistency, history, retries, concurrency, and other-event isolation.

### Tests for User Story 3

- [ ] T038 [P] [US3] Write failing service tests for one-entry, final-entry, and participant batch archival; ownership denial; retries; zero matches; and other-event isolation in `votiy-api/tests/unit/event-entry-service.test.js`
- [ ] T039 [P] [US3] Write failing archive-mutation contract tests for the separate archive payload, explicit inputs, archived IDs, affected participant projection, and operation errors in `votiy-api/tests/contract/entry-derived-participants.contract.test.js`
- [ ] T040 [P] [US3] Write failing real-Mongo tests for conditional archive concurrency, all-or-nothing participant archive, retained history, and audit identity in `votiy-api/tests/integration/event-entry-archive.test.js`
- [ ] T041 [P] [US3] Write failing component tests for entry/participant confirmation, success refresh, failure preservation, and affected-count messaging in `votiy-web/tests/component/event-entry-archive.test.jsx`
- [ ] T042 [P] [US3] Add CUF-003, CUF-004, and CUF-006 E2E coverage for partial, final, and participant archival in `tests/e2e/entry-derived-participants.spec.js`

### Implementation for User Story 3

- [ ] T043 [US3] Implement host-authorized idempotent one-entry and transactional participant-entry archival orchestration in `votiy-api/src/services/event-entry-service.js`
- [ ] T044 [US3] Add `archiveEventEntry` and `archiveEventParticipantEntries` resolvers with conflict and not-found behavior in `votiy-api/src/api/graphql/event-resolvers.js`
- [ ] T045 [US3] Allowlist privacy-safe `entry.archived` and `participant.entries_archived` audit events with affected IDs/count/reason in `votiy-api/src/repositories/audit-event-repository.js`
- [ ] T046 [US3] Add web archive mutations and normalized affected-participant results in `votiy-web/src/features/events/events.graphql.js`
- [ ] T047 [US3] Add owner-only accessible entry-removal confirmation controls, public-view exclusion, and category/participant refresh in `votiy-web/src/features/events/EventEntryRow.jsx`, `votiy-web/src/features/events/OwnerEventPage.jsx`, and `votiy-web/tests/component/event-setup-view.test.jsx`
- [ ] T048 [US3] Add participant-removal confirmation with affected entry count and all-or-nothing refresh behavior in `votiy-web/src/features/events/EventParticipantCard.jsx` and `votiy-web/src/features/events/EventParticipantsPanel.jsx`
- [ ] T049 [US3] Remove registration-status mutation usage from active UI/API flows and route deprecated `removeEventParticipant` compatibility calls through batch entry archival in `votiy-api/src/services/event-registration-service.js`, `votiy-api/src/api/graphql/event-resolvers.js`, and `votiy-web/src/features/events/events.graphql.js`
- [ ] T050 [US3] Atomically activate v3 runtime schema and web gate after migration catch-up while preserving cached-client reload diagnostics in `votiy-api/src/api/graphql/schema.js`, `votiy-api/src/server.js`, and `votiy-web/src/config/features.js`

**Checkpoint**: Every removal is archival, category and participant views agree, no participant state is stored, and other events remain untouched.

---

## Phase 6: Polish and Cross-Cutting Quality

**Purpose**: Close migration, compatibility, performance, accessibility, delivery, privacy, and operational quality gates.

- [ ] T051 [P] Close every archive/authorization/migration decision path and repository-wide 80% line/branch coverage gaps in `votiy-api/tests/unit/`, `votiy-api/tests/contract/`, and `votiy-web/tests/component/`
- [ ] T052 [P] Add migration-003 readiness, active-entry public read, participant-count, privacy, exact-commit, and isolated synthetic create/archive production smoke checks in `tests/smoke/production-smoke.js` and `.github/workflows/ci.yml`
- [ ] T053 [P] Document migration counts, participant-read SLI, archive error-rate and migration alerts, correlation-first diagnosis, compatibility window, and rollback in `docs/operations.md`
- [ ] T054 Validate keyboard focus, confirmation dialogs, card semantics, error announcements, long content, and mobile overflow in `tests/e2e/responsive-accessibility.spec.js`
- [ ] T055 Verify logs and audit allowlists reject entry titles, display names, email, phone, tokens, and unknown metadata in `votiy-api/tests/integration/security-and-failures.test.js` and `votiy-api/tests/unit/polish-coverage.test.js`
- [ ] T056 Run timed first-use participant-card and entry-ownership comprehension validation with at least ten testers and record anonymized aggregate outcomes in `specs/003-entry-derived-participants/checklists/requirements.md`
- [ ] T057 Execute every scenario and quality gate in `specs/003-entry-derived-participants/quickstart.md` and record deviations in `specs/003-entry-derived-participants/checklists/requirements.md`

---

## Dependencies and Execution Order

### Phase dependencies

- **Setup (Phase 1)**: Starts immediately and leaves runtime behavior unchanged.
- **Foundational (Phase 2)**: Depends on Setup and blocks all stories.
- **US1 (Phase 3)**: Depends on Foundation and establishes entry-derived participation.
- **US2 (Phase 4)**: Depends on US1's active-entry projection for accurate cards.
- **US3 (Phase 5)**: Depends on US1 lifecycle and uses US2 cards for participant removal controls.
- **Polish (Phase 6)**: Depends on all selected stories and coordinated activation.

### User story dependency graph

```text
Foundation → US1 Entry-derived membership → US2 Participant cards → US3 Archival consistency
```

US2 test/UI scaffolding can start after Foundation with fixtures, but its production service integration depends on US1. US3 tests can use repository fixtures early, but activation follows US1 and US2.

### Within each story

- Write tests first and confirm they fail for the intended behavior.
- Implement domain/repository behavior before services.
- Implement services before GraphQL and UI integration.
- Complete authorization, privacy, observability, and story validation before its checkpoint.
- Keep failing tests local and commit them with the first implementation that makes them pass.

## Parallel Opportunities

- T002 and T003 target independent API/browser fixture files.
- T005–T007 target independent test layers and can proceed in parallel.
- Each story's unit, contract, integration, component, and E2E test tasks marked `[P]` target separate files.
- T051–T053 target coverage, delivery smoke, and operations documentation independently.

## Parallel Example: User Story 2

```text
Task T026: Projection unit tests in votiy-api/tests/unit/event-participant-projection.test.js
Task T027: GraphQL contract tests in votiy-api/tests/contract/entry-derived-participants.contract.test.js
Task T028: Scale integration tests in votiy-api/tests/integration/event-participant-projection.test.js
Task T029: Participant-card component tests in votiy-web/tests/component/event-participant-cards.test.jsx
Task T030: Host/privacy E2E tests in tests/e2e/entry-derived-participants.spec.js
```

## Implementation Strategy

### MVP first

1. Complete Setup and Foundation without activating new runtime behavior.
2. Complete US1 so active entry owners become the sole participants.
3. Validate migration, compatibility, active category projections, and final-entry participation independently.
4. Keep the web activation gate disabled until US2/US3 deliver the complete host flow.

### Incremental delivery

1. Foundation safely copies entries and establishes dual-compatible storage.
2. US1 switches authoritative application logic to active entries.
3. US2 presents accurate host-only participant cards.
4. US3 completes archive controls and coordinated v3 activation.
5. Polish closes coverage, smoke, accessibility, privacy, alerts, and rollback validation.

## Notes

- `[P]` tasks modify different files or independent test layers.
- `[US#]` labels map directly to the prioritized specification stories.
- Every task includes an exact file path and follows the required checklist format.
- Work directly on `main`; keep every intermediate commit deployable and commit/push only after task-specific validation.
- Never hard delete entries, accounts, registrations, or audit history in this feature.
- Deprecated registration operations are compatibility adapters only and must not create or revive participant membership.
