# Tasks: Event Voting Rules

**Input**: Design documents from `/specs/007-event-voting-rules/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required at unit, contract, real-Mongo integration, component, E2E, coverage, and production-smoke layers by specification and constitution.

**Organization**: Tasks grouped by independently testable user story. Tests precede implementation and must fail for missing behavior first.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish feature configuration, folders, and reusable test fixtures.

- [X] T001 Add `VOTING_CODE_ENCRYPTION_KEY` parsing, local-safe generation guidance, and production validation in `votiy-api/src/config/env.js` and `votiy-api/.env.example`
- [X] T002 [P] Create shared voting fixture builders for hosts, accounts, events, categories, entries, rules, codes, and ballots in `votiy-api/tests/support/event-voting-rules.js`
- [X] T003 [P] Create browser fixtures for unrestricted, account, and code voting journeys in `tests/e2e/fixtures/event-voting-rules.js`
- [X] T004 [P] Add voting GraphQL document module and initial typed constants in `votiy-web/src/features/voting/voting.graphql.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add storage, migration, security primitives, and additive API types shared by every story.

**CRITICAL**: Complete before user-story implementation.

- [X] T005 [P] Add persistence contract tests for event voting rules, access codes, voter access, ballots, validators, and indexes in `votiy-api/tests/contract/event-voting-persistence.contract.test.js`
- [X] T006 [P] Add migration tests for legacy, version-2, partial, malformed, version-3, and rerun fixtures in `votiy-api/tests/integration/event-voting-rules-migration.test.js`
- [X] T007 Add idempotent migration 005 with closed draft defaults and schema-version-3 transition in `votiy-api/src/migrations/005-event-voting-rules.js`
- [X] T008 Add event voting, code, voter-access, and ballot validators plus strict post-migration validation in `votiy-api/src/repositories/mongo.js`
- [X] T009 Add unique, partial, lifecycle, pagination, and account-limit indexes from persistence contract in `votiy-api/src/repositories/indexes.js`
- [X] T010 [P] Add unit tests for code generation, keyed digest, AES-256-GCM encryption, decryption, collision retry, and secret rejection in `votiy-api/tests/unit/voting-access-code.test.js`
- [X] T011 Implement six-character code generation, digest lookup, versioned encryption, and redaction helpers in `votiy-api/src/domain/voting-access-code.js`
- [X] T012 [P] Add repository contract tests for atomic code claims, immutable ballots, voter access uniqueness, and pagination in `votiy-api/tests/contract/event-voting-repositories.contract.test.js`
- [X] T013 Implement access-code CRUD/conditional-use operations in `votiy-api/src/repositories/voting-access-code-repository.js`
- [X] T014 [P] Implement event/account voter-access operations in `votiy-api/src/repositories/event-voter-access-repository.js`
- [X] T015 [P] Implement immutable ballot insert/count operations in `votiy-api/src/repositories/ballot-submission-repository.js`
- [X] T016 Extend additive GraphQL enums, inputs, result unions, event projection, queries, and mutations from contract in `votiy-api/src/api/graphql/schema.js`
- [X] T017 Update schema snapshots and prove all legacy GraphQL operations remain compatible in `votiy-api/tests/contract/schema.contract.test.js` and `votiy-api/tests/contract/__snapshots__/schema.contract.test.js.snap`

**Checkpoint**: Migration, storage, crypto, repositories, and additive contract ready.

---

## Phase 3: User Story 1 - Configure Event Voting Rules (Priority: P1) — MVP

**Goal**: Host reviews safe defaults and saves versioned voting window, category methods, and access settings; other users cannot edit.

**Independent Test**: Host loads defaults, saves every rule family, reloads exact state, and receives stale-write conflict while non-host receives denial.

### Tests for User Story 1

- [X] T018 [P] [US1] Add unit tests for defaults, window boundaries, category override resolution, multiple-selection bounds, and version transitions in `votiy-api/tests/unit/event-voting-rules.test.js`
- [X] T019 [P] [US1] Add GraphQL contract tests for `Event.voting` and `updateEventVotingRules` success/error shapes in `votiy-api/tests/contract/event-voting-rules.contract.test.js`
- [X] T020 [P] [US1] Add real-Mongo tests for host authorization, exact persistence, version increments, stale writes, and safe audits in `votiy-api/tests/integration/event-voting-rules.test.js`
- [X] T021 [P] [US1] Add component tests for defaults, conditional inputs, save/reload, conflict retention, loading, validation, and failure states in `votiy-web/tests/component/event-rules-editor.test.jsx`
- [X] T022 [P] [US1] Automate CUF-001 for host and direct non-host mutation on desktop/mobile in `tests/e2e/event-voting-rules.spec.js`

