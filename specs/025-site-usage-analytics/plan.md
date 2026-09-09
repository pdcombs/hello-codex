# Implementation Plan: Site Usage Analytics and Privacy

**Branch**: `025-site-usage-analytics` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

## Summary

Add a dependency-free Google Analytics 4 browser adapter for exact production hosts, advanced consent mode, sanitized SPA page views, delegated button tracking, normalized unhappy-path reporting, and a site-wide privacy/consent experience. The adapter is fail-open, sends only allowlisted fields, and the API CSP is expanded only for required Google endpoints.

## Technical Context

**Language/Version**: JavaScript ES modules; Node.js 24; React 19
**Primary Dependencies**: React, React Router, native gtag.js
**Storage**: Browser localStorage for consent only; GA4 owns analytics storage
**Testing**: Vitest, Testing Library, Playwright, API integration tests
**Target Platform**: Responsive evergreen browsers; Node production host on Render
**Project Type**: React SPA served by Node API
**Performance Goals**: Analytics never blocks rendering/navigation; one event per activation/navigation
**Constraints**: Exact production-host guard; no PII, identifiers, free-form copy, codes, ballots, raw errors, query strings, or fragments
**Scale/Scope**: All current SPA routes and semantic button controls; one public privacy page and global footer/banner

## Constitution Check

- **User value and scope**: PASS — independently testable stories and measurable privacy outcomes.
- **Identity and ownership**: PASS — anonymous browser preference only; no account identifiers or authorization change.
- **Contracts and boundaries**: PASS — allowlisted event contract and consent state machine documented.
- **Layered quality**: PASS — normalization, component, integration, CSP, and browser coverage planned.
- **Continuous delivery**: PASS — existing CI/deploy remains the gate; smoke and rollback are documented.
- **Observability**: PASS — GA reports product usage; server logs remain diagnostic source.
- **Operational simplicity**: PASS — native gtag integration, no new package or backend persistence.

Post-design re-check: PASS. CSP, fail-open behavior, consent ordering, and sensitive-data rejection are explicit.

## Project Structure

### Documentation

```text
specs/025-site-usage-analytics/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/event-catalog.md
└── tasks.md
```

### Source Code

```text
votiy-web/src/
├── analytics/{analytics.js,AnalyticsConsent.jsx,AnalyticsObserver.jsx}
├── app/AppRouter.jsx
├── features/privacy/PrivacyPage.jsx
└── App.css
votiy-web/tests/component/analytics.test.jsx
votiy-api/src/app.js
votiy-api/tests/integration/security-and-failures.test.js
tests/e2e/analytics-privacy.spec.js
```

**Structure Decision**: Keep analytics at the React boundary except the production CSP allowlist. No API, schema, or database changes.

## Delivery and Operations

Existing CI remains the deploy gate. Smoke-test Realtime/DebugView on both domains, normalized routes, consent changes, and localhost isolation. Rollback is a commit revert; no migration exists. GA4 standard reports cover visitors, sessions, browser, device, and geography; explorations use `button_click` and `unhappy_path` parameters.

## Complexity Tracking

No constitution violations.
