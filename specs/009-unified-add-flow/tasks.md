# Tasks: Unified Add Flow

**Input**: Design documents from `/specs/009-unified-add-flow/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by specification, plan, and constitution at component, API regression, E2E,
accessibility, coverage, and production-smoke layers.

**Organization**: Tasks are grouped by independently testable user story. Tests precede implementation.

## Phase 1: Setup

**Purpose**: Add deterministic shared fixtures without changing runtime behavior.

- [x] T001 Create shared owner event, default/non-default category, account-choice, and Add Session fixture builders in `votiy-web/tests/support/unified-add-flow.js`
- [x] T002 [P] Create desktop/mobile host, non-owner, empty-event, and retry browser fixtures in `tests/e2e/fixtures/unified-add-flow.js`
- [x] T003 [P] Add stable category/entry idempotency and authorization test fixtures in `votiy-api/tests/support/unified-add-flow-fixtures.js`

---

## Phase 2: Foundational

**Purpose**: Establish reusable sheet state, accessibility shell, and event-level launch ownership shared
by both creation paths.

**CRITICAL**: Complete before user-story implementation.

- [x] T004 [P] Add Add Session reducer tests for choose/category/entry states, back, reset, retry key stability, and stale-category recovery in `votiy-web/tests/component/unified-add-session.test.js`
- [x] T005 Implement transient Add Session state transitions and idempotency-key lifecycle in `votiy-web/src/features/events/unified-add-session.js`
- [x] T006 [P] Add bottom-sheet contract tests for dialog naming, focus trap, Escape/backdrop/Close dismissal, heading focus, focus restoration, and disabled pending dismissal in `votiy-web/tests/component/UnifiedAddSheet.test.jsx`
- [x] T007 Build reusable accessible bottom-sheet shell and choose-type step in `votiy-web/src/features/events/UnifiedAddSheet.jsx`
- [x] T008 Add unified Add sheet, chooser, step, safe-area, short-viewport, 320px, and reduced-motion styling in `votiy-web/src/App.css`
- [x] T009 [P] Add shared event-workspace launch contract tests proving Add is owner-only, primary, adjacent to Settings, and available across Entries/Participants/Results in `votiy-web/tests/component/event-workspace-add-control.test.jsx`
- [x] T010 Mount one shared owner-only Add Session, functional sheet controller, and trigger beside Settings across Entries/Participants/Results without exposing it to public/non-owner views in `votiy-web/src/features/events/EventWorkspaceSummary.jsx` and `votiy-web/src/features/events/EventWorkspaceLayout.jsx`

**Checkpoint**: Owner can open and dismiss one accessible chooser from shared event summary; no persistence
action exists yet.

---

## Phase 3: User Story 1 - Choose What to Add (Priority: P1)

**Goal**: Host uses one primary Add button beside Settings and chooses Category or Entry.

**Independent Test**: Open event as host, activate Add, choose either option, navigate Back, dismiss with
every supported method, and verify non-host/anonymous viewers receive no control.

### Tests for User Story 1

- [x] T011 [P] [US1] Add owner/non-owner/public chooser tests for option labels, one-sheet invariant, dismissal without mutation, and focus restoration in `votiy-web/tests/component/unified-add-chooser.test.jsx`
- [x] T012 [P] [US1] Automate CUF chooser launch, Back, Close, Escape, backdrop, and direct non-owner denial on desktop/mobile in `tests/e2e/unified-add-flow.spec.js`

### Implementation for User Story 1

- [x] T013 [US1] Supply Entries event categories, mutation dependencies, and authoritative reload callback to shared Add controller in `votiy-web/src/features/events/OwnerEventPage.jsx`
- [x] T014 [US1] Supply Participants/Results event categories, mutation dependencies, and authoritative reload callbacks so shared Add sheet is fully functional from both routes in `votiy-web/src/features/events/OwnerEventParticipantsPage.jsx` and `votiy-web/src/features/events/OwnerEventResultsPage.jsx`
- [x] T015 [US1] Preserve legacy Add Category/Add Entry controls behind documented cutover until both replacement paths pass while preserving edit/remove/view behavior in `votiy-web/src/features/events/EventCategoryList.jsx`

**Checkpoint**: US1 provides one owner-only chooser on every content route while legacy launch controls
remain available until replacement Category and Entry paths pass.

---

## Phase 4: User Story 2 - Add a Category (Priority: P1)

**Goal**: Host creates a category inside shared Add sheet with existing rules.

**Independent Test**: Choose Category, save valid title, verify refreshed category/analytics, then test
empty, duplicate, conflict, retry, and authorization failures.

### Tests for User Story 2

- [x] T016 [P] [US2] Add category-step component tests for Back, Cancel, validation, duplicate/conflict errors, pending state, preserved input, retry idempotency, and success callback in `votiy-web/tests/component/unified-add-category.test.jsx`
- [x] T017 [P] [US2] Add API contract regressions proving existing category mutation shape, owner authorization, title validation, and idempotent replay remain unchanged in `votiy-api/tests/contract/unified-add-category.contract.test.js`
- [x] T018 [P] [US2] Add real-Mongo category regressions for owner success, non-owner/anonymous denial, duplicate title, replay, and authoritative event projection in `votiy-api/tests/integration/unified-add-category.test.js`
- [x] T019 [P] [US2] Automate CUF-001 valid, invalid, duplicate, conflict-refresh, retry, and analytics-refresh journeys on desktop/mobile in `tests/e2e/unified-add-flow.spec.js`

### Implementation for User Story 2

- [x] T020 [P] [US2] Build reusable category-title step using existing form components and inline error mapping in `votiy-web/src/features/events/AddCategoryStep.jsx`
- [x] T021 [US2] Compose `addEventCategory` into Category mode with stable idempotency key, authoritative reload, close, and focus behavior in `votiy-web/src/features/events/UnifiedAddSheet.jsx`
- [x] T022 [US2] Reuse legacy category validation/error behavior in shared Category step while retaining old launch/form until joint cutover in `votiy-web/src/features/events/EventCategoryList.jsx` and `votiy-web/src/features/events/AddCategoryStep.jsx`
- [x] T023 [US2] Ensure successful category creation refreshes workspace categories and category analytics without browser reload in `votiy-web/src/features/events/OwnerEventPage.jsx`

**Checkpoint**: US2 independently creates categories through Add; legacy launch remains until US3 passes
and joint cutover runs.

---

## Phase 5: User Story 3 - Add an Entry (Priority: P1)

**Goal**: Host selects required category, defaults to domain default, selects/creates owner, enters title,
and creates entry through shared Add sheet.

**Independent Test**: Create entries for existing and new owners in default and non-default categories;
verify Entries, analytics, and Participants refresh while invalid/replayed requests remain safe.

### Tests for User Story 3

- [x] T024 [P] [US3] Add category-selector tests for `isDefault` resolution, non-first default, user override, active-only choices, missing default, stale selection, and accessible errors in `votiy-web/tests/component/unified-add-entry-category.test.jsx`
- [x] T025 [P] [US3] Add composed Entry flow tests for recent/search owner, new account, Back-preserved values, title validation, retry key stability, success reload, and service failure in `votiy-web/tests/component/unified-add-entry.test.jsx`
- [x] T026 [P] [US3] Add API contract regressions proving existing owner-choice and entry-creation shapes, category ownership validation, provisional-owner validation, and replay behavior in `votiy-api/tests/contract/unified-add-entry.contract.test.js`
- [x] T027 [P] [US3] Add real-Mongo regressions for default/alternate category, existing/new owner, duplicate identity reuse, non-owner/anonymous denial, replay, and entry-derived participant projection in `votiy-api/tests/integration/unified-add-entry.test.js`
- [x] T028 [P] [US3] Automate CUF-002/CUF-003 existing owner, provisional owner, default override, missing default, retry, analytics refresh, and participant derivation on desktop/mobile in `tests/e2e/unified-add-flow.spec.js`

### Implementation for User Story 3

- [x] T029 [P] [US3] Build required active-category selector with `isDefault` resolution and safe unavailable recovery in `votiy-web/src/features/events/AddEntryCategoryStep.jsx`
- [x] T030 [US3] Refactor entry owner/title behavior into composable steps that preserve current recent search and new-account behavior in `votiy-web/src/features/events/AddEntryModal.jsx` and `votiy-web/src/features/events/AddEntryOwnerStep.jsx`
- [x] T031 [US3] Compose category, owner, and title steps into Entry mode with one stable submission key in `votiy-web/src/features/events/UnifiedAddSheet.jsx`
- [x] T032 [US3] Submit selected category through existing `createEventEntry` helper and map category/owner/title failures to their originating steps in `votiy-web/src/features/events/events.graphql.js` and `votiy-web/src/features/events/UnifiedAddSheet.jsx`
- [x] T033 [US3] Reload authoritative event categories, entries, analytics, and participant-derived state after successful Entry save in `votiy-web/src/features/events/OwnerEventPage.jsx`
- [x] T034 [US3] After Category and Entry replacement suites pass, remove legacy Add Category/Add Entry controls, inline add form, category-specific hooks, and old modal ownership in one cutover in `votiy-web/src/features/events/EventCategoryList.jsx` and `votiy-web/src/features/events/OwnerEventPage.jsx`

**Checkpoint**: US3 independently creates entries in selected categories and derives participants without
direct participant creation.

---

## Phase 6: User Story 4 - Remove Direct Participant Creation (Priority: P2)

**Goal**: Participants remains read/removal view of entry owners, with no direct creation form.

**Independent Test**: Open populated and empty Participants views; verify cards/removal remain, direct
creation controls/calls are absent, and empty state points host to Add Entry.

### Tests for User Story 4

- [x] T035 [P] [US4] Add participant-panel regressions for cards, counts, removal, loading/error, empty guidance, and absence of direct creation form/calls in `votiy-web/tests/component/event-participants-derived-only.test.jsx`
- [x] T036 [P] [US4] Add workspace authorization tests proving Add remains owner-only on Participants and direct legacy participant UI is absent for all viewers in `votiy-web/tests/component/event-workspace-add-authorization.test.jsx`
- [x] T037 [P] [US4] Automate CUF-004 populated/empty Participants, Add launch, derived refresh, and no direct participant creation on desktop/mobile in `tests/e2e/unified-add-flow.spec.js`

### Implementation for User Story 4

- [x] T038 [US4] Remove Add Participant disclosure, form state, validation, entry fields, and mutation dependency while preserving list/removal behavior in `votiy-web/src/features/events/EventParticipantsPanel.jsx`
- [x] T039 [US4] Replace empty participant copy with Add Entry guidance and route action through shared owner Add trigger in `votiy-web/src/features/events/EventParticipantsPanel.jsx` and `votiy-web/src/features/events/OwnerEventParticipantsPage.jsx`
- [x] T040 [US4] Remove obsolete participant-add props and imports from workspace routing/composition without deleting compatible API helpers in `votiy-web/src/app/AppRouter.jsx`, `votiy-web/src/features/events/OwnerEventParticipantsPage.jsx`, and `votiy-web/src/features/events/events.graphql.js`

**Checkpoint**: US4 independently presents Participants only as active entry owners.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Close compatibility, accessibility, observability, deployment, and coverage gates.

- [x] T041 [P] Extend responsive/accessibility coverage for 320px, short viewport, zoom, keyboard, focus trap, validation announcements, safe-area padding, and reduced motion in `tests/e2e/responsive-accessibility.spec.js`
- [x] T042 [P] Extend production smoke to verify owner Add availability, non-owner denial, category creation, entry creation, participant derivation, idempotent replay, and legacy public registration in `tests/smoke/production-smoke.js`
- [x] T043 [P] Add compatibility regressions proving category edit/remove, entry edit/delete, participant removal, public event, public registration, settings, voting, and photo flows remain unchanged in `votiy-web/tests/component/event-setup-view.test.jsx` and `tests/e2e/event-setup.spec.js`
- [x] T044 Add safe operation/correlation diagnostics and dashboard-equivalent query guidance for unified Add failures without logging account search terms or personal data in `docs/operations.md`
- [x] T045 Update host workflow and remove direct-participant instructions in `README.md`
- [x] T046 Add unified Add component/API regression/E2E/accessibility/smoke gates to deployment workflow in `.github/workflows/ci.yml`
- [x] T047 Run all automated/manual scenarios from `specs/009-unified-add-flow/quickstart.md` and record evidence in `specs/009-unified-add-flow/checklists/validation.md`
- [x] T048 Verify API and web repository line/branch coverage remain at least 80% and all Add state, authorization, default-category, retry, and failure branches execute in `votiy-api/vitest.config.js` and `votiy-web/vitest.config.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all stories.
- **US1 (Phase 3)**: Depends on Foundation; delivers shared chooser while legacy creation remains usable.
- **US2 (Phase 4)**: Depends on US1 sheet and event reload plumbing.
- **US3 (Phase 5)**: Depends on US1 sheet; may run alongside US2 after Foundation, but follows priority
  order for sole-contributor work.
