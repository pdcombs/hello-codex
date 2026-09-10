# Tasks: Descriptive Analytics Event Catalog

## Phase 1: Setup

- [x] T001 Add source taxonomy module in `votiy-web/src/analytics/analytics-events.js`

## Phase 2: Foundation

- [x] T002 Add catalog format, uniqueness, privacy, and completeness tests in `votiy-web/tests/component/analytics.test.jsx`
- [x] T003 Add dispatcher rejection tests for uncataloged names in `votiy-web/tests/component/analytics.test.jsx`

## Phase 3: User Story 1 — Review Catalog

**Independent test**: One file lists every provider event and all dispatch sites import it.

- [x] T004 [US1] Centralize page, button, failure, and fallback event names in `votiy-web/src/analytics/analytics-events.js`
- [x] T005 [US1] Import taxonomy into `votiy-web/src/analytics/analytics.js` and `votiy-web/src/analytics/AnalyticsObserver.jsx`

## Phase 4: User Story 2 — Descriptive Button Names

**Independent test**: Approved button clicks emit distinct descriptive catalog names; dynamic text uses fallback.

- [x] T006 [US2] Map safe button actions to descriptive event names in `votiy-web/src/analytics/analytics-events.js`
- [x] T007 [US2] Dispatch mapped button event names in `votiy-web/src/analytics/AnalyticsObserver.jsx`
- [x] T008 [US2] Verify representative and fallback button events in `votiy-web/tests/component/analytics.test.jsx`

## Phase 5: User Story 3 — Page Dimensions and Failure Names

**Independent test**: Pages retain standard event with normalized parameters; failures emit descriptive names.

- [x] T009 [US3] Keep cataloged `page_view` and map failure categories in `votiy-web/src/analytics/analytics-events.js`
- [x] T010 [US3] Refactor dispatcher category handling in `votiy-web/src/analytics/analytics.js`
- [x] T011 [US3] Update error boundary and observer imports in `votiy-web/src/app/AppErrorBoundary.jsx` and `votiy-web/src/analytics/AnalyticsObserver.jsx`
- [x] T012 [US3] Verify normalized page and descriptive failure dispatch in `votiy-web/tests/component/analytics.test.jsx`

## Phase 6: Validation

- [x] T013 Update exact source catalog documentation in `specs/027-descriptive-analytics-events/contracts/event-catalog.md`
- [x] T014 Run web tests, lint, build, and desktop/mobile analytics E2E flow
- [x] T015 Confirm all feature checklist/tasks complete in `specs/027-descriptive-analytics-events/`

## Dependencies

T001-T003 establish taxonomy contract. US1 precedes US2/US3. Validation follows all stories.

## Parallel Opportunities

Button mapping and documentation can proceed alongside failure mapping after base catalog exists.

## Implementation Strategy

Create tested catalog first. Refactor existing dispatch without changing consent, production-host, route-normalization, or privacy behavior.