### Implementation for User Story 1

- [X] T023 [P] [US1] Implement rule defaults, normalization, effective category resolution, validation, and version transitions in `votiy-api/src/domain/event-voting-rules.js`
- [X] T024 [US1] Extend event creation/read/update persistence with embedded rules and optimistic concurrency in `votiy-api/src/repositories/event-repository.js`
- [X] T025 [US1] Implement host-only rules read/update orchestration, category checks, audits, and safe conflicts in `votiy-api/src/services/event-voting-rules-service.js`
- [X] T026 [US1] Wire event voting projection and rules mutation resolvers without changing legacy event fields in `votiy-api/src/api/graphql/event-resolvers.js`
- [X] T027 [P] [US1] Build category method and multiple-bound controls in `votiy-web/src/features/voting/CategoryVotingRuleFields.jsx`
- [X] T028 [US1] Build accessible host rules editor with conditional policy fields and concurrency-safe save in `votiy-web/src/features/voting/EventRulesEditor.jsx`
- [X] T029 [US1] Add host rules editor route/section and refresh event state after saves in `votiy-web/src/features/events/OwnerEventPage.jsx`
- [X] T030 [US1] Emit privacy-safe rules read/update metrics, correlation fields, and audit outcomes in `votiy-api/src/services/event-voting-rules-service.js` and `votiy-api/src/observability/logger.js`

**Checkpoint**: US1 independently functional; voting remains closed until valid configuration saved.

---

## Phase 4: User Story 2 - Enforce Voting Window and Category Method (Priority: P1)

**Goal**: Server accepts ballots only inside active window and only when every category ballot follows current method and active-entry rules.

**Independent Test**: Equivalent direct API submissions before/during/after window cover single, multiple, and complete-ranking methods; only valid in-window ballots persist.

### Tests for User Story 2

- [X] T031 [P] [US2] Add exhaustive unit tests for time boundaries, methods, duplicate/stale/archived IDs, empty categories, and rules-version changes in `votiy-api/tests/unit/ballot-submission.test.js`
- [X] T032 [P] [US2] Add GraphQL contract tests for capability and ballot submission result shapes and safe reason codes in `votiy-api/tests/contract/event-ballot.contract.test.js`
- [X] T033 [P] [US2] Add real-Mongo tests for immutable ballots, rule snapshots, transaction rollback, idempotency, and current-rule revalidation in `votiy-api/tests/integration/event-ballot-submission.test.js`
- [X] T034 [P] [US2] Add component tests for server capability states and single/multiple/ranking controls in `votiy-web/tests/component/event-ballot.test.jsx`
- [X] T035 [P] [US2] Automate CUF-002 plus direct API bypass attempts and window boundaries in `tests/e2e/event-voting-rules.spec.js`

### Implementation for User Story 2

- [X] T036 [P] [US2] Implement immutable ballot normalization and exhaustive category validation in `votiy-api/src/domain/ballot-submission.js`
- [X] T037 [US2] Implement authoritative capability evaluation and transactional ballot orchestration in `votiy-api/src/services/event-voting-service.js`
- [X] T038 [US2] Wire `eventVotingCapability` and `submitEventBallot` resolvers with fresh server-side checks in `votiy-api/src/api/graphql/event-resolvers.js`
- [X] T039 [US2] Build capability-driven accessible single, multiple, and ranking ballot UI in `votiy-web/src/features/voting/EventBallot.jsx`
- [X] T040 [US2] Route public event voting state without exposing host-only controls in `votiy-web/src/features/events/EventPage.jsx`
- [X] T041 [US2] Add privacy-safe eligibility/ballot metrics, denials, latency, and identifier-only audits in `votiy-api/src/services/event-voting-service.js` and `votiy-api/src/observability/logger.js`

**Checkpoint**: US2 works with unrestricted unlimited access; server owns all rule decisions.

---

## Phase 5: User Story 3 - Choose Voter Access Policy (Priority: P2)

**Goal**: Host chooses unrestricted, account, or code access; API enforces browser/account eligibility and keeps voter access separate from participation.

