# Tasks: Event Details Navigation

**Input**: Design documents from `/specs/008-event-details-navigation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required at unit, contract, real-Mongo integration, component, E2E, coverage, privacy, and
production-smoke layers by specification, plan, and constitution.

**Organization**: Tasks are grouped by independently testable user story. Tests precede implementation
and must fail for missing behavior first.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add image tooling and deterministic feature fixtures without changing runtime behavior.

- [X] T001 Add locked `sharp` 0.35.x dependency and native-load verification command in `votiy-api/package.json` and `votiy-api/pnpm-lock.yaml`
- [X] T002 [P] Create deterministic valid JPEG/PNG/WebP, corrupt, oversized, high-pixel, and metadata-bearing image fixtures in `votiy-api/tests/support/event-photo-fixtures.js`
- [X] T003 [P] Create host, non-owner, event-summary, photo, and tab browser fixtures in `tests/e2e/fixtures/event-details-navigation.js`
- [X] T004 [P] Add shared event-workspace mock builders for analytics, photo metadata, routes, and settings in `votiy-web/tests/support/event-workspace.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish additive persistence, metadata contracts, request security, and audit vocabulary
shared by every story.

**CRITICAL**: Complete before user-story implementation.

- [X] T005 [P] Add strict `eventPhotos` validator and unique-index contract tests in `votiy-api/tests/contract/event-photo-persistence.contract.test.js`
- [X] T006 Implement `eventPhotos` validator plus unique event/public lookup indexes in `votiy-api/src/repositories/indexes.js`
- [X] T007 Add repository contract tests for find, atomic upsert revision, delete, and bulk event lookup in `votiy-api/tests/contract/event-photo-repository.contract.test.js`
- [X] T008 Implement bounded binary photo persistence and safe metadata projections in `votiy-api/src/repositories/event-photo-repository.js`
- [X] T009 [P] Add shared same-origin/session mutation-security regression tests in `votiy-api/tests/unit/request-security.test.js` and `votiy-api/tests/contract/graphql-handler.contract.test.js`
- [X] T010 Extract reusable origin/header/session request checks without changing GraphQL behavior in `votiy-api/src/api/request-security.js` and `votiy-api/src/api/graphql/handler.js`
- [X] T011 [P] Add additive Event photo/analytics schema contract and legacy-operation compatibility assertions in `votiy-api/tests/contract/event-workspace-schema.contract.test.js` and `votiy-api/tests/contract/__snapshots__/schema.contract.test.js.snap`
- [X] T012 Add nullable `Event.photo`, nullable `Event.analytics`, and supporting GraphQL types in `votiy-api/src/api/graphql/schema.js`
- [X] T013 Add photo lifecycle audit names, safe metadata allowlist, media error codes, and log redaction paths in `votiy-api/src/repositories/audit-event-repository.js`, `votiy-api/src/domain/errors.js`, and `votiy-api/src/observability/logger.js`

**Checkpoint**: Photo storage and additive API vocabulary exist; all legacy contracts still pass.

---

## Phase 3: User Story 1 - Understand Event at a Glance (Priority: P1) — MVP

**Goal**: Host opens event and immediately sees photo/fallback, accurate category/participant/entry
analytics, settings access, title, description, and location.

**Independent Test**: Open populated and empty hosted events; verify summary order, exact active counts,
optional-field spacing, fallback, loading/error states, and refresh after entry/category mutations.

### Tests for User Story 1

- [X] T014 [P] [US1] Add unit tests for active category, entry, and distinct-owner analytics including archived and multi-entry cases in `votiy-api/tests/unit/event-analytics.test.js`
- [X] T015 [P] [US1] Add GraphQL contract tests proving `eventByPublicId` publicly supplies read-only analytics/photo without private owner data while legacy Event mutation projections may omit them in `votiy-api/tests/contract/event-workspace-summary.contract.test.js`
- [X] T016 [P] [US1] Add real-Mongo tests for authoritative populated/empty analytics, missing photo, and mutation reload consistency in `votiy-api/tests/integration/event-workspace-summary.test.js`
- [X] T017 [P] [US1] Add component tests for summary order, fallback, long/missing text, analytics, settings control, loading, and errors in `votiy-web/tests/component/event-workspace-summary.test.jsx`
- [X] T018 [P] [US1] Automate CUF-001 populated/empty summary and post-mutation analytics refresh on desktop/mobile in `tests/e2e/event-details-navigation.spec.js`

