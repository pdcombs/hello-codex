# Implementation Plan: Cookieless Analytics Measurement

**Branch**: `026-region-aware-analytics` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

## Summary

Retain universal cookie prompt and verify existing advanced-consent analytics sends sanitized page, button, and unhappy-path events while analytics storage is denied. Strengthen consent-state tests and reporting/privacy guidance; no country lookup or new service.

## Technical Context

**Language/Version**: JavaScript ES modules; Node.js 24; React 19
**Primary Dependencies**: React, React Router, native Google tag
**Storage**: Browser localStorage for explicit preference; analytics storage controlled by consent state
**Testing**: Vitest, Testing Library, Playwright
**Target Platform**: Current mobile and desktop browsers
**Project Type**: React SPA served by Node API
**Performance Goals**: No blocked navigation; one safe event per action
**Constraints**: Prompt all fresh visitors; analytics storage denied until Accept; no PII, IDs, codes, ballots, raw URLs/errors, or location inference
**Scale/Scope**: Existing production analytics boundary and consent UI

## Constitution Check

- User value/scope: PASS — universal prompt plus cookieless measurement defined.
- Identity/ownership: PASS — explicit browser choice remains visitor-controlled.
- Contracts/boundaries: PASS — consent and event contracts documented.
- Layered quality: PASS — boundary, component, and browser tests planned.
- Continuous delivery: PASS — existing CI/deploy and rollback retained.
- Observability: PASS — reporting limitations documented.
- Operational simplicity: PASS — no new service, dependency, or country lookup.

Post-design check: PASS.

## Project Structure

```text
specs/026-region-aware-analytics/{plan.md,research.md,data-model.md,quickstart.md,tasks.md}
specs/026-region-aware-analytics/contracts/consent-measurement.md
votiy-web/src/analytics/{analytics.js,AnalyticsConsent.jsx}
votiy-web/src/features/privacy/PrivacyPage.jsx
votiy-web/tests/component/analytics.test.jsx
tests/e2e/analytics-privacy.spec.js
```

**Structure Decision**: Extend existing analytics boundary/tests. No backend or persistence change.

## Complexity Tracking

No violations.
