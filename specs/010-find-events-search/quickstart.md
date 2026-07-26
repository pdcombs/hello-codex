# Quickstart: Find Events Search Validation

## Prerequisites

- Local MongoDB replica-set container running.
- API and web dependencies installed.
- API available at `http://127.0.0.1:4000`.
- Web available at `http://127.0.0.1:5173`.
- Fixtures include public events with overlapping titles, descriptions, and locations across more than one
  page.

## Automated Validation

```bash
corepack pnpm --dir votiy-api test
corepack pnpm --dir votiy-api test:coverage
corepack pnpm --dir votiy-web test
corepack pnpm --dir votiy-web test:coverage
corepack pnpm --dir votiy-web lint
corepack pnpm --dir votiy-web build
corepack pnpm test:e2e tests/e2e/find-events-search.spec.js
node tests/smoke/production-smoke.js
```

Expected: both repositories exceed 80% lines and branches; contract, migration, real-Mongo integration,
component, desktop/mobile E2E, accessibility, privacy-log, and smoke checks pass.

## CUF-001: Anonymous Search

1. Sign out and open home.
2. Confirm header exposes icon control named `Find events`.
3. Open dialog; confirm focus enters blank search box and placeholder examples rotate.
4. Search using partial title.
5. Confirm expected event appears within 1 second.
6. Select result.
7. Confirm `/events/:publicId` renders full host details for its host, public details for public visitors,
   and PrivateEventSummary for non-host private visitors.

## CUF-002: Authenticated Search and Pagination

1. Sign in and confirm same header search control exists.
2. Search using partial description or location matching more than 20 fixtures.
3. Scroll through first page; confirm next page loads once with no duplicate events.
4. Use keyboard Load More fallback.
5. Select owned event result; confirm public, not owner, view opens.

## CUF-003: Visibility, Eligibility, and Data Minimization

1. Create matching public, private, unlisted, and archived fixtures.
2. Confirm search returns public/private only.
3. Confirm private result omits location and identifies private visibility.
4. Open private result as non-host; confirm title, description, counts, navigation labels, and private notice.
5. Confirm location, photo, categories, entries, participants, voting, owner IDs, internal IDs, tokens, and
   codes are absent from response.

## CUF-005: Host Visibility and Archival

1. As host, switch active event among public, private, and unlisted.
2. Confirm search/direct-link behavior updates immediately.
3. Confirm archive action requires explicit confirmation.
4. Archive event and confirm it disappears from search.
5. Confirm host receives archived read-only view and every standard mutation is denied.
6. Confirm non-host direct read returns unavailable and archive cannot be reversed.

## CUF-004: Accessibility, Races, and Failures

1. Complete search using keyboard only at 320px width and 200% zoom.
2. Confirm focus trap, status announcements, Escape/backdrop/Close, and restored trigger focus.
3. Type several queries rapidly under delayed responses; confirm only newest query results appear.
4. Fail initial and later-page requests; confirm retry retains query and existing results.
5. Enable reduced motion; confirm placeholder and dialog remain understandable.

## Operational Checks

- Query `event.search.completed` logs by outcome and latency.
- Confirm logs contain no raw or normalized query, title, description, location, or visitor identifier.
- Confirm alert queries detect elevated error rate and first-page p95 above budget.
- Confirm readiness fails if required event search index/migration is unavailable.

## Regression Checks

- Header home, My Events, Create Event, Sign In, and Sign Out actions remain usable.
- Existing `/events/:publicId` remains the single viewer-aware route used by direct and search navigation.
- Direct public links, event setup, participants, settings, voting, registration, and photo flows remain
  green.
- CI blocks deployment on search contract, migration, integration, E2E, accessibility, coverage, or smoke
  failure.