### Implementation for User Story 1

- [X] T019 [P] [US1] Implement active-source analytics derivation and invariants in `votiy-api/src/domain/event-analytics.js`
- [X] T020 [US1] Extend event-detail projection with authoritative analytics and nullable photo metadata in `votiy-api/src/services/event-service.js`
- [X] T021 [US1] Inject photo repository into event reads and preserve nullable legacy mutation projections in `votiy-api/src/server.js` and `votiy-api/src/api/graphql/event-resolvers.js`
- [X] T022 [P] [US1] Build count presentation with accessible labels in `votiy-web/src/features/events/EventAnalytics.jsx`
- [X] T023 [P] [US1] Build view-only event photo/fallback trigger shell in `votiy-web/src/features/events/EventPhoto.jsx`
- [X] T024 [US1] Build reusable host summary hierarchy and settings link in `votiy-web/src/features/events/EventWorkspaceSummary.jsx`
- [X] T025 [US1] Integrate summary above existing Entries content and refresh counts after mutations in `votiy-web/src/features/events/OwnerEventPage.jsx` and `votiy-web/src/features/events/events.graphql.js`
- [X] T026 [US1] Add responsive summary/photo/analytics styling matching supplied mock in `votiy-web/src/index.css`
- [X] T027 [US1] Emit privacy-safe workspace-read latency/count metrics and correlation fields in `votiy-api/src/services/event-service.js` and `votiy-api/src/observability/logger.js`

**Checkpoint**: US1 independently provides accurate at-a-glance event details while existing Entries
behavior remains unchanged.

---

## Phase 4: User Story 2 - Navigate Event Work by Tab (Priority: P1)

**Goal**: Host navigates URL-backed Entries, Participants, and Results views with stable context, browser
history, direct links, and keyboard semantics.

**Independent Test**: Move through all three routes, refresh each, use back/forward and keyboard activation,
and verify unchanged Entries/Participants content plus Results coming-soon state.

### Tests for User Story 2

- [X] T028 [P] [US2] Add route-contract tests for canonical base, participants, results, unknown paths, and history restoration in `votiy-web/tests/component/event-workspace-routing.test.jsx`
- [X] T029 [P] [US2] Add component tests for selected tab semantics, keyboard focus, content association, direct load, loading/failure states, and the 100 ms loaded-shell navigation budget in `votiy-web/tests/component/event-workspace-tabs.test.jsx`
- [X] T030 [P] [US2] Add participant regression tests proving existing owner cards/create flow remains unchanged while non-host/anonymous viewers receive no participant management controls in `votiy-web/tests/component/event-workspace-participants.test.jsx`
- [X] T031 [P] [US2] Automate CUF-002/CUF-003 direct links, refresh, back/forward, keyboard tabs, coming-soon state, 2-second p95 workspace visibility, public count readability, and non-host/anonymous control denial on desktop/mobile in `tests/e2e/event-details-navigation.spec.js`

### Implementation for User Story 2

- [X] T032 [P] [US2] Build URL-derived accessible Entries/Participants/Results navigation in `votiy-web/src/features/events/EventWorkspaceTabs.jsx`
- [X] T033 [US2] Build shared event loader, summary, tab, content, and focus layout in `votiy-web/src/features/events/EventWorkspaceLayout.jsx`
- [X] T034 [US2] Refactor base owner event page into Entries content while preserving category/add-entry behavior in `votiy-web/src/features/events/OwnerEventPage.jsx`
- [X] T035 [US2] Refactor participant page to reuse workspace layout and existing participant panel in `votiy-web/src/features/events/OwnerEventParticipantsPage.jsx`
- [X] T036 [P] [US2] Add static accessible Results coming-soon content in `votiy-web/src/features/events/OwnerEventResultsPage.jsx`
- [X] T037 [US2] Register canonical participants/results routes and not-found behavior, showing public read-only event context without owner controls to non-host/anonymous viewers in `votiy-web/src/app/AppRouter.jsx` and `votiy-web/src/features/events/EventWorkspaceLayout.jsx`
- [X] T038 [US2] Add tab, active-state, content-panel, long-label, and narrow/short viewport styling in `votiy-web/src/index.css`

