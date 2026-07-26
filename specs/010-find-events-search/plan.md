# Implementation Plan: Find Events Search

**Branch**: `010-find-events-search` (planning label; repository remains on `main`) | **Date**: 2026-07-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-find-events-search/spec.md`

## Summary

Add anonymous and authenticated public-event discovery from one accessible header search icon. Shared
full-screen dialog debounces queries, rotates empty-field examples, renders cursor-paginated results, and
opens the normal viewer-aware event route. API adds an anonymous read-only GraphQL query backed by normalized
event substring grams, visibility/lifecycle filtering, and stable cursor ordering. Existing event documents
migrate to schema version 4 with public/active defaults. Host settings control visibility and irreversible
archival; private non-host reads receive server-redacted summaries.

## Technical Context

**Language/Version**: JavaScript ES modules on Node.js 24; JSX with React 19

**Primary Dependencies**: React 19.2, React Router 7.18, GraphQL 16.11, MongoDB driver 7, Zod 4.4,
Pino 10; browser `IntersectionObserver`

**Storage**: Existing MongoDB `events` collection; additive schema-version-4 visibility, lifecycle,
normalized text, substring-gram projection, archival metadata, and multikey search index

**Testing**: Vitest 4 unit/component/contract/integration coverage; Testing Library; Playwright desktop
and mobile E2E; production smoke

**Target Platform**: Current desktop/mobile browsers; Linux Node service on Render; MongoDB local replica
set and Atlas production cluster

**Project Type**: Web application with React client and GraphQL API

**Performance Goals**: 95% of normal searches show first page within 1 second; typing debounce 250–350 ms;
20 results per page; no duplicate page fetches

**Constraints**: Anonymous safe search of active public/private events; server-redacted private summaries;
host-only visibility/archive mutations; archived mutation denial; minimum two normalized alphanumeric
characters; 120-character query maximum; stable opaque cursor; no raw query logging; 320px, short viewport,
200% zoom, keyboard, reduced motion; repository coverage remains at least 80% lines and branches

**Scale/Scope**: Existing single application and events collection; initial design target 10,000 searchable
events and 20-result pages without adding infrastructure

## Constitution Check

*GATE: Passed before Phase 0 and re-checked after Phase 1.*

- **User value and scope — PASS**: Anonymous/authenticated visitors find active public/private events; filters,
  recommendations, saved searches, and non-event entities are excluded.
- **Identity and ownership — PASS**: Query is anonymous and read-only. Repository returns minimum search
  projection. Host alone changes visibility/archives. Private/archived access and archived mutation denial
  are enforced server-side.
- **Contracts and boundaries — PASS**: Additive GraphQL and UI contracts define validation, cursor,
  viewer-aware detail projection, stale-response, error, and navigation behavior. API owns eligibility,
  ordering, and read-time redaction without duplicate event persistence.
- **Layered quality — PASS**: Unit tests cover tokenization/cursors/state; contract tests cover schema and
  projection; real-Mongo tests cover matching, pagination, eligibility, migration, and indexes; component
  and desktop/mobile E2E cover all CUFs. Both repositories retain 80% line/branch coverage.
- **Continuous delivery — PASS**: CI adds feature unit, contract, integration, build, E2E, and smoke gates.
  Render continues deploying exact successful `main` commit; existing rollback remains source-control based.
- **Observability — PASS**: Privacy-safe logs include correlation ID, outcome, duration, result count, page
  size, and has-more state. Dashboard queries and latency/error alerts are documented. Read-only searches
  create no audit event; successful and denied visibility/archive attempts create immutable privacy-safe
  audit/domain events.
- **Operational simplicity — PASS**: Uses current React, GraphQL, and MongoDB stack; no new dependency,
  service, secret, or environment variable.

## Project Structure

### Documentation (this feature)

```text
specs/010-find-events-search/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── schema-extension.graphql
│   └── search-ui.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
votiy-api/
├── src/
│   ├── api/graphql/
│   │   ├── schema.js
│   │   └── event-resolvers.js
│   ├── domain/event-search.js
│   ├── domain/event-visibility.js
│   ├── migrations/006-event-search.js
│   ├── observability/logger.js
│   ├── repositories/
│   │   ├── event-repository.js
│   │   └── indexes.js
│   └── services/
│       ├── event-search-service.js
│       └── event-visibility-service.js
└── tests/
    ├── unit/event-search.test.js
    ├── unit/event-visibility.test.js
    ├── contract/event-search.contract.test.js
    └── integration/event-search.test.js

votiy-web/
├── src/
│   ├── app/AppRouter.jsx
│   ├── features/events/EventPage.jsx
│   └── features/search/
│       ├── EventSearchButton.jsx
│       ├── EventSearchDialog.jsx
│       ├── EventSearchResults.jsx
│       ├── event-search.graphql.js
│       ├── useEventSearch.js
│       └── PrivateEventNotice.jsx
└── tests/
    ├── component/event-search-dialog.test.jsx
    ├── component/event-search-results.test.jsx
    └── component/event-search-routing.test.jsx

tests/
├── e2e/find-events-search.spec.js
├── e2e/event-visibility.spec.js
├── e2e/fixtures/find-events-search.js
└── smoke/production-smoke.js
```

**Structure Decision**: Preserve current web/API split. Search UI lives in one feature directory; API
separates normalization, persistence query, service validation, resolver contract, and observability.
Existing event page is reused through its viewer-aware event route.

## Complexity Tracking

No constitution violations.

## Phase 0 Research Outcome

All technical unknowns resolved in [research.md](research.md). No `NEEDS CLARIFICATION` remains.

## Phase 1 Design Outcome

- Data and migration: [data-model.md](data-model.md)
- GraphQL contract: [contracts/schema-extension.graphql](contracts/schema-extension.graphql)
- UI behavior contract: [contracts/search-ui.md](contracts/search-ui.md)
- Validation guide: [quickstart.md](quickstart.md)

## Post-Design Constitution Re-check

- Scope covers event discovery plus host-controlled visibility/lifecycle required for safe disclosure.
- Anonymous query returns minimum projection and searches active public/private events only.
- Private non-host reads are redacted; unlisted direct links remain full; archived reads are host-only.
- Host-only visibility/archive transitions and archived mutation denial are server-enforced.
- Schema change is additive; existing queries/routes remain compatible.
- Migration and indexes support local/production parity.
- Unit, contract, real-Mongo integration, component, E2E, smoke, accessibility, coverage, and privacy-log
  gates are defined.
- No new service, dependency, secret, or manual deployment step.

**Result**: PASS. Tasks updated and ready for `/speckit-implement`.
