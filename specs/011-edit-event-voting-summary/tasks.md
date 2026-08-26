# Tasks: Event Details and Voting Summary

**Input**: Design documents from `/specs/011-edit-event-voting-summary/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Constitution requires tests first: unit, contract, real-Mongo integration, component, desktop/mobile E2E, smoke, privacy, observability, 80% line/branch coverage.

**Organization**: Tasks grouped by user story. Each story stays independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallel-safe; different files and no incomplete dependency
- **[Story]**: User story traceability label
- Every task includes exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire Feature 011 artifacts and test entry points.

- [X] T001 Register `specs/011-edit-event-voting-summary/contracts/schema-extension.graphql` in `votiy-api/src/api/graphql/schema.js`
- [X] T002 [P] Add reusable Feature 011 API fixtures for event details, conflicting rule overrides, and viewer roles in `votiy-api/tests/support/event-details-voting-fixtures.js`
- [X] T003 [P] Add reusable host/public/private Feature 011 browser setup helpers in `tests/e2e/fixtures/event-details-voting-summary.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Lock shared compatibility and privacy boundaries before story work.

**CRITICAL**: Finish before user story implementation.

- [X] T004 Add `event.details_updated` and `event.details_change_denied` privacy-safe audit names/metadata validation in `votiy-api/src/repositories/audit-event-repository.js`
- [X] T005 [P] Add Feature 011 audit fixture/assertion support that rejects event text, search content, voting rules, codes, and ballots in `votiy-api/tests/support/audit-assertions.js`
- [X] T006 [P] Add Feature 011 GraphQL operation/result fixtures for host, public, and private projections in `votiy-web/tests/support/event-details-voting-summary.js`
- [X] T007 Extend CI feature gate placeholders with Feature 011 API, web, build, desktop E2E, and mobile E2E commands in `.github/workflows/ci.yml`

**Checkpoint**: Contracts, fixtures, audit allowlist, CI entry points ready.

---

## Phase 3: User Story 1 - Edit Event Details (Priority: P1) MVP

**Goal**: Host edits title, description, location; changes propagate to event, dashboard, search; unauthorized, archived, stale writes fail.

**Independent Test**: Host changes all fields, reloads settings/event/search, clears optional fields, preserves stable link; non-host, archived, and stale attempts change nothing.

### Tests for User Story 1

> Write tests first. Confirm failure before implementation.

- [X] T008 [P] [US1] Add validation/service unit tests for trimming, null clearing, field limits, ownership, archival, stale conflict, CAS race, and safe logs in `votiy-api/tests/unit/event-details-service.test.js`
- [X] T009 [P] [US1] Add GraphQL schema/resolver contract tests for `UpdateEventDetailsInput`, `updateEventDetails`, `EventResult`, field errors, and correlation IDs in `votiy-api/tests/contract/event-details-update.contract.test.js`
- [X] T010 [P] [US1] Add repository contract tests for atomic source/search projection updates, stable IDs, active-owner filter, and expected timestamp in `votiy-api/tests/contract/event-details-persistence.contract.test.js`
- [X] T011 [P] [US1] Add real-Mongo tests for persistence, immediate old/new search matching, concurrent saves, non-host denial, archived denial, and audit privacy in `votiy-api/tests/integration/event-details-update.test.js`
- [X] T012 [P] [US1] Add component tests for prefill, save payload, null clearing, inline errors, duplicate-submit lock, success reload, conflict recovery, and archived read-only state in `votiy-web/tests/component/event-details-editor.test.jsx`
- [X] T013 [P] [US1] Add CUF-001 browser flow for host edit/reload/discovery plus unauthorized, archived, and stale cases in `tests/e2e/event-details-voting-summary.spec.js`

### Implementation for User Story 1