**Checkpoint**: US2 independently supports deep-linkable event work without changing existing business
actions.

---

## Phase 5: User Story 3 - Manage Event Settings Separately (Priority: P2)

**Goal**: Host opens dedicated owner-only Settings from any content view; voting rules and code inventory
move there unchanged.

**Independent Test**: Open Settings from each tab, save rules, use Back, verify settings are absent from
content views, and deny direct non-owner/anonymous access.

### Tests for User Story 3

- [X] T039 [P] [US3] Add settings page component tests for loading, owner denial, Back, rule save/reload, conditional codes, and failures in `votiy-web/tests/component/event-settings-page.test.jsx`
- [X] T040 [P] [US3] Add routing tests for owner settings direct load and non-owner/anonymous denial in `votiy-web/tests/component/event-settings-routing.test.jsx`
- [X] T041 [P] [US3] Add regression tests proving rules/code controls no longer render on Entries, Participants, or Results in `votiy-web/tests/component/event-workspace-settings-relocation.test.jsx`
- [X] T042 [P] [US3] Automate CUF-004/CUF-006 settings navigation, save, Back, and direct unauthorized access on desktop/mobile in `tests/e2e/event-details-navigation.spec.js`

### Implementation for User Story 3

- [X] T043 [US3] Build owner-only settings loader with Back, existing rules editor, and conditional code manager in `votiy-web/src/features/events/EventSettingsPage.jsx`
- [X] T044 [US3] Remove voting rules/code controls from Entries and route settings control to dedicated page in `votiy-web/src/features/events/OwnerEventPage.jsx` and `votiy-web/src/features/events/EventWorkspaceSummary.jsx`
- [X] T045 [US3] Register protected settings route while retaining server-derived ownership denial in `votiy-web/src/app/AppRouter.jsx`
- [X] T046 [US3] Add simplified Back-oriented settings layout and responsive form spacing from mock in `votiy-web/src/index.css`
- [X] T047 [US3] Preserve rule conflict/failure focus and event refresh behavior after relocation in `votiy-web/src/features/voting/EventRulesEditor.jsx` and `votiy-web/src/features/events/EventSettingsPage.jsx`

**Checkpoint**: US3 independently separates configuration without losing existing settings behavior.

---

## Phase 6: User Story 4 - Represent Event with a Photo (Priority: P2)

**Goal**: Owner uploads a safely compressed event photo, previews it, replaces or confirms deletion; public
viewers may preview but never manage it.

**Independent Test**: Complete upload/GET/304/preview/replace/delete/fallback lifecycle; prove compression
bounds, rollback, ownership, origin, rate-limit, and public-view restrictions.

### Tests for User Story 4

- [X] T048 [P] [US4] Add unit tests for declared/decoded type, byte/pixel bounds, orientation, crop, no-upscale, metadata stripping, exact 80/70/60 quality ladder, rejection below quality 60, output limit, and processor errors in `votiy-api/tests/unit/event-photo.test.js`
- [X] T049 [P] [US4] Add HTTP contract tests for PUT/GET/HEAD/304/DELETE methods, headers, statuses, body limits, idempotency, safe errors, and caching in `votiy-api/tests/contract/event-photo-http.contract.test.js`
- [X] T050 [P] [US4] Add real-Mongo tests for initial upload, atomic replacement, delete, idempotent replay, failed-processing rollback, and photo projection in `votiy-api/tests/integration/event-photo-lifecycle.test.js`
- [X] T051 [P] [US4] Add real-Mongo authorization tests for owner, non-owner, anonymous, bad-origin, missing-header, and rate-limited mutations in `votiy-api/tests/integration/event-photo-authorization.test.js`
- [X] T052 [P] [US4] Add component tests for fallback, preview, upload progress, replace, delete confirmation/cancel, errors, public restrictions, Escape/backdrop close, and focus return in `votiy-web/tests/component/event-photo.test.jsx`
- [X] T053 [P] [US4] Automate CUF-005/CUF-006/CUF-007 photo lifecycle, public preview, and direct unauthorized requests on desktop/mobile in `tests/e2e/event-details-navigation.spec.js`
- [X] T054 [P] [US4] Add privacy tests proving logs/audits omit bytes, filename, metadata, checksum, session, and decoder errors in `votiy-api/tests/integration/event-photo-observability.test.js`

