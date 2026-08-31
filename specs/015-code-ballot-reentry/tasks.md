# Tasks: Require New Code for Each Ballot

**Input**: Design documents from `/specs/015-code-ballot-reentry/`

## Phase 1: Setup and foundation

- [x] T001 Confirm existing unique ballot/code index compatibility in `votiy-api/src/repositories/indexes.js`
- [x] T002 Extend shared code-ballot fixtures in `votiy-api/tests/integration/voting-code-claim.test.js`
- [x] T003 Extend browser flow fixtures in `tests/e2e/fixtures/event-ballot.js`
- [x] T004 Add ballot lookup by code in `votiy-api/src/repositories/ballot-submission-repository.js`
- [x] T005 Add claimed-code ballot attachment in `votiy-api/src/repositories/voting-access-code-repository.js`
- [x] T006 Add privacy-safe reuse audits in `votiy-api/src/repositories/audit-event-repository.js`

## Phase 2: User Story 1 - Enforce One Ballot Per Code (P1)

**Independent Test**: Submit and race multiple attempts on one code; exactly one ballot persists while exact retry returns original result.

- [x] T007 [P] [US1] Cover used-grant and new-code access decisions in `votiy-api/tests/unit/voting-access-decision.test.js`
- [x] T008 [P] [US1] Cover code errors/contracts in `votiy-api/tests/contract/event-ballot.contract.test.js`
- [x] T009 [P] [US1] Cover sequential, concurrent, and idempotent Mongo behavior in `votiy-api/tests/integration/voting-code-claim.test.js`
- [x] T010 [US1] Require unused-for-ballot grant code and rotate only to new unused code in `votiy-api/src/services/event-voting-service.js`
- [x] T011 [US1] Bind exact code and map duplicate races to used-code denial in `votiy-api/src/services/event-voting-service.js`
- [x] T012 [US1] Emit privacy-safe denial/linkage signals in `votiy-api/src/services/event-voting-service.js`

## Phase 3: User Story 2 - Vote Again With a New Code (P1)

**Independent Test**: Submit code A, reject reused A, accept B, and render a blank ballot on the same device.

- [x] T013 [P] [US2] Cover callback/review preservation in `votiy-web/tests/component/event-ballot.test.jsx`
- [x] T014 [P] [US2] Cover revisit/modal/error/cancel/reset in `votiy-web/tests/component/voting-page.test.jsx`
- [x] T015 [US2] Return repeat availability for open code events in `votiy-api/src/services/event-voting-service.js`
- [x] T016 [US2] Delegate repeat authorization in `votiy-web/src/features/voting/EventBallot.jsx`
- [x] T017 [US2] Orchestrate fresh code and blank reset in `votiy-web/src/features/voting/VotingPage.jsx`
- [x] T018 [US2] Add accessible re-entry modal behavior in `votiy-web/src/features/voting/VotingCodeModal.jsx`

## Phase 4: User Story 3 - Preserve Completed Ballot Review (P2)

**Independent Test**: Cancel/fail new code and preserve old review; submit new code and show latest while old ballot remains immutable.

- [x] T019 [P] [US3] Cover account/browser latest review in `votiy-api/tests/integration/voter-access.test.js`
- [x] T020 [P] [US3] Cover focus and latest review in `votiy-web/tests/component/voting-page.test.jsx`
- [x] T021 [US3] Preserve review identity while rotating submission grant in `votiy-api/src/services/event-voting-service.js`
- [x] T022 [US3] Preserve review through modal failure/cancel and update after success in `votiy-web/src/features/voting/VotingPage.jsx`

## Phase 5: Polish and cross-cutting

- [x] T023 Extend desktop/mobile shared-device E2E in `tests/e2e/event-ballot.spec.js`
- [x] T024 Extend safe code A/code B smoke in `tests/smoke/production-smoke.js`
- [x] T025 Document integrity/rollback in `README.md` and `docs/operations.md`
- [x] T026 Run coverage, Mongo integration, lint, build, E2E discovery, syntax, and diff checks

## Dependencies

```text
Setup -> Foundation -> US1 integrity -> US2 re-entry -> US3 review -> Polish
```

## Result

All 26 tasks completed. Existing unique code/ballot persistence constraint remains authoritative; no destructive migration or new dependency was introduced.
