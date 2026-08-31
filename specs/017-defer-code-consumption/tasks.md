# Tasks: Defer Voting Code Consumption

## Phase 1: Setup

- [x] T001 Verify current code lifecycle and migration registration points in votiy-api/src/services/event-voting-service.js and votiy-api/src/server.js

## Phase 2: Foundational

- [x] T002 [P] Add repository contract tests for deferred validation and ballot-bound consumption in votiy-api/tests/contract/event-voting-repositories.contract.test.js
- [x] T003 [P] Add migration reconciliation tests in votiy-api/tests/integration/voting-code-reconciliation.test.js

## Phase 3: User Story 1 - Enter Code Without Consuming It (P1)

**Goal**: Validating or abandoning code access never marks code used.

**Independent Test**: Validate same code repeatedly without submission and confirm access allowed plus inventory unused.

- [x] T004 [US1] Update access-decision unit tests to require pending grant without consumption in votiy-api/tests/unit/voting-access-decision.test.js
- [x] T005 [US1] Remove early code consumption and emit validation audit semantics in votiy-api/src/services/event-voting-service.js
- [x] T006 [US1] Add abandon-and-reuse integration coverage in votiy-api/tests/integration/voting-code-claim.test.js

## Phase 4: User Story 2 - Consume Code With Accepted Ballot (P1)

**Goal**: Ballot acceptance and one-code consumption succeed atomically with safe concurrency and retries.

**Independent Test**: Concurrently submit two ballots from validated access; exactly one ballot/code relationship wins and failure rollback leaves code unused.

- [x] T007 [US2] Make repository consumption require ballot identity and preserve unused-state precondition in votiy-api/src/repositories/voting-access-code-repository.js
- [x] T008 [US2] Revalidate pending code and atomically consume it during submission in votiy-api/src/services/event-voting-service.js
- [x] T009 [US2] Verify ballot validation and pending-access decisions in votiy-api/tests/unit/ballot-submission.test.js and votiy-api/tests/unit/voting-access-decision.test.js
- [x] T010 [US2] Expand MongoDB integration tests for pending grants, concurrency, audit rollback, and inventory truth in votiy-api/tests/integration/voting-code-claim.test.js

## Phase 5: User Story 3 - Recover Stranded Codes (P2)

**Goal**: Restore orphaned early claims while preserving and linking ballot-backed codes.

**Independent Test**: Reconcile mixed legacy records twice; results stay correct and repeat execution makes no extra changes.

- [x] T011 [US3] Implement idempotent legacy reconciliation in votiy-api/src/migrations/008-reconcile-voting-code-ballots.js
- [x] T012 [US3] Register reconciliation in application startup in votiy-api/src/server.js
- [x] T013 [US3] Add MongoDB reconciliation integration coverage in votiy-api/tests/integration/voting-code-reconciliation.test.js

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T014 [P] Verify privacy-safe structured lifecycle logging in votiy-api/tests/integration/event-voting-observability.test.js
- [x] T015 Run API unit, contract, and integration suites plus web tests and production build using specs/017-defer-code-consumption/quickstart.md
- [x] T016 Update task completion state and verify spec acceptance scenarios in specs/017-defer-code-consumption/tasks.md

## Dependencies

- T001 precedes implementation work.
- T002-T003 define foundational contracts and may run together.
- US1 precedes US2 because submission consumes pending access created by US1.
- US3 depends on final code/ballot invariants from US2.
- Polish follows all stories.

## Parallel Opportunities

- T002 and T003 touch separate test files.
- T014 can proceed after lifecycle event names stabilize while reconciliation tests finish.

## Implementation Strategy

1. Deliver US1 access behavior first.
2. Complete US2 atomic integrity before considering feature usable.
3. Add US3 compatibility repair before deployment.
4. Run all quality gates, then commit and push one complete change.