### Implementation for User Story 4

- [X] T055 [P] [US4] Implement raster validation, Sharp processing, fixed 80/70/60 WebP compression ladder, checksum, and safe metadata for already-bounded input in `votiy-api/src/domain/event-photo.js`
- [X] T056 [US4] Implement owner-authorized idempotent upload/replace/delete plus public read orchestration in `votiy-api/src/services/event-photo-service.js`
- [X] T057 [US4] Implement bounded raw-body streaming for PUT plus DELETE and public GET/HEAD/ETag/304 HTTP contracts in `votiy-api/src/api/event-photo-handler.js`
- [X] T058 [US4] Route photo endpoints before SPA fallback and preserve existing security headers in `votiy-api/src/app.js`
- [X] T059 [US4] Wire photo repository, processor, service, handler, session authentication, rate limiting, and event projection in `votiy-api/src/server.js`
- [X] T060 [US4] Add photo upload/replace/delete and public media request helpers in `votiy-web/src/features/events/event-photo.http.js`
- [X] T061 [P] [US4] Build accessible modal preview with owner management and public view-only variants in `votiy-web/src/features/events/EventPhotoDialog.jsx`
- [X] T062 [US4] Extend event photo trigger with preview, hidden file selection, progress, retry, replace, and confirmed delete in `votiy-web/src/features/events/EventPhoto.jsx`
- [X] T063 [US4] Integrate owner photo lifecycle and authoritative reload into shared summary in `votiy-web/src/features/events/EventWorkspaceSummary.jsx` and `votiy-web/src/features/events/EventWorkspaceLayout.jsx`
- [X] T064 [US4] Add public event photo/fallback preview without management controls in `votiy-web/src/features/events/EventPage.jsx`
- [X] T065 [US4] Add dialog, circular thumbnail, preview image, progress, error, destructive action, and reduced-motion styling in `votiy-web/src/index.css`
- [X] T066 [US4] Emit upload/read/delete metrics, correlation fields, safe audits, and processing/authorization denials in `votiy-api/src/services/event-photo-service.js`, `votiy-api/src/api/event-photo-handler.js`, and `votiy-api/src/observability/logger.js`

**Checkpoint**: All four stories independently functional; photo bytes remain compressed, bounded, and
owner-controlled.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Close compatibility, performance, accessibility, deployment, privacy, and operational gates.

