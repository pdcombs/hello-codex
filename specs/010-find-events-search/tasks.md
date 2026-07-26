# Tasks: Find Events Search

**Input**: Design documents from `/specs/010-find-events-search/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by specification, plan, constitution, and critical user flows. Tests precede related
implementation and cover unit, contract, real-Mongo integration, component, E2E, accessibility, production
smoke, privacy, and repository-wide coverage.

**Organization**: Tasks are grouped by independently testable user story.

## Phase 1: Setup

**Purpose**: Create deterministic fixtures and shared test inputs without runtime behavior changes.

- [X] T001 [P] Create public/private/unlisted/archived events, normalized query, substring gram, cursor, access, and service fixtures in `votiy-api/tests/support/event-search-fixtures.js`
- [X] T002 [P] Create anonymous/authenticated dialog, result-page, stale-response, failure, and viewport fixtures in `votiy-web/tests/support/event-search.js`
- [X] T003 [P] Create public/private/unlisted/archived events, overlapping search, 21-result pagination, private-summary, visibility-settings, and public-route browser fixtures in `tests/e2e/fixtures/find-events-search.js`

---

## Phase 2: Foundational

**Purpose**: Add search projection, schema evolution, contracts, and reusable state foundations blocking all
stories.

**CRITICAL**: Complete before user-story implementation.

### Tests

- [X] T004 [P] Add normalization, 2/3-gram generation, middle-word verification, stop-word-only idle behavior, diacritic, minimum-length, relevance, cursor-signing, tamper, and query-binding unit tests in `votiy-api/tests/unit/event-search.test.js`
- [X] T005 [P] Add strict schema-version-4 visibility/search projection, public-active defaults, maximum-source-field, idempotent batch migration, resume, search-index, and readiness-failure integration tests in `votiy-api/tests/integration/event-search-migration.test.js`
- [X] T006 [P] Add additive GraphQL schema parse, query argument/default, union, public projection, and backward-compatibility contract tests in `votiy-api/tests/contract/event-search.contract.test.js`
- [X] T007 [P] Add search reducer tests for closed, idle, debounce, initial load, stale response, results, empty, loading-more, complete, and retry states in `votiy-web/tests/component/event-search-state.test.js`

### Implementation

- [X] T008 Implement normalized field strings, 2/3-gram projections, complete substring verification, relevance scoring, query digest, and signed cursor lifecycle in `votiy-api/src/domain/event-search.js`
- [X] T009 Extend event creation to schema version 4 with public/active defaults, null archive metadata, and atomic search projections in `votiy-api/src/domain/event.js` and `votiy-api/src/services/event-service.js`
- [X] T010 Add version-4 visibility/lifecycle/search validator and `event_search_eligibility_grams` index while preserving version-3 migration compatibility in `votiy-api/src/repositories/indexes.js`
- [X] T011 Implement resumable idempotent visibility/search migration, register startup order, and fail readiness when migration/index is unavailable in `votiy-api/src/migrations/006-event-search.js`, `votiy-api/src/server.js`, and `votiy-api/src/api/health.js`
- [X] T012 Load Feature 010 additive schema extension into executable schema in `votiy-api/src/api/graphql/schema.js`
- [X] T013 Implement reusable search state reducer, request sequencing, debounce ownership, and page deduplication in `votiy-web/src/features/search/event-search-state.js`

**Checkpoint**: Existing events migrate safely; new events carry searchable projections; schema and client
state foundations pass without exposing search UI.

---

## Phase 3: User Story 5 - Host Controls Event Visibility (Priority: P1)

**Goal**: Host controls public/private/unlisted visibility and irreversible archival; server enforces search
eligibility, private summaries, archived host-only reads, and archived mutation denial.

**Independent Test**: Change visibility across active states, compare host/non-host projections, archive with
confirmation, and verify public/private search inclusion, unlisted/archived exclusion, direct unlisted
access, private redaction, archived read-only access, and mutation denial.

### Tests for User Story 5

- [X] T014 [P] [US5] Add visibility transition, archive confirmation, irreversibility, viewer-aware detail-access, audit-event payload/cardinality, and archived mutation-policy unit tests in `votiy-api/tests/unit/event-visibility.test.js`
- [X] T015 [P] [US5] Add GraphQL contracts for visibility/lifecycle/detail-access fields, host mutations, additive viewer-aware Event/PrivateEventSummary result union, optimistic concurrency, and backward compatibility in `votiy-api/tests/contract/event-visibility.contract.test.js`
- [X] T016 [P] [US5] Add real-Mongo host/non-host visibility transitions, search eligibility, unlisted direct access, read-time private-summary projection, host full view from every navigation source, archive access, race, immutable success/denial audit events, and archived mutation-denial tests in `votiy-api/tests/integration/event-visibility.test.js`
- [X] T017 [P] [US5] Add settings/private-summary component tests for visibility controls, archive confirmation, private notice/navigation, protected-detail absence, host full access, and archived read-only state in `votiy-web/tests/component/event-visibility.test.jsx`
- [X] T018 [P] [US5] Automate CUF-005 private summary, visibility changes, unlisted direct access, irreversible archive, non-host denial, and archived read-only UI on desktop/mobile in `tests/e2e/event-visibility.spec.js`

### Implementation for User Story 5

- [X] T019 [US5] Implement visibility/lifecycle validation, allowed transitions, viewer-aware read-time private-summary projection, archived read-only projection, privacy-safe audit payload construction, and mutation guard policy in `votiy-api/src/domain/event-visibility.js`
- [X] T020 [US5] Add owner-constrained visibility update, irreversible archive, lifecycle-aware direct read, and centralized discoverability filters in `votiy-api/src/repositories/event-repository.js`
- [X] T021 [US5] Implement host authorization, optimistic concurrency, viewer-aware projection access, archival confirmation, not-found disclosure, exactly-once immutable audit/domain events for successful and denied visibility/archive attempts, and shared archived-event mutation denial across `votiy-api/src/services/event-visibility-service.js`, `votiy-api/src/services/event-service.js`, `votiy-api/src/services/event-category-service.js`, `votiy-api/src/services/event-entry-service.js`, `votiy-api/src/services/event-photo-service.js`, `votiy-api/src/services/event-registration-service.js`, `votiy-api/src/services/event-voting-rules-service.js`, and `votiy-api/src/services/event-voting-service.js`
- [X] T022 [US5] Wire visibility/archive mutations and viewer-aware `EventDetailViewResult` reads into GraphQL resolver composition so hosts always receive Event and non-host private viewers receive PrivateEventSummary in `votiy-api/src/api/graphql/event-resolvers.js` and `votiy-api/src/server.js`
- [X] T023 [US5] Add visibility/archive GraphQL operations plus host controls, archive confirmation, archived read-only presentation, and field-error handling in `votiy-web/src/features/events/events.graphql.js` and `votiy-web/src/features/events/EventSettingsPage.jsx`
- [X] T024 [US5] Add private-event notice/navigation, suppress protected details/voting for non-hosts, and disable all owner edit/add/remove/voting actions in archived read-only workspaces while preserving active host full view in `votiy-web/src/features/search/PrivateEventNotice.jsx`, `votiy-web/src/features/events/EventPage.jsx`, `votiy-web/src/features/events/OwnerEventPage.jsx`, `votiy-web/src/features/events/EventWorkspaceLayout.jsx`, `votiy-web/src/features/events/EventCategoryList.jsx`, and `votiy-web/src/features/events/EventParticipantsPanel.jsx`

**Checkpoint**: US5 independently establishes visibility/lifecycle authority required by safe discovery.

---

## Phase 4: User Story 1 - Discover Public and Private Events (Priority: P1)

**Goal**: Signed-in and signed-out visitors find active public/private events using middle-of-word title,
description, or location terms while unlisted/archived events remain excluded.

**Independent Test**: Search deterministic fixtures by partial terms in each field under anonymous and
authenticated sessions; verify public/private inclusion, unlisted/archived exclusion, and minimal result
projection.

### Tests for User Story 1

- [X] T025 [P] [US1] Add repository/service unit tests for all-term matching, title/location/description ranking, empty input, limits, projection minimization, eligibility, validation errors, and failure mapping in `votiy-api/tests/unit/event-search-service.test.js`
- [X] T026 [P] [US1] Add anonymous GraphQL contract tests for substring matches, minimal search fields, private location omission, empty success, invalid query, and correlation-bearing errors in `votiy-api/tests/contract/event-search-query.contract.test.js`
- [X] T027 [P] [US1] Add real-Mongo integration tests for middle-of-word title/description/location substrings, gram collision verification, case/diacritics/punctuation, cross-field terms, stop words, duplicate suppression, visibility/lifecycle eligibility, ranking, and anonymous access in `votiy-api/tests/integration/event-search.test.js`
- [X] T028 [P] [US1] Add header and dialog component tests for anonymous/authenticated trigger, accessible icon name, one-dialog invariant, initial focus, focus trap, Close/Escape/backdrop dismissal, focus restoration, idle/loading/empty/error/retry states, and stale response rejection in `votiy-web/tests/component/event-search-dialog.test.jsx`
- [X] T029 [P] [US1] Automate CUF-001/CUF-003 anonymous/authenticated middle-word title/description/location discovery, public/private inclusion, unlisted/archived exclusion, private summary, first-result page under 1 second, and complete journey under 30 seconds on desktop/mobile in `tests/e2e/find-events-search.spec.js`

### Implementation for User Story 1

- [X] T030 [US1] Add indexed public event search aggregation with eligibility predicate, relevance projection, stable ordering, minimal fields, and `first + 1` continuation detection in `votiy-api/src/repositories/event-repository.js`
- [X] T031 [US1] Implement input validation, empty-query behavior, cursor verification, public result mapping, and result-page service contract in `votiy-api/src/services/event-search-service.js`
- [X] T032 [US1] Wire `searchPublicEvents` resolver into service composition without requiring a viewer session in `votiy-api/src/api/graphql/event-resolvers.js` and `votiy-api/src/server.js`
- [X] T033 [P] [US1] Add GraphQL operation, public result normalization, abort support, and error unwrapping in `votiy-web/src/features/search/event-search.graphql.js`
- [X] T034 [US1] Compose debounce, latest-request ownership, retry, reset, and initial-page loading into reusable hook in `votiy-web/src/features/search/useEventSearch.js`
- [X] T035 [P] [US1] Build accessible search icon trigger matching supplied visual reference without adding icon dependency in `votiy-web/src/features/search/EventSearchButton.jsx`
- [X] T036 [US1] Build full-viewport dialog, prominent search field, result/empty/error states, dismissal, focus trap, and status announcements in `votiy-web/src/features/search/EventSearchDialog.jsx`
- [X] T037 [US1] Mount one Find Events controller in shared header for signed-in and signed-out layouts in `votiy-web/src/app/AppRouter.jsx`
- [X] T038 [US1] Add header icon, full-screen overlay, search field, result cards, loading/error/empty states, 320px, short-viewport, 200%-zoom, safe-area, and reduced-motion styles in `votiy-web/src/App.css`
- [X] T039 [US1] Emit privacy-safe `event.search.completed` success/failure logs with correlation, duration, term count, page size, result count, and has-more data in `votiy-api/src/observability/logger.js` and `votiy-api/src/services/event-search-service.js`

**Checkpoint**: US1 independently provides accessible eligible-event discovery; MVP completes after US3
navigation.

---

## Phase 5: User Story 3 - Open Event Details (Priority: P1) MVP

**Goal**: Selecting any result opens viewer-aware event details; an authenticated host receives the host
view and other visitors receive public or private-summary views.

**Independent Test**: Select a known result signed out, signed in as non-owner, and signed in as owner;
verify the server-selected projection for each viewer.

### Tests for User Story 3

- [X] T040 [P] [US3] Add routing component tests for result selection, overlay closure, encoded public ID, authenticated host full rendering from search, non-host private summary, direct links, unavailable event, and unchanged owner-aware route in `votiy-web/tests/component/event-search-routing.test.jsx`
- [X] T041 [P] [US3] Automate CUF-001 result navigation for anonymous, authenticated non-owner, and host sessions plus host full view, private-summary, and unavailable-result behavior in `tests/e2e/find-events-search.spec.js`

### Implementation for User Story 3

- [X] T042 [US3] Reuse `/events/:publicId` for search results and render the server-selected Event or PrivateEventSummary projection without allowing route state to influence authorization in `votiy-web/src/app/AppRouter.jsx`
- [X] T043 [US3] Close dialog and navigate selected result through the normal viewer-aware event route with encoded public ID in `votiy-web/src/features/search/EventSearchDialog.jsx` and `votiy-web/src/features/search/EventSearchResults.jsx`
- [X] T044 [US3] Ensure event page renders host, public, or private-summary controls from the server-selected projection and preserves existing unavailable handling in `votiy-web/src/features/events/EventPage.jsx`

**Checkpoint**: US3 independently completes discovery-to-public-details journey.

---

## Phase 6: User Story 2 - Browse More Results (Priority: P2)

**Goal**: Visitor receives stable additional result pages through infinite scroll without duplicates or
stale-query contamination.

**Independent Test**: Search 21+ matching fixtures, load subsequent pages automatically and by keyboard
fallback, and verify stable unique order until completion.

### Tests for User Story 2

- [X] T045 [P] [US2] Add signed-cursor integration tests for score/date/id ties, query mismatch, tampering, page boundaries, concurrent event updates, duplicate prevention, and terminal cursor in `votiy-api/tests/integration/event-search-pagination.test.js`
- [X] T046 [P] [US2] Add result-list component tests for sentinel observation, one-request guard, existing-result preservation, appended-count announcement, retry-more, fallback button, query reset, and end state in `votiy-web/tests/component/event-search-results.test.jsx`
- [X] T047 [P] [US2] Automate CUF-002 two-page infinite scroll, result selection, keyboard Load More fallback, failure retry, and rapid-query race on desktop/mobile in `tests/e2e/find-events-search.spec.js`

### Implementation for User Story 2

- [X] T048 [US2] Add score/date/id cursor boundary filtering and query-bound next-cursor creation to search repository/service in `votiy-api/src/repositories/event-repository.js` and `votiy-api/src/services/event-search-service.js`
- [X] T049 [US2] Build unique append-only result list with `IntersectionObserver` sentinel, guarded automatic load, keyboard fallback, retry-more, and terminal state in `votiy-web/src/features/search/EventSearchResults.jsx`
- [X] T050 [US2] Integrate paginated result component and preserve loaded nodes during later-page loading/failure in `votiy-web/src/features/search/EventSearchDialog.jsx` and `votiy-web/src/features/search/useEventSearch.js`

**Checkpoint**: US2 independently proves stable infinite result browsing.

---

## Phase 7: User Story 4 - Learn What to Search For (Priority: P4)

**Goal**: Empty search field rotates supplied event/location examples every 2–3 seconds without changing
visitor input.

**Independent Test**: Open blank search, advance time through all examples, type text, and verify rotation
never changes input or causes distracting motion.

### Tests for User Story 4

- [X] T051 [P] [US4] Add fake-timer component tests for exact placeholder order, 2.5-second cadence, empty-only rotation, typed-value safety, close reset, cleanup, and reduced-motion behavior in `votiy-web/tests/component/event-search-placeholder.test.jsx`
- [X] T052 [P] [US4] Automate placeholder cycle, typing interruption, reopening reset, and reduced-motion behavior in `tests/e2e/find-events-search.spec.js`

### Implementation for User Story 4

- [X] T053 [US4] Implement reusable empty-field placeholder cycle with interval cleanup and reduced-motion-compatible presentation in `votiy-web/src/features/search/useSearchPlaceholder.js`
- [X] T054 [US4] Integrate exact supplied examples into search field without mutating value or search state in `votiy-web/src/features/search/EventSearchDialog.jsx`

**Checkpoint**: All five stories independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Close performance, privacy, accessibility, compatibility, delivery, and operational gates.

- [X] T055 [P] Add 10,000-event query-plan test enforcing search index use and first-page p95 below 1 second in `votiy-api/tests/integration/event-search-performance.test.js`
- [X] T056 [P] Add privacy-log tests proving raw/normalized queries, event fields, and visitor identifiers never reach diagnostics in `votiy-api/tests/integration/event-search-observability.test.js`
- [X] T057 [P] Extend responsive/accessibility E2E coverage for 320px, short landscape, 200% zoom, keyboard focus trap, status announcements, safe areas, and reduced motion in `tests/e2e/responsive-accessibility.spec.js`
- [X] T058 [P] Extend compatibility regressions for existing header navigation, authentication, owner routes, unlisted direct links, event setup, participants, settings, voting, registration, and photos in `votiy-web/tests/component/accessibility.test.jsx` and `tests/e2e/event-details-navigation.spec.js`
- [X] T059 Extend production smoke with anonymous public/private search, unlisted/archived exclusion, private projection minimization, cursor replay, viewer-aware event route, archived mutation denial, and existing critical-flow checks in `tests/smoke/production-smoke.js`
- [X] T060 Document host/visitor discovery workflow and local validation commands in `README.md`
- [X] T061 Document search diagnostics, privacy-safe queries, first-page p95/error alerts, index/readiness checks, and rollback steps in `docs/operations.md`
- [X] T062 Add Feature 010 unit, contract, real-Mongo integration, migration, component, E2E, accessibility, coverage, and smoke gates to `.github/workflows/ci.yml`
- [X] T063 Run all scenarios from `specs/010-find-events-search/quickstart.md` and record evidence in `specs/010-find-events-search/checklists/validation.md`
- [X] T064 Verify API and web line/branch coverage remain at least 80% and all normalization, eligibility, cursor, stale-response, retry, accessibility, and privacy decision paths execute in `votiy-api/vitest.config.js` and `votiy-web/vitest.config.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: Starts immediately.
- **Foundational**: Depends on Setup and blocks all stories.
- **US5**: Depends on Foundation; establishes visibility/lifecycle and blocks safe search.
- **US1**: Depends on US5; delivers search.
- **US3**: Depends on US1 result selection and completes MVP navigation.
- **US2**: Depends on US1 query/results contracts; may follow MVP or proceed alongside US3.
- **US4**: Depends on US1 dialog; can proceed alongside US2/US3.
- **Polish**: Depends on selected stories.

