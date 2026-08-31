# Tasks: Cast Event Ballot

**Input**: Design documents from `/specs/014-event-ballot/`

## Phase 1: Setup and foundation

- [x] T001 Register the Feature 014 GraphQL contract in the API schema
- [x] T002 Add reusable ballot fixtures to API and browser test suites
- [x] T003 Add strict ballot submission validation schemas
- [x] T004 Evolve the version-2 ballot validator and compatible indexes
- [x] T005 Add identity-scoped latest-ballot repository reads
- [x] T006 Reuse privacy-safe ballot audit names and metadata allowlist
- [x] T007 Add ballot payload digest and view projections

## Phase 2: User Story 1 - Complete Event Ballot (P1)

**Independent Test**: Render all methods, skip categories, make one valid participating selection, and reach confirmation readiness.

- [x] T008 [P] [US1] Expand optional-category and method validation unit tests
- [x] T009 [P] [US1] Add ballot GraphQL contract tests
- [x] T010 [P] [US1] Add ballot form component tests
- [x] T011 [US1] Implement optional-category normalization and snapshot projection
- [x] T012 [US1] Add ballot-view resolver and event/rule projection
- [x] T013 [US1] Add ballot view/query clients
- [x] T014 [P] [US1] Build method-aware category controls
- [x] T015 [US1] Build the one-page editable ballot
- [x] T016 [US1] Replace the placeholder with an authorized ballot route

## Phase 3: User Story 2 - Confirm and Submit Vote (P1)

**Independent Test**: Cancel then confirm a valid ballot; exactly one immutable record persists; stale state/rules fail safely.

- [x] T017 [P] [US2] Add submission service and idempotency coverage
- [x] T018 [P] [US2] Expand real-Mongo submission coverage
- [x] T019 [P] [US2] Add confirmation interaction coverage
- [x] T020 [US2] Strengthen transactional submission, version gates, grants, digest, and response
- [x] T021 [US2] Bind submission resolver cookies and safe failures
- [x] T022 [US2] Build the accessible confirmation bottom sheet
- [x] T023 [US2] Add sticky submit, validation, retry, and stable attempt handling

## Phase 4: User Story 3 - Review Completed Ballot (P2)

**Independent Test**: Submit/reload under account, browser, and code identity; exact latest ballot is read-only and foreign/host viewers receive no choices.

- [x] T024 [P] [US3] Add private review unit/contract coverage
- [x] T025 [P] [US3] Add real-Mongo review identity coverage
- [x] T026 [P] [US3] Add read-only/revisit component coverage
- [x] T027 [US3] Implement identity-scoped ballot review service
- [x] T028 [US3] Expose private review resolver
- [x] T029 [US3] Render snapshot-based read-only review and explicit repeat action

## Phase 5: Polish and cross-cutting

- [x] T030 Add responsive ballot, sticky bar, ranking, and bottom-sheet styles
- [x] T031 [P] Add CUF desktop/mobile E2E coverage
- [x] T032 [P] Extend ballot accessibility coverage
- [x] T033 [P] Extend safe production smoke coverage
- [x] T034 [P] Document ballot operations and rollback
- [x] T035 Run API/web coverage, real-Mongo integration, lint, build, E2E discovery, smoke syntax, and diff checks

## Dependencies

```text
Setup -> Foundation -> US1 editable ballot -> US2 submission -> US3 durable review -> Polish
```

## Implementation Strategy

1. Reuse the existing submission boundary and add a compatible data shape.
2. Ship editable ballot and method controls.
3. Add deliberate idempotent confirmation.
4. Add private durable review and explicit repeat path.
5. Close responsive, accessibility, E2E, smoke, observability, and coverage gates.
