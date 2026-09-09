# Tasks: Site Usage Analytics and Privacy

## Foundation

- [x] T001 Add analytics boundary tests in `votiy-web/tests/component/analytics.test.jsx`
- [x] T002 Implement production guard, consent bootstrap, route normalization, allowlist, and gtag adapter in `votiy-web/src/analytics/analytics.js`
- [x] T003 Update Google CSP contract/tests in `votiy-api/src/app.js` and `votiy-api/tests/integration/security-and-failures.test.js`

## User Story 1 — Visits

- [x] T004 [US1] Add exactly-once route observer in `votiy-web/src/analytics/AnalyticsObserver.jsx`
- [x] T005 [US1] Mount analytics lifecycle in `votiy-web/src/app/AppRouter.jsx`
- [x] T006 [US1] Test isolation and normalized SPA page views

## User Story 2 — Actions and problems

- [x] T007 [US2] Implement safe delegated button tracking
- [x] T008 [US2] Implement safe alert/global error classification and deduplication
- [x] T009 [US2] Connect fatal React error reporting in `votiy-web/src/app/AppErrorBoundary.jsx`
- [x] T010 [US2] Test dynamic-label redaction, nested/disabled clicks, alerts, and raw-error exclusion

## User Story 3 — Consent and privacy

- [x] T011 [US3] Add consent provider/banner/preferences in `votiy-web/src/analytics/AnalyticsConsent.jsx`
- [x] T012 [US3] Add global footer and privacy route/page
- [x] T013 [US3] Add responsive accessible styling in `votiy-web/src/App.css`
- [x] T014 [US3] Test choices, persistence, reopening, and footer/privacy reachability

## Validation

- [x] T015 Add local no-send/privacy browser coverage in `tests/e2e/analytics-privacy.spec.js`
- [x] T016 Run web/API lint, tests, builds, and E2E; fix regressions
- [x] T017 Finalize production smoke/dashboard/rollback instructions

## Dependencies

T001 precedes implementation. T002-T003 are foundational. T004-T010 build tracking. T011-T014 add privacy UI. T015-T017 validate the complete feature.
