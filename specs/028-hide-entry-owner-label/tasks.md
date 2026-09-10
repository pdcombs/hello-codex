# Tasks: Hide Entry Owner Label

## Setup

- [x] T001 Verify shared row scope in `votiy-web/src/features/events/EventEntryRow.jsx`

## User Story 1 — Cleaner Category Entries

**Independent test**: Entry title remains visible; owner attribution absent; edit controls remain accessible.

- [x] T002 [US1] Update absence/presence expectations in `votiy-web/tests/component/event-setup-view.test.jsx`
- [x] T003 [US1] Remove read-only attribution node in `votiy-web/src/features/events/EventEntryRow.jsx`
- [x] T004 [US1] Verify editable labels and removal controls in `votiy-web/tests/component/event-setup-view.test.jsx`

## Validation

- [x] T005 Run web tests, lint, build, and relevant browser flow
- [x] T006 Confirm checklist and tasks complete in `specs/028-hide-entry-owner-label/`

## Dependencies

T002 precedes T003; validation follows implementation.

## Implementation Strategy

One presentation edit, one focused regression update, full web validation.
