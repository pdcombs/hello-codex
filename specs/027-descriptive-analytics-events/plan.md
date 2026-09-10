# Implementation Plan: Descriptive Analytics Event Catalog

**Branch**: `027-descriptive-analytics-events` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

## Summary

Create one immutable analytics taxonomy module containing all provider event names and safe mappings. Keep standard `page_view`; replace generic button/error event names with controlled descriptive names. Reject unknown event names at dispatch boundary and document GA custom-dimension setup for normalized page reporting.

## Technical Context

**Language/Version**: JavaScript ES modules; Node.js 24; React 19
**Primary Dependencies**: Native Google tag, React Router
**Storage**: N/A
**Testing**: Vitest, Testing Library, Playwright
**Target Platform**: Current mobile and desktop browsers
**Project Type**: React SPA served by Node API
**Performance Goals**: Constant-time catalog lookup; tracking remains non-blocking
**Constraints**: Event names start with letter, lowercase alphanumeric/underscore only, maximum 40 characters; no dynamic data or PII
**Scale/Scope**: Existing page, 21 button, 10 failure event mappings

## Constitution Check

- User value/scope: PASS — readable analytics taxonomy and explicit exclusions.
- Identity/ownership: PASS — no identity or private-domain changes.
- Contracts/boundaries: PASS — catalog and dispatcher validation are explicit.
- Layered quality: PASS — unit catalog/dispatch tests plus browser regression.
- Continuous delivery: PASS — existing CI/deployment retained.
- Observability: PASS — names improve product reporting without raw diagnostics.
- Operational simplicity: PASS — one module, no package/service/storage.

Post-design check: PASS.

## Project Structure

```text
votiy-web/src/analytics/
├── analytics-events.js
├── analytics.js
└── AnalyticsObserver.jsx
votiy-web/tests/component/analytics.test.jsx
specs/027-descriptive-analytics-events/contracts/event-catalog.md
```

**Structure Decision**: Taxonomy module owns every event literal and semantic mapping. Dispatcher imports catalog and refuses uncataloged names.

## Complexity Tracking

No violations.