- **US4 (Phase 6)**: Depends on US3 because Add Entry becomes replacement participant creation path.
- **Polish (Phase 7)**: Depends on selected user stories.

### User Story Dependency Graph

```text
Setup -> Foundation -> US1 -> US2
                          \-> US3 -> US4
US2 + US3 + US4 -> Polish
```

### Within Each User Story

- Tests fail meaningfully before implementation.
- Shared sheet/state before story-specific steps.
- Existing API contracts remain authoritative; UI never substitutes local success.
- Complete story checkpoint and regressions before moving forward.
- Commit/push only when user requests.

## Parallel Opportunities

- T002 and T003 create independent fixture layers.
- T004, T006, and T009 test separate foundational modules.
- US1 component and E2E tests can be authored in parallel.
- US2 component, contract, integration, and E2E tests target separate layers.
- US3 category, composed-flow, contract, integration, and E2E tests target separate layers.
- US4 component, authorization, and E2E tests target separate files.
- T041–T043 and T044–T045 target independent validation/docs surfaces.

## Parallel Examples

### User Story 2

```text
T016 category-step component tests
T017 API category contract regressions
T018 real-Mongo category regressions
T019 category E2E journeys
```

### User Story 3

```text
T024 category-selector component tests
T025 composed Entry flow component tests
T026 API Entry contract regressions
T027 real-Mongo Entry regressions
T028 Entry E2E journeys
```

### User Story 4

```text
T035 derived participant-panel tests
T036 cross-route Add authorization tests
T037 participant E2E journeys
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundation.
2. Complete US1, US2, and US3.
3. Validate shared Add button and functional Category/Entry flows on all three content routes.
4. Remove legacy Add Category/Add Entry controls only after both replacement suites pass.

### Incremental Delivery

1. Add Category path and validate existing category contracts.
2. Add Entry path with default-category and owner workflows.
3. Remove direct Participant creation only after Entry path works.
4. Run full compatibility, accessibility, smoke, and coverage gates.

## Format Validation

Every executable task uses required checklist format with checkbox, sequential task ID, optional `[P]`,
required story label in story phases, actionable description, and exact file path.