**Independent Test**: Each policy admits eligible voters, rejects missing identity/contact/limit conditions, and never creates participant or entry relationships from voting.

### Tests for User Story 3

- [X] T042 [P] [US3] Add unit decision-matrix tests for unrestricted repeats, browser markers, completed account fields, account limits, code account choice, and provisional email reuse in `votiy-api/tests/unit/voter-eligibility.test.js`
- [X] T043 [P] [US3] Add contract tests for capability reasons, provisional voter input, cookies, and private-field exclusion in `votiy-api/tests/contract/voter-access.contract.test.js`
- [X] T044 [P] [US3] Add real-Mongo tests for account limits, provisional account create/reuse, separate voter access, browser marker uniqueness, and rollback in `votiy-api/tests/integration/voter-access.test.js`
- [X] T045 [P] [US3] Add component tests for account prompts, provisional contact fields, remaining ballots, and browser-limit disclosure in `votiy-web/tests/component/voter-access.test.jsx`
- [X] T046 [P] [US3] Automate CUF-003 and CUF-005 with anonymous, incomplete, complete, provisional, participant, and non-participant identities in `tests/e2e/event-voting-rules.spec.js`

### Implementation for User Story 3

- [X] T047 [P] [US3] Implement eligibility matrix, account completeness, limits, and opaque browser-marker digest rules in `votiy-api/src/domain/voter-eligibility.js`
- [X] T048 [US3] Extend ballot transaction to create/reuse provisional accounts and upsert event voter access without participant side effects in `votiy-api/src/services/event-voting-service.js`
- [X] T049 [US3] Issue and validate secure HttpOnly same-site browser markers in `votiy-api/src/api/graphql/handler.js` and `votiy-api/src/api/graphql/session-context.js`
- [X] T050 [US3] Render server-provided access requirements, contact capture, limits, and browser disclosure in `votiy-web/src/features/voting/EventBallot.jsx`
- [X] T051 [US3] Verify participant projections ignore voter-access records and add regression coverage in `votiy-api/tests/integration/participant-entries.test.js`

**Checkpoint**: US3 policies independently demonstrable; only code inventory management remains.

---

## Phase 6: User Story 4 - Manage Voting Codes (Priority: P3)

**Goal**: Host generates and views encrypted one-time code inventory; successful ballot consumes code atomically and failed attempts leave it unused.

**Independent Test**: Host generates exact batch, authorized inventory reveals codes, non-host cannot list, and concurrent same-code ballots yield exactly one ballot/claim.

### Tests for User Story 4

- [X] T052 [P] [US4] Add unit tests for batch bounds, exact generation, collisions, lifecycle transitions, redaction, and terminal used/revoked states in `votiy-api/tests/unit/voting-code-management.test.js`
- [X] T053 [P] [US4] Add GraphQL contract tests for generation/list pagination, host-only claimant projection, and safe errors in `votiy-api/tests/contract/voting-code-management.contract.test.js`
- [X] T054 [P] [US4] Add real-Mongo race and failure-injection tests proving code/ballot/access/audit/idempotency atomicity in `votiy-api/tests/integration/voting-code-claim.test.js`
- [X] T055 [P] [US4] Add component tests for generation, inventory states, pagination, claimant visibility, loading, empty, and errors in `votiy-web/tests/component/voting-code-manager.test.jsx`
- [X] T056 [P] [US4] Automate CUF-004 code generation, successful consumption, inventory refresh, and rejected reuse in `tests/e2e/event-voting-rules.spec.js`

### Implementation for User Story 4

- [X] T057 [US4] Implement host-authorized bounded batch generation, collision retry, encrypted inventory, and pagination in `votiy-api/src/services/event-voting-service.js`
- [X] T058 [US4] Extend ballot transaction with conditional unused-code update, voter access, ballot, audits, and idempotency in `votiy-api/src/services/event-voting-service.js`
- [X] T059 [US4] Wire `generateVotingCodes` and `eventVotingCodes` resolvers with host-only projections in `votiy-api/src/api/graphql/event-resolvers.js`
- [X] T060 [US4] Build accessible host code generator and paginated used/unused inventory in `votiy-web/src/features/voting/VotingCodeManager.jsx`
- [X] T061 [US4] Integrate code manager into host rules area and refresh inventory after generation in `votiy-web/src/features/events/OwnerEventPage.jsx`
- [X] T062 [US4] Add code generation/consumption counters, claim-conflict alert fields, and redaction verification in `votiy-api/src/observability/logger.js` and `votiy-api/tests/integration/voting-code-claim.test.js`

