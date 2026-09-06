# Tasks: Clickable Voting Banner

## Phase 1: Setup

- [X] T001 Verify current banner, Vote controller, open-state rendering, component tests, and ignore configuration in `votiy-web/src/features/events/EventWorkspaceSummary.jsx`, `votiy-web/src/features/voting/VotingAccessButton.jsx`, `votiy-web/src/App.css`, and `.gitignore`

## Phase 2: Foundational Tests

- [X] T002 [P] Add failing shared banner/Vote access-flow and duplicate-request tests in `votiy-web/tests/component/voting-access.test.jsx`
- [X] T003 [P] Update failing open/closed banner rendering assertions in `votiy-web/tests/component/open-close-voting.test.jsx`

## Phase 3: User Story 1 - Start Voting from Banner (P1)

- [X] T004 [US1] Render banner and Vote button through one access controller in `votiy-web/src/features/voting/useVotingAccessController.js`, `votiy-web/src/features/voting/VotingAccessButton.jsx`, and `votiy-web/src/features/events/EventWorkspaceSummary.jsx`
- [X] T005 [US1] Reuse existing unrestricted, code, account, history, error, and navigation outcomes for banner activation in `votiy-web/src/features/voting/VotingAccessButton.jsx`

## Phase 4: User Story 2 - Accessible Banner (P1)

- [X] T006 [US2] Add native action, visible focus, disabled, mobile, and full-surface styling in `votiy-web/src/features/voting/VotingAccessButton.jsx` and `votiy-web/src/App.css`

## Phase 5: User Story 3 - Preserve Vote Button (P2)

- [X] T007 [US3] Preserve existing Vote button markup, styling, and behavior in `votiy-web/src/features/voting/VotingAccessButton.jsx`

## Phase 6: Validation

- [X] T008 Run web tests/lint/build, diff checks, and `specs/022-clickable-voting-banner/quickstart.md` validation

## Dependencies

- T001 precedes all work.
- T002-T003 precede implementation.
- T004-T005 establish shared controller.
- T006 and T007 follow shared controller.
- T008 follows all work.

## Parallel Opportunities

- T002 and T003 touch separate tests.
- Styling portion of T006 can proceed beside regression assertions for T007 after T004.

## Implementation Strategy

1. Lock shared-flow behavior in tests.
2. Move banner into existing controller.
3. Add native semantics/focus/pending state.
4. Prove Vote button regression-free.
