# Tasks: View Previous Vote Submissions

**Input**: Design documents from `/specs/016-previous-vote-history/`

## Phase 1: Setup and foundation

- [x] T001 Register Feature 016 schema contract in `votiy-api/src/api/graphql/schema.js`
- [x] T002 Add stable cursor helpers in `votiy-api/src/domain/ballot-history.js`
- [x] T003 Add account/browser history indexes in `votiy-api/src/repositories/indexes.js`
- [x] T004 Add paginated repository methods in `votiy-api/src/repositories/ballot-submission-repository.js`
- [x] T005 Add history audit event in `votiy-api/src/repositories/audit-event-repository.js`

## Phase 2: User Story 1 - Open Previous Votes From Code Prompt (P1)

- [x] T006 [P] [US1] Add GraphQL contract tests in `votiy-api/tests/contract/ballot-history.contract.test.js`
- [x] T007 [P] [US1] Add modal action tests in `votiy-web/tests/component/voting-access.test.jsx`
- [x] T008 [US1] Add `hasBallotHistory` decisions in `votiy-api/src/services/event-voting-service.js`
- [x] T009 [US1] Add private history resolver in `votiy-api/src/api/graphql/event-resolvers.js`
- [x] T010 [US1] Add history query client in `votiy-web/src/features/voting/voting.graphql.js`
- [x] T011 [US1] Add history action in `votiy-web/src/features/voting/VotingCodeModal.jsx`
- [x] T012 [US1] Navigate without code request in `votiy-web/src/features/voting/VotingAccessButton.jsx`

## Phase 3: User Story 2 - Review Multiple Previous Ballots (P1)

- [x] T013 [P] [US2] Add cursor unit tests in `votiy-api/tests/unit/ballot-history.test.js`
- [x] T014 [P] [US2] Add Mongo pagination tests in `votiy-api/tests/integration/ballot-history.test.js`
- [x] T015 [P] [US2] Add history component tests in `votiy-web/tests/component/voting-history.test.jsx`
- [x] T016 [US2] Implement paginated projection in `votiy-api/src/services/event-voting-service.js`
- [x] T017 [US2] Build semantic review in `votiy-web/src/features/voting/SubmittedBallotReview.jsx`
- [x] T018 [US2] Build history page in `votiy-web/src/features/voting/VotingHistoryPage.jsx`
- [x] T019 [US2] Register history route in `votiy-web/src/app/AppRouter.jsx`
- [x] T020 [US2] Add responsive history styles in `votiy-web/src/App.css`

## Phase 4: User Story 3 - Keep History Private and Continue Voting (P2)

- [x] T021 [P] [US3] Add identity/host/closed integration coverage in `votiy-api/tests/integration/ballot-history.test.js`
- [x] T022 [P] [US3] Add closed/repeat UI coverage in `votiy-web/tests/component/voting-history.test.jsx`
- [x] T023 [US3] Decouple review from grant/open status in `votiy-api/src/services/event-voting-service.js`
- [x] T024 [US3] Add fresh-code flow from history in `votiy-web/src/features/voting/VotingHistoryPage.jsx`

## Phase 5: Polish and cross-cutting

- [x] T025 Extend desktop/mobile history E2E in `tests/e2e/event-ballot.spec.js`
- [x] T026 Extend private-history smoke in `tests/smoke/production-smoke.js`
- [x] T027 Document history operations in `README.md` and `docs/operations.md`
- [x] T028 Run coverage, Mongo integration, lint, build, E2E discovery, syntax, and diff checks

## Result

All 28 tasks complete. Account/browser privacy, stable pagination, closed review, and one-code-per-ballot regression gates pass.