- [X] T067 [P] Add 320px/short viewport, zoom, keyboard, focus-trap, announced-progress, fallback, long-content, and reduced-motion coverage in `tests/e2e/responsive-accessibility.spec.js`
- [X] T068 [P] Extend production smoke with no-photo fallback, synthetic upload/read/replace/delete, ETag/304, analytics, routes, authorization, audits, legacy voting checks, 2-second workspace-read budget, and critical-journey success recording in `tests/smoke/production-smoke.js`
- [X] T069 Add event photo limits, supported formats, storage sizing, native dependency, monitoring, smoke, and rollback runbook in `README.md` and `docs/operations.md`
- [X] T070 Add Sharp native-load, event workspace contract/integration/component/E2E/privacy, 100 ms loaded-shell and 2-second p95 workspace performance, and coverage gates before deployment in `.github/workflows/ci.yml`
- [X] T071 Add 99% workspace availability, 2-second workspace/read and 3-second photo-processing p95 budgets, upload/workspace error alerts, invariant diagnostics, safe correlation guidance, and dashboard-equivalent saved queries with first diagnostic actions in `render.yaml`, `tests/smoke/production-smoke.js`, and `docs/operations.md`
- [X] T072 Add compatibility regression proving event creation, dashboard, categories, entries, participants, voting rules/codes, public voting, and legacy GraphQL operations remain unchanged in `votiy-api/tests/contract/schema.contract.test.js`, `votiy-web/tests/component/event-setup-view.test.jsx`, and `tests/e2e/event-setup.spec.js`
- [X] T073 Run all automated and manual validations from `specs/008-event-details-navigation/quickstart.md` and record evidence in `specs/008-event-details-navigation/checklists/validation.md`
- [X] T074 Verify repository-wide line/branch coverage remains at least 80% and all photo validation, authorization, cache, rollback, analytics, and route branches are exercised in `votiy-api/vitest.config.js` and `votiy-web/vitest.config.js`
- [X] T075 Add cross-route component authorization tests proving public counts remain visible but Entries, Participants, Results, and Settings never expose owner controls to non-host/anonymous viewers in `votiy-web/tests/component/event-workspace-authorization.test.jsx`
- [X] T076 Add API/E2E authorization regression tests proving non-host/anonymous category, entry, participant, photo, and settings mutations are denied even when called directly in `votiy-api/tests/integration/event-workspace-authorization.test.js` and `tests/e2e/event-details-navigation.spec.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all stories.
- **US1 (Phase 3)**: Depends on Foundation. MVP.
- **US2 (Phase 4)**: Depends on US1 shared summary; preserves existing participant route.
- **US3 (Phase 5)**: Depends on US2 workspace routes and US1 settings control.
- **US4 (Phase 6)**: Depends on Foundation and US1 photo shell; can technically start after US1 while
  US2/US3 proceed, but sequential priority order is recommended for sole-contributor work.
- **Polish (Phase 7)**: Depends on all selected stories; full validation depends on all four.

### User Story Dependency Graph

```text
Setup -> Foundation -> US1 -> US2 -> US3
                         \
                          -> US4
US2 + US3 + US4 -> Polish
```

### Within Each User Story

- Write tests first and confirm meaningful failure.
- Domain/persistence before services; services before interfaces; interfaces before UI integration.
- API remains authoritative for analytics, photo safety, ownership, and persistence.
- Complete story checkpoint and regression suite before next sequential story.
- Commit/push only when user requests; retain prior instruction to validate stages before push.

### Parallel Opportunities

- T002–T004 target independent fixture modules.
- T005, T009, and T011 are independent foundational contracts.
- Each story’s `[P]` tests target distinct layers/files.
- T019, T022, and T023 can proceed together after US1 tests exist.
- T032 and T036 can proceed together.
- T048–T054 can be authored together before US4 implementation.
- T061 can proceed while server-side T055–T059 are built after contracts stabilize.
- T067–T068 can proceed together; T069 and T070 touch independent operational files.

## Parallel Examples

### User Story 1

```text
T014 analytics unit tests
T015 GraphQL summary contract tests
T016 real-Mongo summary tests
T017 summary component tests
T018 CUF-001 E2E
```

### User Story 2

```text
T028 route contract tests
T029 tab accessibility component tests
T030 participant regression tests
T031 CUF-002/CUF-003 E2E
```

### User Story 3

```text
T039 settings component tests
T040 settings routing tests
T041 relocation regressions
T042 CUF-004/CUF-006 E2E
```

### User Story 4

```text
T048 image-domain unit tests
T049 HTTP contract tests
T050 lifecycle integration tests
T051 authorization integration tests
T052 photo component tests
T053 photo lifecycle E2E
T054 privacy tests
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundation.
2. Complete US1 summary and analytics.
3. Validate accurate counts, fallback, responsive hierarchy, and unchanged Entries actions.
4. Stop for local review before navigation/settings/photo management if desired.

### Incremental Delivery

1. US1: at-a-glance event summary.
2. US2: stable tab navigation and Results placeholder.
3. US3: settings relocation.
4. US4: compressed photo lifecycle and public preview.
5. Polish: full compatibility, security, accessibility, operations, and production gates.

### Sole-Contributor Execution

- Work on `main` per project decision.
- Execute phases sequentially except safe `[P]` test/fixture work.
- Run targeted tests after each task group and full quality gates at every story checkpoint.
- Keep working tree unpushed until explicit user approval.

## Notes

- Every task uses required checkbox/ID/parallel/story/path format.
- Existing category, entry, participant, voting, registration, and ballot behavior is intentionally reused.
- Photo deletion removes bytes but preserves identifier-only audit history.
- No event-document migration is required; absent `eventPhotos` row means fallback.