### User Story Dependency Graph

```text
Setup -> Foundation -> US5 -> US1 -> US2
                                |-> US3
                                \-> US4
US5 + US1 + US2 + US3 + US4 -> Polish
```

### Within Each Story

- Write story tests first and confirm meaningful failure.
- Domain projection precedes repository; repository precedes service; service precedes resolver.
- Search state precedes dialog composition.
- API remains authoritative for eligibility, ranking, pagination, and public projection.
- Complete independent story checkpoint before next sequential priority.
- Commit/push only when user requests.

## Parallel Opportunities

- T001–T003 fixtures target separate layers.
- T004–T007 foundational tests target separate files.
- T014–T018 US5 tests can run in parallel after Foundation.
- T025–T029 US1 tests can run in parallel after US5.
- T033 and T035 implement independent US1 web boundaries.
- T040–T041, T045–T047, and T051–T052 target independent story tests.
- US2, US3, and US4 may run in parallel after US1.
- T055–T058 documentation-independent validation work can run in parallel.

## Parallel Examples

### User Story 1

```text
T025 service unit tests
T026 GraphQL contract tests
T027 real-Mongo search tests
T028 dialog component tests
T029 desktop/mobile E2E
```

### After User Story 1

```text
US3: explicit public route and navigation
US2: cursor pagination and infinite results
US4: rotating empty-field examples
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Complete US5 visibility/lifecycle.
3. Complete US1 search.
4. Complete US3 public/private result navigation.
5. Validate CUF-001, CUF-003, CUF-005, data minimization, accessibility, and latency.
6. Stop for MVP review before pagination and placeholder polish if desired.

### Incremental Delivery

1. Add visibility/lifecycle authority and migration.
2. Add indexed substring search projection and anonymous query.
3. Add shared header dialog and first-page discovery.
4. Add viewer-aware public/private-result navigation and redaction.
5. Add stable infinite pagination.
6. Add placeholder education.
7. Close performance, privacy, accessibility, compatibility, CI, smoke, and coverage gates.

## Format Validation

All 64 executable tasks use required checkbox, sequential task ID, optional `[P]`, required story label in
story phases, actionable description, and exact file path.
