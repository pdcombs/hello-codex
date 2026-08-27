# Tasks: Open / Close Voting

**Input**: Design documents from `/specs/013-open-close-voting/`

**Tests**: Constitution requires unit, contract, real-Mongo integration, component, desktop/mobile E2E, privacy, concurrency, smoke, and 80% line/branch coverage.

## Phase 1: Setup

- [ ] T001 Register `specs/013-open-close-voting/contracts/schema-extension.graphql` in `votiy-api/src/api/graphql/schema.js`
- [ ] T002 [P] Add reusable manual-state/access/code fixtures in `votiy-api/tests/support/open-close-voting-fixtures.js`
- [ ] T003 [P] Add browser event/access setup helpers in `tests/e2e/fixtures/open-close-voting.js`
- [ ] T004 [P] Extend privacy assertions for state/access/code metadata in `votiy-api/tests/support/audit-assertions.js`

## Phase 2: Foundational

- [ ] T005 Add manual voting state constructor, transition invariants, and projection in `votiy-api/src/domain/event-voting-state.js`
- [ ] T006 Add status and access request validation in `votiy-api/src/domain/validation.js`
- [ ] T007 Add schema-version-5 event and evolved voter-access validators/indexes in `votiy-api/src/repositories/indexes.js`
- [ ] T008 Add closed-by-default event migration in `votiy-api/src/migrations/007-manual-voting-state.js`
- [ ] T009 Wire migration 007 through startup in `votiy-api/src/server.js`
- [ ] T010 Add atomic event voting-state transition operation in `votiy-api/src/repositories/event-repository.js`
- [ ] T011 Add account/browser voter-access lookup and grant operations in `votiy-api/src/repositories/event-voter-access-repository.js`
- [ ] T012 Add anonymous-safe atomic access-code consume operation in `votiy-api/src/repositories/voting-access-code-repository.js`
- [ ] T013 Add browser-marker ballot count operation in `votiy-api/src/repositories/ballot-submission-repository.js`
- [ ] T014 Add Feature 013 audit names and safe metadata allowlist in `votiy-api/src/repositories/audit-event-repository.js`
- [ ] T015 Wire state/access services and dependencies in `votiy-api/src/server.js`
- [ ] T016 Extend CI Feature 013 gates in `.github/workflows/ci.yml`

## Phase 3: User Story 1 - Host Controls Voting State (P1)

**Independent Test**: Host opens configured event, public state/banner/action change, closes it, and all fresh access/submission fails.

- [ ] T017 [P] [US1] Add domain unit tests for closed default, transitions, no-op, versions, and preserved rules/history in `votiy-api/tests/unit/event-voting-state.test.js`
- [ ] T018 [P] [US1] Add GraphQL contract tests for state input/result/event projection and errors in `votiy-api/tests/contract/event-voting-state.contract.test.js`
- [ ] T019 [P] [US1] Add real-Mongo tests for ownership, prerequisites, concurrent versions, persistence, reopen preservation, and code warning in `votiy-api/tests/integration/event-voting-state.test.js`
- [ ] T020 [P] [US1] Add migration contract/integration tests for closed schema-version-5 events in `votiy-api/tests/integration/manual-voting-state-migration.test.js`
- [ ] T021 [P] [US1] Add host control/banner/closed-summary component tests in `votiy-web/tests/component/open-close-voting.test.jsx`
- [ ] T022 [P] [US1] Add CUF-001 desktop/mobile host flow in `tests/e2e/open-close-voting.spec.js`
- [ ] T023 [US1] Implement host state transition service with prerequisites, conflicts, code warning, audits, and telemetry in `votiy-api/src/services/event-voting-state-service.js`
- [ ] T024 [US1] Expose state transition resolver in `votiy-api/src/api/graphql/event-resolvers.js`
- [ ] T025 [US1] Project manual status and make dates display-only in `votiy-api/src/domain/event.js` and `votiy-api/src/domain/ballot-submission.js`
- [ ] T026 [US1] Add state mutation client mapping in `votiy-web/src/features/voting/voting.graphql.js`
- [ ] T027 [US1] Add host Open/Close control and code-inventory warning in `votiy-web/src/features/voting/VotingStatusControl.jsx`
- [ ] T028 [US1] Integrate control into settings rules section in `votiy-web/src/features/events/EventSettingsPage.jsx`
- [ ] T029 [US1] Add event-wide open banner and closed summary in `votiy-web/src/features/events/EventPage.jsx` and `votiy-web/src/features/events/EventVotingSummary.jsx`

## Phase 4: User Story 2 - Visitor Requests Voting Access (P1)

**Independent Test**: Open events show Vote to every viewer; fresh unrestricted/account/browser decisions allow or return one structured requirement and safe return path.