**Checkpoint**: All four user stories functional and independently validated.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Close compatibility, quality, operational, performance, accessibility, and deployment gates.

- [X] T063 [P] Add narrow/short viewport, keyboard, focus, announced-status, and reduced-motion coverage for rules, codes, and ballots in `tests/e2e/responsive-accessibility.spec.js`
- [X] T064 [P] Extend production smoke with synthetic rule update, code generation, ballot, reuse denial, audit check, and legacy flow checks in `tests/smoke/production-smoke.js`
- [X] T065 Add migration 005, encryption key, readiness, privacy, code bounds, browser-limit caveat, smoke, and rollback operations to `README.md`
- [X] T066 Add CI execution for voting contract/integration/E2E/coverage gates before deployment in `.github/workflows/ci.yml`
- [X] T067 Add privacy scan proving logs/audits omit raw codes, contacts, choices, ranks, and browser tokens in `votiy-api/tests/integration/event-voting-observability.test.js`
- [X] T068 Add p95 rules/eligibility/ballot budgets, error-rate and migration/invariant alerts, and actionable diagnostics in `render.yaml` and `tests/smoke/production-smoke.js`
- [X] T069 Run all commands and manual validations in `specs/007-event-voting-rules/quickstart.md`, close every failure, and record evidence in `specs/007-event-voting-rules/checklists/validation.md`
- [X] T070 Verify repository-wide line/branch coverage stays at least 80% and every authorization, timing, method, access, limit, code-race, and rollback branch is covered in `votiy-api/vitest.config.js` and `votiy-web/vitest.config.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all stories.
- **US1 (Phase 3)**: Depends on Foundation. MVP.
- **US2 (Phase 4)**: Depends on Foundation and effective rules projection from US1.
- **US3 (Phase 5)**: Depends on Foundation and ballot transaction from US2.
- **US4 (Phase 6)**: Depends on Foundation, host policy from US1, ballot transaction from US2, and voter access from US3.
- **Polish (Phase 7)**: Depends on selected stories; full validation depends on all stories.

### User Story Dependency Graph

```text
Setup -> Foundation -> US1 -> US2 -> US3 -> US4 -> Polish
```

Each story remains independently testable at its checkpoint. Dependency means shared domain capability, not combined acceptance criteria.

### Within Each User Story

- Write tests first; confirm meaningful failure.
- Implement domain before persistence/service, service before resolver/UI.
- API remains authoritative; UI consumes capability projection.
- Finish story checkpoint and full regression suite before next story.

### Parallel Opportunities

- T002–T004 can run together after T001 assumptions known.
- T005–T006 and T010 can run together; T013–T015 can run together after contracts/security primitives.
- Within each story, tasks marked `[P]` target distinct test/component/domain files.
- T063–T064 and T067 can run together after story completion.

## Parallel Examples

### User Story 1

```text
T018 domain tests
T019 GraphQL contract tests
T020 real-Mongo authorization/concurrency tests
T021 component tests
T022 E2E CUF-001
```

### User Story 2

```text
T031 ballot decision tests
T032 submission contract tests
T033 transaction integration tests
T034 component tests
T035 E2E CUF-002
```

### User Story 3

```text
T042 eligibility matrix tests
T043 voter-access contract tests
T044 real-Mongo identity/limit tests
T045 component tests
T046 E2E CUF-003/CUF-005
```

### User Story 4

```text
T052 code lifecycle tests
T053 code API contract tests
T054 race/rollback integration tests
T055 component tests
T056 E2E CUF-004
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundation.
2. Complete US1 host rule configuration.
3. Run US1 checkpoint and regression suite.
4. Commit/push validated stage per project workflow.

### Incremental Delivery

1. US1: host rules and safe closed defaults.
2. US2: authoritative unrestricted ballot validation.
3. US3: browser/account/code access policy behavior.
4. US4: host code operations and atomic use.
5. Polish: full gates, observability, deployment evidence.

## Notes

- `[P]` means distinct files and no dependency on unfinished task.
- Never log raw codes, email, phone, ballot selections/ranks, or browser markers.
- Never hard-delete rules, codes, access, ballots, or audits.
- Commit/push only after applicable checkpoint validation succeeds.