- [X] T014 [US1] Add `updateEventDetailsInputSchema` using event-creation normalization and timestamp validation in `votiy-api/src/domain/validation.js`
- [X] T015 [US1] Add atomic `updateDetails` repository compare-and-set that rebuilds all search fields in `votiy-api/src/repositories/event-repository.js`
- [X] T016 [US1] Implement host/lifecycle authorization, validation, stale recovery, changed-field calculation, safe logging, and event projection in `votiy-api/src/services/event-service.js`
- [X] T017 [US1] Expose mutation resolver and success/denial audit recording with correlation IDs in `votiy-api/src/api/graphql/event-resolvers.js`
- [X] T018 [US1] Add `UPDATE_EVENT_DETAILS` and `updateEventDetails()` client operation with field-error mapping in `votiy-web/src/features/events/events.graphql.js`
- [X] T019 [US1] Build controlled title/description/location form with loading, saving, success, validation, conflict, failure, and archived states in `votiy-web/src/features/events/EventDetailsEditor.jsx`
- [X] T020 [US1] Mount distinct Event details section, reload fresh concurrency tokens after save, and preserve other settings errors in `votiy-web/src/features/events/EventSettingsPage.jsx`
- [X] T021 [US1] Add responsive Event details form layout and status styling in `votiy-web/src/App.css`

**Checkpoint**: US1 independently functional. MVP ready.

---

## Phase 4: User Story 2 - Understand When and How to Vote (Priority: P1)

**Goal**: Eligible host/public event pages show local schedule plus exact access/method wording; private summaries disclose nothing.

**Independent Test**: All 3 access policies and 3 methods produce exact host/public sentences and valid timezone schedule; missing/invalid dates and private summaries render no schedule leak.

### Tests for User Story 2

- [X] T022 [P] [US2] Add pure mapping/format tests for exact 3×3 audience wording matrix, multiple bounds, local timezone, DST, invalid/partial dates, and unknown fail-closed values in `votiy-web/tests/component/event-voting-summary-state.test.js`
- [X] T023 [P] [US2] Add component tests for placement, semantic time values, wrapping, host/public audience, absent rules, and private omission in `votiy-web/tests/component/event-workspace-summary.test.jsx`
- [X] T024 [P] [US2] Add API/client privacy contract tests proving `PrivateEventSummary` excludes every voting summary source and triggers no capability request in `votiy-api/tests/contract/event-voting-summary-privacy.contract.test.js` and `votiy-web/tests/component/event-visibility.test.jsx`
- [X] T025 [P] [US2] Add CUF-002/CUF-003 browser coverage for schedule, exact wording, viewer roles, semantic times, and private minimization in `tests/e2e/event-details-voting-summary.spec.js`

### Implementation for User Story 2

- [X] T026 [US2] Implement pure audience/access/method wording and locale/timezone formatting helpers in `votiy-web/src/features/events/event-voting-summary.js`
- [X] T027 [US2] Render schedule, access sentence, and method sentence with semantic markup in `votiy-web/src/features/events/EventVotingSummary.jsx`
- [X] T028 [US2] Place voting summary after description/location and omit it for absent/private voting data in `votiy-web/src/features/events/EventWorkspaceSummary.jsx`
- [X] T029 [US2] Prevent private-detail capability fetch and retain server-minimized normalized object behavior in `votiy-web/src/features/events/EventPage.jsx` and `votiy-web/src/features/events/events.graphql.js`
- [X] T030 [US2] Correct UTC-to-local `datetime-local` display conversion while preserving local-to-UTC submission in `votiy-web/src/features/voting/EventRulesEditor.jsx`
- [X] T031 [US2] Add responsive voting-summary typography, wrapping, focus-neutral semantics, and reduced-motion-safe styling in `votiy-web/src/App.css`

**Checkpoint**: US2 exact wording, time, placement, privacy verified independently.

---

## Phase 5: User Story 3 - Configure One Voting Method Per Event (Priority: P2)

**Goal**: One event-wide method/bounds governs every category; legacy overrides remain stored but dormant and hidden.

**Independent Test**: Save each event method on multi-category event with conflicting legacy overrides; every ballot follows default, output override list stays empty, stored history survives, new categories inherit, invalid bounds block voting.

### Tests for User Story 3

