# Tasks: Event Short Links

## Phase 1: Setup and Tests

- [X] T001 Verify event schema, repository, service, migrations, GraphQL composition, settings UI, routes, and ignores
- [X] T002 [P] Add domain validation/reserved-name tests in `votiy-api/tests/unit/event-short-link.test.js`
- [X] T003 [P] Add GraphQL contract tests in `votiy-api/tests/contract/event-short-link.contract.test.js`
- [X] T004 [P] Add MongoDB uniqueness/migration/service tests in `votiy-api/tests/integration/event-short-link.test.js`
- [X] T005 [P] Add settings and redirect component tests in `votiy-web/tests/component/event-short-link.test.jsx`

## Phase 2: Default and Resolve (US1)

- [X] T006 [US1] Add short-link domain policy in `votiy-api/src/domain/event-short-link.js`
- [X] T007 [US1] Add event fields, unique index, and backfill migration in `votiy-api/src/repositories/indexes.js` and `votiy-api/src/migrations/009-event-short-links.js`
- [X] T008 [US1] Default new events and project short ID in `votiy-api/src/domain/event.js` and `votiy-api/src/services/event-service.js`
- [X] T009 [US1] Add public resolver contract and root redirect in API GraphQL files and `votiy-web/src/app/AppRouter.jsx`

## Phase 3: Host Customize (US2)

- [X] T010 [US2] Add validated host-only atomic update service/repository and audit in API event layers
- [X] T011 [US2] Add settings short-link editor and client mutation in `votiy-web/src/features/events/`

## Phase 4: Safety and Validation (US3)

- [X] T012 [US3] Enforce lowercase, format, reserved, and global conflict errors across API/UI
- [X] T013 Run full API/web validation, diff checks, mark tasks complete, commit, and push

## Dependencies

Tests precede implementation. Domain policy precedes persistence/service/UI. Resolve precedes customization. Full validation last.
