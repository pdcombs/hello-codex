# Tasks: Export Voting Codes

## Phase 1: Setup

- [X] T001 Verify GraphQL schema composition, repository pagination, service ownership checks, voting-code settings component, styles, and test harnesses in `votiy-api/src/api/graphql/schema.js`, `votiy-api/src/repositories/voting-access-code-repository.js`, `votiy-api/src/services/event-voting-service.js`, `votiy-web/src/features/voting/VotingCodeManager.jsx`, and `.gitignore`

## Phase 2: Foundational Tests

- [X] T002 [P] Add failing repository/service summary, ordering, complete export, and authorization tests in `votiy-api/tests/unit/voting-code-management.test.js` and `votiy-api/tests/integration/voting-code-claim.test.js`
- [X] T003 [P] Add failing GraphQL schema/export contract tests in `votiy-api/tests/contract/event-voting-rules-contract.test.js`
- [X] T004 [P] Add failing CSV safety and code-manager UI tests in `votiy-web/tests/component/voting-code-manager.test.jsx` and `votiy-web/tests/unit/voting-code-csv.test.js`

## Phase 3: User Story 1 - Understand Code Availability (P1)

**Independent Test**: Event-wide Used and Available totals remain accurate beyond current page and refresh after generation.

- [X] T005 [US1] Add grouped event status counts in `votiy-api/src/repositories/voting-access-code-repository.js`
- [X] T006 [US1] Return inventory summary from host-authorized list service and GraphQL contract in `votiy-api/src/services/event-voting-service.js`, `votiy-api/src/api/graphql/schema.js`, and `votiy-web/src/features/voting/voting.graphql.js`
- [X] T007 [US1] Render responsive Used and Available summary in `votiy-web/src/features/voting/VotingCodeManager.jsx` and `votiy-web/src/App.css`

## Phase 4: User Story 2 - Scan and Copy Codes (P1)

**Independent Test**: Mixed inventory renders accessible table with all used rows before unused rows and mobile horizontal scrolling.

- [X] T008 [US2] Add deterministic status-first repository ordering and stable pagination in `votiy-api/src/repositories/voting-access-code-repository.js`
- [X] T009 [US2] Replace code list with accessible status table in `votiy-web/src/features/voting/VotingCodeManager.jsx` and `votiy-web/src/App.css`

## Phase 5: User Story 3 - Export Complete Code Inventory (P2)

**Independent Test**: Host downloads formula-safe Excel-compatible CSV containing every event code exactly once; non-host fails.

- [X] T010 [US3] Add host-authorized complete export service and GraphQL resolver/schema contract in `votiy-api/src/services/event-voting-service.js`, `votiy-api/src/api/graphql/event-resolvers.js`, and `votiy-api/src/api/graphql/schema.js`
- [X] T011 [US3] Add export client query and formula-safe CSV utility in `votiy-web/src/features/voting/voting.graphql.js` and `votiy-web/src/features/voting/voting-code-csv.js`
- [X] T012 [US3] Add export loading, download, and failure UI in `votiy-web/src/features/voting/VotingCodeManager.jsx`

## Phase 6: Validation

- [X] T013 Run API unit/contract/integration tests, web tests/lint/build, diff checks, and `specs/021-export-voting-codes/quickstart.md` validation

## Dependencies

- T001 precedes all work.
- T002-T004 establish failing coverage before implementation.
- T005-T007 deliver US1.
- T008-T009 deliver US2 after shared inventory query.
- T010-T012 deliver US3 after ordering is authoritative.
- T013 follows all implementation.

## Parallel Opportunities

- T002-T004 touch separate test layers.
- T007 and T008 touch separate UI/API files after summary contract exists.
- CSV unit work in T011 can proceed beside API export work in T010.

## Implementation Strategy

1. Lock contracts with tests.
2. Deliver accurate summary.
3. Deliver used-first responsive table.
4. Deliver complete safe export.
5. Run full repository validation.