- [X] T032 [P] [US3] Add domain tests proving event default always resolves, legacy input cannot mutate overrides, dormant history survives saves, and multiple bounds/readiness cover all active categories in `votiy-api/tests/unit/event-voting-rules.test.js`
- [X] T033 [P] [US3] Add ballot tests proving single/multiple/ranking apply identically across categories despite conflicting stored overrides and prior ballot records remain unchanged in `votiy-api/tests/unit/ballot-submission.test.js`
- [X] T034 [P] [US3] Add GraphQL compatibility tests for accepted legacy `categoryRules`, empty active output, sole `defaultCategoryRule`, and no dormant private exposure in `votiy-api/tests/contract/event-wide-voting-method.contract.test.js`
- [X] T035 [P] [US3] Add real-Mongo tests for dormant override preservation across save/restart, new-category inheritance, live entry readiness, and defensive ballot rejection in `votiy-api/tests/integration/event-wide-voting-method.test.js`
- [X] T036 [P] [US3] Add editor tests for exactly one method, no category fieldsets, one bounds pair, empty compatibility list, and blocking-category feedback in `votiy-web/tests/component/event-rules-editor.test.jsx`
- [X] T037 [P] [US3] Add ballot component tests proving `defaultCategoryRule` renders every category and ignores supplied legacy `categoryRules` in `votiy-web/tests/component/event-ballot.test.jsx`
- [X] T038 [P] [US3] Add CUF-004 browser coverage for method changes, multi-category enforcement, inheritance, invalid readiness, and preserved history in `tests/e2e/event-details-voting-summary.spec.js`

### Implementation for User Story 3

- [X] T039 [US3] Make `effectiveCategoryRule()` always return default method/bounds and make rule configuration preserve existing overrides unchanged in `votiy-api/src/domain/event-voting-rules.js`
- [X] T040 [US3] Add all-active-category multiple-bound readiness validation and safe blocking-category errors in `votiy-api/src/services/event-voting-rules-service.js`
- [X] T041 [US3] Defensively enforce event-wide rule and live category readiness during capability and submission in `votiy-api/src/services/event-voting-service.js` and `votiy-api/src/domain/ballot-submission.js`
- [X] T042 [US3] Return empty active `categoryRules` while retaining internal dormant values in `votiy-api/src/domain/event.js`
- [X] T043 [US3] Remove category rule state/fieldsets, submit one default rule plus empty compatibility list, and show readiness errors in `votiy-web/src/features/voting/EventRulesEditor.jsx`
- [X] T044 [US3] Render all ballot categories from `defaultCategoryRule` only in `votiy-web/src/features/voting/EventBallot.jsx`
- [X] T045 [US3] Remove dormant category-rule selections from current event/capability client fragments while retaining compatible empty list handling in `votiy-web/src/features/events/events.graphql.js` and `votiy-web/src/features/voting/voting.graphql.js`

**Checkpoint**: US3 event-wide behavior enforced end to end; rollback data preserved.

---

## Phase 6: User Story 4 - Configure Code Account Requirement Clearly (Priority: P3)

**Goal**: Completed-account option becomes accessible polished switch with visible state/help and unchanged saved behavior.

**Independent Test**: Keyboard, pointer, touch toggle both states; dependent ballot limit follows; save/reload works at 320px, 200% zoom, reduced motion.

### Tests for User Story 4

- [X] T046 [P] [US4] Add switch component tests for role/name, checked state, Space activation, state text, help association, dependent field, save payload, and reload in `votiy-web/tests/component/event-rules-editor.test.jsx`
- [X] T047 [P] [US4] Add CUF-005 mobile/desktop accessibility coverage for keyboard, touch target, focus, zoom, overflow, and reduced motion in `tests/e2e/responsive-accessibility.spec.js`

### Implementation for User Story 4

- [X] T048 [US4] Replace completed-account checkbox presentation with native checkbox `role="switch"`, persistent label, state text, help, and dependent field semantics in `votiy-web/src/features/voting/EventRulesEditor.jsx`
- [X] T049 [US4] Add 44px switch track/thumb, visible checked/unchecked/focus/disabled states, responsive layout, and reduced-motion rules in `votiy-web/src/App.css`