- [ ] T030 [P] [US2] Add access decision unit tests for state, policies, account completion, browser repeat, limits, and privacy in `votiy-api/tests/unit/voting-access-decision.test.js`
- [ ] T031 [P] [US2] Add GraphQL access requirements contract tests in `votiy-api/tests/contract/voting-access-decision.contract.test.js`
- [ ] T032 [P] [US2] Add real-Mongo access tests for closed races, account/browser histories, marker issuance, and safe audits in `votiy-api/tests/integration/voting-access-decision.test.js`
- [ ] T033 [P] [US2] Add Vote action, decisions, redirect, and placeholder component tests in `votiy-web/tests/component/voting-access.test.jsx`
- [ ] T034 [P] [US2] Add CUF-002/CUF-003/CUF-005 browser coverage in `tests/e2e/open-close-voting.spec.js`
- [ ] T035 [US2] Implement fresh structured access decisions in `votiy-api/src/services/event-voting-service.js`
- [ ] T036 [US2] Expose access mutation and marker cookie handling in `votiy-api/src/api/graphql/event-resolvers.js`
- [ ] T037 [US2] Add access mutation client mapping in `votiy-web/src/features/voting/voting.graphql.js`
- [ ] T038 [US2] Build Vote action and decision handling in `votiy-web/src/features/voting/VotingAccessButton.jsx`
- [ ] T039 [US2] Build event-scoped placeholder page in `votiy-web/src/features/voting/VotingComingSoonPage.jsx`
- [ ] T040 [US2] Register placeholder route and show Vote to every open-event viewer in `votiy-web/src/app/AppRouter.jsx` and `votiy-web/src/features/events/EventPage.jsx`
- [ ] T041 [US2] Preserve safe return path through sign-in/register/verification in `votiy-web/src/features/auth/return-path.js`, `votiy-web/src/features/auth/SignInPage.jsx`, `votiy-web/src/features/auth/RegisterPage.jsx`, and `votiy-web/src/features/auth/VerifyEmailPage.jsx`

## Phase 5: User Story 3 - Visitor Supplies Voting Code (P1)

**Independent Test**: Code modal safely retries invalid/used codes and concurrent claim has one winner bound to account/browser grant.

- [ ] T042 [P] [US3] Add code access unit tests for requirement, valid claim, account completion ordering, retry, and no raw secrets in `votiy-api/tests/unit/voting-code-access.test.js`
- [ ] T043 [P] [US3] Add real-Mongo concurrent code claim/grant/rollback tests in `votiy-api/tests/integration/voting-code-access.test.js`
- [ ] T044 [P] [US3] Add accessible modal/focus/retry component tests in `votiy-web/tests/component/voting-code-modal.test.jsx`
- [ ] T045 [P] [US3] Add CUF-004 desktop/mobile code coverage in `tests/e2e/open-close-voting.spec.js`
- [ ] T046 [US3] Implement transactional code claim and account/browser grant in `votiy-api/src/services/event-voting-service.js`
- [ ] T047 [US3] Build generated-code modal in `votiy-web/src/features/voting/VotingCodeModal.jsx`
- [ ] T048 [US3] Integrate modal and safe retry into Vote decision flow in `votiy-web/src/features/voting/VotingAccessButton.jsx`

## Phase 6: Polish & Cross-Cutting

- [ ] T049 [P] Add banner/control/modal responsive, focus, touch, reduced-motion, and overflow checks in `tests/e2e/responsive-accessibility.spec.js`
- [ ] T050 [P] Extend production smoke for schema, closed denial, state projection, and safe synthetic access in `tests/smoke/production-smoke.js`
- [ ] T051 [P] Add state/access latency/error/privacy observability tests in `votiy-api/tests/integration/open-close-voting-observability.test.js`
- [ ] T052 [P] Document manual state, display-only dates, code warnings, signals, incidents, and rollback in `README.md` and `docs/operations.md`
- [ ] T053 Add Feature 013 responsive UI styles in `votiy-web/src/App.css`
- [ ] T054 Run full API/web coverage, lint, formatting, build, desktop/mobile E2E, smoke, and regressions from `specs/013-open-close-voting/quickstart.md`
- [ ] T055 Verify 80% line/branch floors and every ownership, lifecycle, repeat, code, privacy, and concurrency decision path in `votiy-api/tests/` and `votiy-web/tests/`
- [ ] T056 Validate code-only rollback without deleting/resetting voting state or history and record result in `specs/013-open-close-voting/quickstart.md`

## Dependencies

```text
Setup -> Foundation -> US1 host state -> US2 access decisions -> US3 code claim -> Polish
```

- Manual state is foundational for every gate.
- US2 requires authoritative state from US1.
- US3 extends US2 decision mutation and requires access-grant persistence.
- Polish requires all stories.

## Parallel Opportunities

- T002-T004; T017-T022; T030-T034; T042-T045; T049-T052 are parallel-safe after their phase prerequisites.
- API domain/repository tests and web component tests use separate files.

## Implementation Strategy

1. Ship host state and submission gate first.
2. Add public Vote and structured unrestricted/account/browser decisions.
3. Add atomic code claim and modal.
4. Close accessibility, observability, smoke, coverage, and rollback gates.

All tasks follow required checkbox, sequential ID, story label, and exact-path format.
