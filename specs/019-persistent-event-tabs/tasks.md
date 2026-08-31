# Tasks: Persistent Event Tabs

**Input**: Design documents from `/specs/019-persistent-event-tabs/`

**Tests**: Component and E2E acceptance coverage required by specification and constitution.

## Phase 1: Setup

- [X] T001 Verify existing React Router, Vitest, Playwright, and ignore-file configuration in `votiy-web/package.json`, `.gitignore`, and `playwright.config.js`

## Phase 2: Foundational

- [X] T002 Add failing nested-workspace lifecycle, single-load, and contained-loading component tests in `votiy-web/tests/component/event-workspace-routing.test.jsx`
- [X] T003 Add failing persistent-shell critical-flow assertions in `tests/e2e/event-details-navigation.spec.js`

## Phase 3: User Story 1 - Switch Tabs Without Losing Event Context (P1)

**Goal**: Shared summary and tabs stay mounted while only selected content changes.

**Independent Test**: Navigate Entries, Participants, Results with delayed loaders; shared title remains present, event loader runs once, and loading stays below tabs.

- [X] T004 [US1] Create owner workspace parent with shared event loading, ownership check, reload, and outlet context in `votiy-web/src/features/events/OwnerEventWorkspacePage.jsx`
- [X] T005 [US1] Nest Entries, Participants, and Results routes under owner workspace while preserving public event behavior in `votiy-web/src/app/AppRouter.jsx`
- [X] T006 [US1] Convert Entries page to outlet-context content without duplicate workspace rendering in `votiy-web/src/features/events/OwnerEventPage.jsx`
- [X] T007 [US1] Convert Participants page to outlet-context content with section-only loading in `votiy-web/src/features/events/OwnerEventParticipantsPage.jsx`
- [X] T008 [US1] Convert Results page to outlet-context content with section-only loading in `votiy-web/src/features/events/OwnerEventResultsPage.jsx`

## Phase 4: User Story 2 - Open Any Tab Directly (P1)

**Goal**: Deep links, refresh, and browser history select correct child while workspace remains stable for same-event navigation.

**Independent Test**: Open each URL directly, then navigate Back/Forward; selected tab and content match URL without repeated shared event loading.

- [X] T009 [US2] Extend routing tests for direct URLs, Back/Forward, selected accessibility state, and same-event request count in `votiy-web/tests/component/event-workspace-routing.test.jsx`
- [X] T010 [US2] Preserve canonical tab matching and accessible selected state across nested routes in `votiy-web/src/features/events/EventWorkspaceTabs.jsx`

## Phase 5: User Story 3 - Contain Tab Failures (P2)

**Goal**: Tab failures and retries stay below tabs and never remove event context.

**Independent Test**: Fail Results, verify summary/tabs remain, navigate away, return, retry, and recover only content region.

- [X] T011 [US3] Add tab failure, navigation-away, retry, and stale-response tests in `votiy-web/tests/component/event-workspace-routing.test.jsx`
- [X] T012 [US3] Ensure child request cleanup and retry states cannot update inactive tab content in `votiy-web/src/features/events/OwnerEventParticipantsPage.jsx` and `votiy-web/src/features/events/OwnerEventResultsPage.jsx`

## Phase 6: Polish and Validation

- [X] T013 Update affected legacy page/component tests for nested workspace contract in `votiy-web/tests/component/event-participants-tab.test.jsx`, `votiy-web/tests/component/owner-event-results-page.test.jsx`, and `votiy-web/tests/component/app-router.test.jsx`
- [X] T014 Run feature component tests, full web tests, lint, production build, targeted Playwright flow, and `specs/019-persistent-event-tabs/quickstart.md` checks

## Dependencies

- T001 precedes tests and implementation.
- T002-T003 establish failing acceptance coverage before T004-T008.
- T004 precedes T005-T008.
- T005-T008 complete User Story 1 MVP.
- T009-T010 validate User Story 2 on shared workspace.
- T011-T012 validate User Story 3 failure containment.
- T013-T014 follow all implementation work.

## Parallel Opportunities

- T002 and T003 affect separate test layers.
- After T005, child conversions T006-T008 affect separate files but integrate through same outlet contract.
- T009 and T011 extend different behavioral groups in same file and should execute sequentially when one developer works.

## Implementation Strategy

1. Establish lifecycle acceptance tests.
2. Build parent workspace and nested routes.
3. Convert child pages, preserving behavior.
4. Add deep-link/history and failure containment coverage.
5. Run full validation, then commit and push.
