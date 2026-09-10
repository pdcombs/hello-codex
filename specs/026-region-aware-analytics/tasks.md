# Tasks: Cookieless Analytics Measurement

## Phase 1: Setup

- [x] T001 Verify existing analytics and consent boundary against `specs/026-region-aware-analytics/contracts/consent-measurement.md`

## Phase 2: Foundation

- [x] T002 Add denied-state event assertions in `votiy-web/tests/component/analytics.test.jsx`
- [x] T003 Confirm universal prompt and preference persistence coverage in `votiy-web/tests/component/analytics.test.jsx`

## Phase 3: User Story 1 — Consistent Cookie Choice

**Independent test**: Fresh sessions always start denied and show prompt; saved choices suppress it.

- [x] T004 [US1] Keep universal prompt and explicit preference behavior in `votiy-web/src/analytics/AnalyticsConsent.jsx`
- [x] T005 [US1] Extend browser coverage for fresh, declined, and accepted choices in `tests/e2e/analytics-privacy.spec.js`

## Phase 4: User Story 2 — Measure Without Cookies

**Independent test**: Undecided and declined clients emit sanitized page, button, and unhappy-path events with denied storage.

- [x] T006 [US2] Verify cookieless event dispatch remains independent of accepted state in `votiy-web/src/analytics/analytics.js`
- [x] T007 [US2] Add cookieless page/button/error and prohibited-data tests in `votiy-web/tests/component/analytics.test.jsx`
- [x] T008 [US2] Update disclosure about cookieless measurement precision in `votiy-web/src/features/privacy/PrivacyPage.jsx`

## Phase 5: User Story 3 — Change Preference

**Independent test**: Visitor reverses choice from footer; storage updates immediately while events continue.

- [x] T009 [US3] Test accepted-to-declined consent updates in `votiy-web/tests/component/analytics.test.jsx`
- [x] T010 [US3] Verify footer preference flow in `tests/e2e/analytics-privacy.spec.js`

## Phase 6: Validation

- [x] T011 Run web tests, lint, build, and focused desktop/mobile E2E flow
- [x] T012 Confirm all checklist and task items complete in `specs/026-region-aware-analytics/`

## Dependencies

T001-T003 establish boundary. US1 and US2 follow foundation; US3 follows consent behavior. Validation follows all stories.

## Parallel Opportunities

Privacy copy T008 can run beside unit test work. Browser coverage follows component behavior.

## Implementation Strategy

Validate existing implementation first. Change production code only where contract gaps exist. Finish with focused full-stack browser validation.