**Checkpoint**: US4 interaction and saved eligibility semantics verified independently.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Production gates, observability, docs, regression, rollback.

- [X] T050 [P] Extend production synthetic smoke for event detail save, event-wide rule projection, summary source data, and legacy compatibility in `tests/smoke/production-smoke.js`
- [X] T051 [P] Add privacy-safe log/audit assertions plus update latency/error signal coverage in `votiy-api/tests/integration/event-details-observability.test.js`
- [X] T052 [P] Document settings, summary wording, event-wide method, dormant rollback rule, and operational signals in `README.md` and `docs/operations.md`
- [X] T053 Run API/web coverage, lint, formatting, production build, focused desktop/mobile E2E, smoke, and full regression commands from `specs/011-edit-event-voting-summary/quickstart.md`
- [X] T054 Verify 80% line/branch floors and close uncovered authorization, ownership, privacy, vote-integrity, concurrency, and unknown-rule decision paths in `votiy-api/tests/` and `votiy-web/tests/`
- [X] T055 Validate rollback against prior tested commit without data rewrite and record result in `specs/011-edit-event-voting-summary/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: Start immediately.
- **Foundational**: Depends on Setup; blocks story implementation.
- **US1**: Depends on Foundational. MVP.
- **US2**: Depends on Foundational; can run beside US1.
- **US3**: Depends on Foundational; can run beside US1/US2, but US2 method-summary final validation needs US3 active projection.
- **US4**: Depends on Foundational; shares editor file with US3, so run after T043 or coordinate ownership.
- **Polish**: Depends on selected stories; full release requires all stories.

### User Story Completion Order

```text
Setup -> Foundational -> US1
                    -> US2
                    -> US3 -> US4
US1 + US2 + US3 + US4 -> Polish
```

### Within Each Story

- Write tests first; confirm failure.
- Domain/data before service.
- Service before resolver/client.
- Client operation before UI integration.
- Core behavior before E2E completion.
- Finish independent test before next story checkpoint.

## Parallel Opportunities

- T002–T003 parallel.
- T005–T006 parallel after T004 is not required; both can start with T004.
- US1 tests T008–T013 parallel.
- US2 tests T022–T025 parallel.
- US3 tests T032–T038 parallel.
- US4 tests T046–T047 parallel.
- US1, US2, US3 can begin in parallel after Foundational; avoid same-file edits.
- T050–T052 parallel; T053–T055 follow implementation.

## Parallel Examples

### User Story 1

```text
Task: T008 API validation/service unit tests
Task: T009 GraphQL contract tests
Task: T010 persistence contract tests
Task: T011 real-Mongo integration tests
Task: T012 web component tests
Task: T013 browser flow
```

### User Story 2

```text
Task: T022 wording/time unit tests
Task: T023 summary component tests
Task: T024 privacy contract tests
Task: T025 browser wording/privacy flow
```

### User Story 3

```text
Task: T032 voting-rule domain tests
Task: T033 ballot domain tests
Task: T034 compatibility contract tests
Task: T035 real-Mongo preservation tests
Task: T036 editor tests
Task: T037 ballot component tests
Task: T038 browser method flow
```

## Implementation Strategy

### MVP First

1. Finish Setup and Foundational.
2. Finish US1.
3. Run US1 independent test and coverage.
4. Demo host detail editing and search propagation.

### Incremental Delivery

1. US1: editable event details.
2. US2: understandable schedule/rules with privacy.
3. US3: one authoritative event method with reversible history.
4. US4: accessible completed-account switch.
5. Polish: production gates, docs, observability, rollback.

## Notes

- `[P]` means parallel-safe based on file/dependency ownership.
- Never delete or overwrite dormant category overrides.
- Never expose voting summary source fields in private summaries.
- Never log event text, search text, voting rules, codes, or ballots.
- Commit after each task or coherent task group.
