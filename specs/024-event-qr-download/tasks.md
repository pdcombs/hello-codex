# Tasks: Event QR Download

**Input**: Design documents from `/specs/024-event-qr-download/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Component and critical browser-flow coverage required by specification and constitution.

**Organization**: Tasks grouped by independently testable user story.

## Phase 1: Setup

**Purpose**: Add selected QR renderer to existing web application.

- [x] T001 Add `qrcode.react` runtime dependency and lockfile entry in votiy-web/package.json and pnpm-lock.yaml

---

## Phase 2: Foundational

**Purpose**: Define stable URL and PNG export boundary shared by both stories.

- [x] T002 Add production QR URL constant, saved-alias derivation, safe filename derivation, and canvas reference boundary in votiy-web/src/features/events/EventShortLinkEditor.jsx

**Checkpoint**: QR destination always derives from persisted alias.

---

## Phase 3: User Story 1 - Download Event QR Code (Priority: P1)

**Goal**: Host downloads valid PNG encoding saved production event short URL.

**Independent Test**: Activate Download QR Code for alias `myevent`; assert canvas PNG export and filename encode `https://www.votiy.com/myevent`.

### Tests for User Story 1

- [x] T003 [US1] Add failing component tests for exact destination, PNG export, safe filename, keyboard-accessible action, and export failure in votiy-web/tests/component/event-short-link.test.jsx

### Implementation for User Story 1

- [x] T004 [US1] Render QR canvas and implement browser PNG download with actionable local error in votiy-web/src/features/events/EventShortLinkEditor.jsx
- [x] T005 [US1] Place Download QR Code beside Save short URL and style responsive action/preview layout in votiy-web/src/App.css

**Checkpoint**: User Story 1 works using persisted alias and no API mutation.

---

## Phase 4: User Story 2 - Understand QR Destination (Priority: P2)

**Goal**: Host sees exact destination and never downloads QR for unsaved alias.

**Independent Test**: Edit alias without saving, verify preview/download retain saved destination and notice appears; save alias and verify QR refreshes.

### Tests for User Story 2

- [x] T006 [US2] Add failing component tests for visible destination, unsaved notice, persisted-alias download, and post-save refresh in votiy-web/tests/component/event-short-link.test.jsx

### Implementation for User Story 2

- [x] T007 [US2] Add visible destination, dirty-state guidance, saved-alias refresh behavior, and accessible QR labeling in votiy-web/src/features/events/EventShortLinkEditor.jsx
- [x] T008 [US2] Add QR preview, destination wrapping, dirty notice, and mobile layout styling in votiy-web/src/App.css

**Checkpoint**: Both stories work independently and compose in existing short-link settings.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate behavior, quality, and production readiness.

- [x] T009 [P] Add critical host QR download browser scenario and documented manual scan coverage in tests/e2e/event-short-link-qr.spec.js and specs/024-event-qr-download/quickstart.md
- [x] T010 Run focused tests, full web tests, lint, production build, and spec quickstart; record completion in specs/024-event-qr-download/tasks.md

---

## Dependencies & Execution Order

- Phase 1 precedes all code and tests.
- T002 establishes destination/export boundary before story implementation.
- User Story 1 is MVP and precedes User Story 2 integration.
- Tests T003 and T006 must fail before matching implementation tasks.
- Polish follows both stories.

## Parallel Opportunities

- T009 documentation/browser scenario may proceed after T005 while User Story 2 component work continues.
- Validation commands within T010 may run in parallel when they do not share generated output.

## Implementation Strategy

1. Add one client dependency.
2. Build and validate persisted-alias PNG download as MVP.
3. Add preview clarity and unsaved-alias safety.
4. Run complete quality gates.

## Format Validation

- All tasks use checkbox, sequential task ID, required story label, and exact file path.
