# Tasks: Review Voting Results

## Phase 1: Setup

- [x] T001 Verify existing results route, ballot snapshots, and GraphQL extension loading in votiy-web/src/features/events/OwnerEventResultsPage.jsx and votiy-api/src/api/graphql/schema.js

## Phase 2: Foundational

- [x] T002 [P] Add results GraphQL extension in specs/018-review-voting-results/contracts/schema-extension.graphql and votiy-api/src/api/graphql/schema.js
- [x] T003 [P] Add event-wide ballot and entry repository reads in votiy-api/src/repositories/ballot-submission-repository.js and votiy-api/src/repositories/event-entry-repository.js

## Phase 3: User Story 1 - Review Vote Totals (P1)

**Goal**: Host sees current accepted-ballot count and every category; non-host sees nothing.

**Independent Test**: Host and non-host query same event; only host receives exact ballot count and category structure.

- [x] T004 [US1] Add host authorization, zero-result projection, audit, and logging tests in votiy-api/tests/unit/event-results-service.test.js
- [x] T005 [US1] Implement host-only result orchestration in votiy-api/src/services/event-results-service.js
- [x] T006 [US1] Wire results query through votiy-api/src/api/graphql/event-resolvers.js and votiy-api/src/server.js
- [x] T007 [US1] Add GraphQL result contract tests in votiy-api/tests/contract/event-results.contract.test.js
- [x] T008 [US1] Add authenticated MongoDB results integration tests in votiy-api/tests/integration/event-results.test.js

## Phase 4: User Story 2 - Review Choice Results (P1)

**Goal**: Single and multiple categories show exact sorted totals and co-winners.

**Independent Test**: Known choice ballots produce exact counts, deterministic order, zero entries, and winner flags.

- [x] T009 [US2] Add exhaustive choice tally tests in votiy-api/tests/unit/voting-results.test.js
- [x] T010 [US2] Implement choice aggregation, ordering, and winner rules in votiy-api/src/domain/voting-results.js

## Phase 5: User Story 3 - Review Ranked Results (P1)

**Goal**: Ranked categories aggregate N-P scores and highlight leaders.

**Independent Test**: Known five-entry rankings produce exact 4-to-0 scores across multiple ballots, including ties and sole-entry case.

- [x] T011 [US3] Add ranking, historical label, and edge-case tests in votiy-api/tests/unit/voting-results.test.js
- [x] T012 [US3] Implement ranked scoring and historical snapshot fallback in votiy-api/src/domain/voting-results.js

## Phase 6: Results UI

- [x] T013 [P] Add results client query and loader in votiy-web/src/features/voting/voting.graphql.js
- [x] T014 [P] Add results page component tests in votiy-web/tests/component/owner-event-results-page.test.jsx
- [x] T015 Replace placeholder with ballot count, category sections, ordered entries, winner states, and retry flow in votiy-web/src/features/events/OwnerEventResultsPage.jsx
- [x] T016 Rename workspace tab and add responsive result styling in votiy-web/src/features/events/EventWorkspaceTabs.jsx and votiy-web/src/App.css
- [x] T017 Add host and non-host critical flow coverage in tests/e2e/event-results.spec.js

## Phase 7: Polish

- [x] T018 Verify privacy-safe result audit/log coverage in votiy-api/tests/integration/event-voting-observability.test.js
- [x] T019 Run all quickstart validation commands from specs/018-review-voting-results/quickstart.md
- [x] T020 Mark tasks complete and verify all Feature 018 acceptance scenarios in specs/018-review-voting-results/tasks.md

## Dependencies

- T001 precedes all work.
- T002-T003 may run together, then unblock service and contract work.
- US1 service boundary precedes UI integration.
- US2 and US3 share calculator file and run sequentially.
- UI follows stable GraphQL contract.
- Polish follows all stories.

## Parallel Opportunities

- T002 and T003 use separate files.
- T013 and T014 can start after contract stabilizes.

## Implementation Strategy

1. Establish secure host-only result contract.
2. Build and exhaustively test deterministic choice/rank calculator.
3. Replace existing placeholder route with responsive aggregate view.
4. Validate full stack, commit, push.
