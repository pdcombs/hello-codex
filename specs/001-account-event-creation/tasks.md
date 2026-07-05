# Tasks: Account, Event, and Participant Registration

**Input**: Design documents from `/specs/001-account-event-creation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/schema.graphql`, `quickstart.md`

**Tests**: Layered automated coverage is required by the feature specification and Votiy Constitution. Write each story's tests first and confirm they fail for the intended missing behavior before implementation.

**Organization**: Tasks are grouped by user story so each story can be implemented, demonstrated, and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on an incomplete task
- **[Story]**: Maps the task to User Story 1, 2, or 3
- Every task names the file or directory it changes

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the planned runtime and test tooling and make local dependencies reproducible.

- [ ] T001 Add root workspace scripts and Playwright/Vitest development dependencies in `package.json` and `pnpm-lock.yaml`
- [ ] T002 [P] Add GraphQL, Zod, Argon2, cookie parsing, Pino, Vitest, and test-support dependencies in `votiy-api/package.json` and `votiy-api/pnpm-lock.yaml`
- [ ] T003 [P] Add React Router, Zod, Vitest, React Testing Library, and jsdom dependencies in `votiy-web/package.json` and `votiy-web/pnpm-lock.yaml`
- [ ] T004 Add Mailpit service, health check, and local networking configuration in `compose.yaml`
- [ ] T005 [P] Document all local API configuration keys without secrets in `votiy-api/.env.example`
- [ ] T006 [P] Add the Vite same-origin API proxy and frontend test configuration in `votiy-web/vite.config.js`
- [ ] T007 [P] Configure root Playwright projects, web server startup, and test artifact retention in `playwright.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the application boundaries, security primitives, persistence contracts, test harnesses, and delivery gates required by every story.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [ ] T008 Refactor process startup and static serving from `votiy-api/server.js` into an application factory in `votiy-api/src/app.js` and entry point in `votiy-api/src/server.js`
- [ ] T009 [P] Implement validated environment loading for database, origin, session, token, email, and logging settings in `votiy-api/src/config/env.js`
- [ ] T010 [P] Implement stable error codes, typed application errors, and safe client error mapping in `votiy-api/src/domain/errors.js`
- [ ] T011 [P] Implement email normalization, cryptographic token generation/digests, constant-time comparison, and idempotency request digests in `votiy-api/src/domain/security.js`
- [ ] T012 [P] Implement event text and account input schemas with documented length limits in `votiy-api/src/domain/validation.js`
- [ ] T013 Implement MongoDB connection lifecycle and dependency readiness checks in `votiy-api/src/repositories/mongo.js`
- [ ] T014 Create MongoDB collection validators and all indexes from `data-model.md` in `votiy-api/src/repositories/indexes.js`
- [ ] T015 [P] Implement correlation IDs, structured request-completion logs, secret redaction, and operation timing in `votiy-api/src/observability/logger.js` and `votiy-api/src/observability/request-context.js`
- [ ] T016 [P] Implement immutable allowlisted audit-event persistence in `votiy-api/src/repositories/audit-event-repository.js`
- [ ] T017 Implement `/health` liveness and MongoDB/config-aware `/ready` endpoints in `votiy-api/src/api/health.js`
- [ ] T018 Implement GraphQL schema loading, custom `DateTime` scalar, typed result unions, and production introspection controls from `specs/001-account-event-creation/contracts/schema.graphql` in `votiy-api/src/api/graphql/schema.js`
- [ ] T019 Implement bounded GraphQL request parsing, same-origin mutation enforcement, rate-limit hooks, and correlation-aware error handling in `votiy-api/src/api/graphql/handler.js`
- [ ] T020 [P] Create a same-origin GraphQL client with credentials, typed result handling, and correlation-aware failures in `votiy-web/src/lib/graphql.js`
- [ ] T021 [P] Create the React application router, protected-route shell, public-route shell, and accessible error boundary in `votiy-web/src/app/AppRouter.jsx` and `votiy-web/src/app/AppErrorBoundary.jsx`
- [ ] T022 [P] Configure backend and frontend Vitest coverage with 80% line and branch thresholds in `votiy-api/vitest.config.js` and `votiy-web/vitest.config.js`
- [ ] T023 [P] Create isolated real-Mongo test lifecycle, database cleanup, and deterministic fake-email fixtures in `votiy-api/tests/support/mongo.js` and `votiy-api/tests/support/fake-email.js`
- [ ] T024 [P] Add GraphQL schema snapshot, client-operation validation, and MongoDB validator/index contract harnesses in `votiy-api/tests/contract/schema.contract.test.js` and `votiy-api/tests/contract/persistence.contract.test.js`
- [ ] T025 Replace the current lint/build-only workflow with frozen install, formatting, lint, coverage, contract, real-Mongo integration, Playwright, and production-build gates in `.github/workflows/ci.yml`

**Checkpoint**: The application can start through the new boundaries, report liveness/readiness, run every test layer, and block deployment when a quality gate fails.

---

## Phase 3: User Story 1 - Create an Account (Priority: P1) 🎯 MVP

**Goal**: A visitor registers, verifies email ownership through a single-use link, enters an authenticated session, and sees an authenticated empty state.

**Independent Test**: Register an unused normalized email, retrieve and consume its verification link, confirm an authenticated empty dashboard, and verify that duplicate, invalid, expired, replayed, and superseded submissions fail safely.

### Tests for User Story 1 ⚠️

- [ ] T026 [P] [US1] Write failing unit tests for normalization, password policy/hashing, verification lifecycle, duplicate suppression, and registration idempotency in `votiy-api/tests/unit/registration-service.test.js` and `votiy-api/tests/unit/verification-service.test.js`
- [ ] T027 [P] [US1] Write failing GraphQL contract tests for `register`, `verifyEmail`, `resendVerification`, `viewer`, and safe error unions in `votiy-api/tests/contract/account.contract.test.js`
- [ ] T028 [P] [US1] Write failing real-Mongo integration tests for unique normalized emails, verification atomicity/expiry, session creation, and fake-email delivery in `votiy-api/tests/integration/account-registration.test.js`
- [ ] T029 [P] [US1] Write failing component tests for registration, verification, authenticated empty, loading, field-error, and recoverable-failure states in `votiy-web/tests/component/registration.test.jsx` and `votiy-web/tests/component/verification.test.jsx`
- [ ] T030 [P] [US1] Write the failing CUF-001 registration-through-verification browser flow using Mailpit in `tests/e2e/new-host-registration.spec.js`

### Implementation for User Story 1

- [ ] T031 [P] [US1] Implement Account and EmailVerification document mapping and validation in `votiy-api/src/domain/account.js` and `votiy-api/src/domain/email-verification.js`
- [ ] T032 [P] [US1] Implement opaque Session document mapping, cookie options, rotation, expiry, and revocation primitives in `votiy-api/src/domain/session.js`
- [ ] T033 [P] [US1] Implement account, verification, session, and idempotency persistence operations in `votiy-api/src/repositories/account-repository.js`, `votiy-api/src/repositories/verification-repository.js`, `votiy-api/src/repositories/session-repository.js`, and `votiy-api/src/repositories/idempotency-repository.js`
- [ ] T034 [P] [US1] Define the transactional email interface plus deterministic fake, Mailpit SMTP, and production-provider adapters in `votiy-api/src/email/email-sender.js`, `votiy-api/src/email/mailpit-sender.js`, and `votiy-api/src/email/provider-sender.js`
- [ ] T035 [US1] Implement atomic registration, Argon2id hashing, safe duplicate guidance, idempotent retries, and verification-email issuance in `votiy-api/src/services/registration-service.js`
- [ ] T036 [US1] Implement single-use verification, supersession, expiry, account transition, and authenticated session rotation in `votiy-api/src/services/verification-service.js`
- [ ] T037 [US1] Implement viewer authentication and verified-session middleware with secure cookie issuance in `votiy-api/src/services/session-service.js` and `votiy-api/src/api/graphql/session-context.js`
- [ ] T038 [US1] Wire account queries/mutations and registration/verification audit events in `votiy-api/src/api/graphql/account-resolvers.js`
- [ ] T039 [P] [US1] Add checked-in account GraphQL operations in `votiy-web/src/features/auth/account.graphql.js`
- [ ] T040 [US1] Build accessible registration and verification pages with loading, success, validation, replay, expiry, and service-failure states in `votiy-web/src/features/auth/RegisterPage.jsx` and `votiy-web/src/features/auth/VerifyEmailPage.jsx`
- [ ] T041 [US1] Build authenticated viewer state and empty event dashboard in `votiy-web/src/features/auth/AuthProvider.jsx` and `votiy-web/src/features/events/EventDashboardPage.jsx`
- [ ] T042 [US1] Emit registration, verification, email-send, and authentication-denial metrics/log events without email addresses or secrets in `votiy-api/src/services/registration-service.js` and `votiy-api/src/services/verification-service.js`

**Checkpoint**: User Story 1 passes its unit, contract, integration, component, and E2E tests independently and constitutes the first deployable MVP slice.

---

## Phase 4: User Story 2 - Return to an Account (Priority: P2)

**Goal**: A verified account owner signs in, resumes an authenticated session, sees their event area, and signs out securely without account-disclosure leaks.

**Independent Test**: Sign in with valid credentials, confirm the authenticated event area, sign out, and verify that invalid credentials, expired sessions, revoked sessions, and unverified accounts never grant protected access or reveal account existence.

### Tests for User Story 2 ⚠️

- [ ] T043 [P] [US2] Write failing unit tests for credential verification, session rotation, expiry, throttled last-seen updates, revocation, and safe failure messages in `votiy-api/tests/unit/authentication-service.test.js`
- [ ] T044 [P] [US2] Write failing GraphQL and cookie contract tests for `signIn`, `signOut`, and `viewer` in `votiy-api/tests/contract/session.contract.test.js`
- [ ] T045 [P] [US2] Write failing real-Mongo integration tests for sign-in, concurrent sessions, expiry, credential-version mismatch, and sign-out invalidation in `votiy-api/tests/integration/session-lifecycle.test.js`
- [ ] T046 [P] [US2] Write failing component tests for sign-in, invalid credentials, expired session, protected navigation, and sign-out states in `votiy-web/tests/component/session.test.jsx`
- [ ] T047 [P] [US2] Write the failing CUF-002 returning-host browser flow in `tests/e2e/returning-host.spec.js`

### Implementation for User Story 2

- [ ] T048 [US2] Implement sign-in throttling, constant-behavior credential failures, verified-account checks, session rotation, viewer lookup, and sign-out in `votiy-api/src/services/authentication-service.js`
- [ ] T049 [US2] Wire `signIn`, `signOut`, and `viewer` resolvers plus authentication audit outcomes in `votiy-api/src/api/graphql/session-resolvers.js`
- [ ] T050 [P] [US2] Add checked-in session GraphQL operations in `votiy-web/src/features/auth/session.graphql.js`
- [ ] T051 [US2] Build accessible sign-in and sign-out flows with loading, safe invalid-credential, expired-session, and recoverable-failure states in `votiy-web/src/features/auth/SignInPage.jsx` and `votiy-web/src/features/auth/SignOutButton.jsx`
- [ ] T052 [US2] Update authenticated routing to refresh viewer state, redirect ended sessions, and preserve safe return destinations in `votiy-web/src/features/auth/AuthProvider.jsx` and `votiy-web/src/app/AppRouter.jsx`
- [ ] T053 [US2] Emit sign-in success/failure, session expiry, and sign-out logs/metrics with correlation IDs and no credentials in `votiy-api/src/services/authentication-service.js`

**Checkpoint**: User Stories 1 and 2 both pass independently; a user can establish, resume, and safely end account access.

---

## Phase 5: User Story 3 - Create a Minimal Event (Priority: P3)

**Goal**: A verified host creates and revisits multiple voting events, chooses OPEN or ADMIN_MANAGED participant registration, and manages participant records linked to completed or provisional accounts.

**Independent Test**: Create multiple events with ADMIN_MANAGED default behavior, revisit them after a new session, view every direct link anonymously, self-register for an OPEN event, deny self-registration for ADMIN_MANAGED, add participants by email/phone as provisional accounts, reuse those accounts across events, and remove a participant.

### Tests for User Story 3 ⚠️

- [ ] T054 [P] [US3] Write failing unit tests for event validation, Unicode preservation, public IDs, immutable ownership, registration-policy decisions, provisional-account reuse, participant transitions, and idempotency in `votiy-api/tests/unit/event-service.test.js` and `votiy-api/tests/unit/event-registration-service.test.js`
- [ ] T055 [P] [US3] Write failing GraphQL contract tests for all event queries/mutations and stable authorization/error unions in `votiy-api/tests/contract/event.contract.test.js`
- [ ] T056 [P] [US3] Write failing persistence contract tests for event/access validators and unique/compound/partial indexes in `votiy-api/tests/contract/event-persistence.contract.test.js`
- [ ] T057 [P] [US3] Write failing real-Mongo integration tests for ownership, multiple events, duplicate retries, direct-link reads, OPEN self-registration, ADMIN_MANAGED denial, provisional accounts, removal, and concurrent policy changes in `votiy-api/tests/integration/event-lifecycle.test.js`
- [ ] T058 [P] [US3] Write failing component tests for event form, event list/detail, empty/loading/error states, registration-policy controls, and participant management in `votiy-web/tests/component/events.test.jsx`
- [ ] T059 [P] [US3] Extend the failing CUF-001 browser flow through OPEN/ADMIN_MANAGED event creation and persistence in `tests/e2e/new-host-events.spec.js`
- [ ] T060 [P] [US3] Write the failing CUF-003 direct-link, self-registration, provisional-account, and host participant-management browser flow in `tests/e2e/event-registration.spec.js`

### Implementation for User Story 3

- [ ] T061 [P] [US3] Implement Event and EventRegistration document mapping, validation, state transitions, and authorization policy in `votiy-api/src/domain/event.js` and `votiy-api/src/domain/event-registration.js`
- [ ] T062 [P] [US3] Implement event and participant-registration persistence with owner/public-ID lookups and atomic account reuse/creation in `votiy-api/src/repositories/event-repository.js` and `votiy-api/src/repositories/event-registration-repository.js`
- [ ] T063 [US3] Implement verified-owner event creation, ADMIN_MANAGED default policy, unguessable public IDs, multiple-event listing, and idempotent retries in `votiy-api/src/services/event-service.js`
- [ ] T064 [US3] Implement direct-link reads, owner policy changes, OPEN self-registration, ADMIN_MANAGED creator registration, provisional account creation/reuse, listing, and removal without notifications in `votiy-api/src/services/event-registration-service.js`
- [ ] T065 [US3] Wire event and participant-registration queries/mutations with creator authorization and domain audit events in `votiy-api/src/api/graphql/event-resolvers.js`
- [ ] T066 [P] [US3] Add checked-in event and access GraphQL operations in `votiy-web/src/features/events/events.graphql.js`
- [ ] T067 [US3] Build the accessible event creation form with private default, optional fields, client/server validation, duplicate-submit protection, and success/failure states in `votiy-web/src/features/events/CreateEventPage.jsx`
- [ ] T068 [US3] Build owner event list and detail pages with persisted empty/loading/error states and registration-policy controls in `votiy-web/src/features/events/EventDashboardPage.jsx` and `votiy-web/src/features/events/OwnerEventPage.jsx`
- [ ] T069 [US3] Build anonymous and signed-in direct-link event rendering with OPEN self-registration state in `votiy-web/src/features/events/EventPage.jsx`
- [ ] T070 [US3] Build creator participant add/list/remove flows for email and phone identifiers, showing provisional status without sending links in `votiy-web/src/features/events/EventParticipantsPanel.jsx`
- [ ] T071 [US3] Emit event creation, policy change, participant add/remove, provisional-account creation, self-registration, and authorization-denial audit/log/metric events in `votiy-api/src/services/event-service.js` and `votiy-api/src/services/event-registration-service.js`

**Checkpoint**: All three user stories and CUF-001 through CUF-003 pass independently with authorization enforced by the API.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Close repository-wide quality, accessibility, operations, and production-delivery obligations.

- [ ] T072 [P] Add accessible responsive navigation, focus management, and shared loading/empty/error components in `votiy-web/src/components/` and global styles in `votiy-web/src/index.css`
- [ ] T073 [P] Add backend dependency-outage, request-size, rate-limit, origin, log-redaction, and markup-like text security tests in `votiy-api/tests/integration/security-and-failures.test.js`
- [ ] T074 [P] Add frontend accessibility checks and mobile/desktop viewport coverage for all critical pages in `votiy-web/tests/component/accessibility.test.jsx` and `tests/e2e/responsive-accessibility.spec.js`
- [ ] T075 Close unit decision-path gaps and enforce repository-wide 80% line/branch coverage in `votiy-api/tests/unit/` and `votiy-web/tests/component/`
- [ ] T076 Add production secrets/configuration declarations and readiness health check configuration in `render.yaml` without committing secret values
- [ ] T077 Add post-deploy `/health`, `/ready`, public shell, synthetic direct-link event, and deployed-commit smoke checks in `.github/workflows/post-deploy.yml` and `tests/smoke/production-smoke.js`
- [ ] T078 [P] Document Render/Atlas SLI queries, alert thresholds, correlation-ID diagnostics, and rollback steps in `docs/operations.md`
- [ ] T079 Update setup, environment, test, delivery, and production smoke instructions in `README.md` and validate every journey in `specs/001-account-event-creation/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: No dependencies; begins immediately.
- **Phase 2 — Foundational**: Depends on Phase 1 and blocks every user story.
- **Phase 3 — User Story 1**: Depends on Phase 2 and delivers the first MVP slice.
- **Phase 4 — User Story 2**: Depends on the shared account/session foundations delivered by US1, but its acceptance flow remains independently testable.
- **Phase 5 — User Story 3**: Depends on verified sessions from US1/US2 because ownership and private access require authenticated identities.
- **Phase 6 — Polish**: Depends on the user stories selected for release; production smoke tasks require all three critical flows.

### User Story Dependency Graph

```text
Setup → Foundation → US1 Create Account → US2 Return to Account → US3 Create/Share Event → Polish
```

- **US1 (P1)** establishes verified identities and secure sessions.
- **US2 (P2)** adds durable return/sign-out behavior atop the same session model.
- **US3 (P3)** consumes verified identity for ownership and private attendee authorization.
- Each story has its own unit, contract, integration, component, and E2E acceptance boundary.

### Within Each User Story

1. Write tests and confirm they fail for the intended missing behavior.
2. Implement document/domain rules and repository methods.
3. Implement application services and authorization.
4. Wire GraphQL resolvers and checked-in client operations.
5. Implement UI states and flows.
6. Run all story layers and verify the independent checkpoint.

## Parallel Opportunities

- T002, T003, T005, T006, and T007 can proceed in parallel after T001 establishes the workspace scripts.
- T009–T012 and T015–T016 touch separate foundational modules and can proceed in parallel.
- T020–T024 can proceed in parallel once the relevant package/test configuration exists.
- Each story's unit, contract, integration, component, and E2E test files can be authored in parallel before implementation.
- Domain/repository, email adapter, checked-in operation, and UI work marked `[P]` can proceed concurrently when their declared prerequisites are satisfied.
- T072–T074 and T078 can proceed in parallel after all selected story interfaces stabilize.

## Parallel Example: User Story 1

```text
Task T026: Unit tests in votiy-api/tests/unit/registration-service.test.js and verification-service.test.js
Task T027: GraphQL contract tests in votiy-api/tests/contract/account.contract.test.js
Task T028: Real-Mongo integration tests in votiy-api/tests/integration/account-registration.test.js
Task T029: React component tests in votiy-web/tests/component/registration.test.jsx and verification.test.jsx
Task T030: Playwright CUF-001 flow in tests/e2e/new-host-registration.spec.js
```

## Parallel Example: User Story 2

```text
Task T043: Authentication/session unit tests
Task T044: Session GraphQL/cookie contract tests
Task T045: Real-Mongo session lifecycle integration tests
Task T046: React session component tests
Task T047: Playwright CUF-002 flow
```

## Parallel Example: User Story 3

```text
Task T054: Event and access-policy unit tests
Task T055: Event GraphQL contract tests
Task T056: Event persistence contract tests
Task T057: Real-Mongo event lifecycle integration tests
Task T058: React event component tests
Task T059: Playwright host event flow
Task T060: Playwright participant-registration policy flow
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete User Story 1 through T042.
3. Run the US1 unit, contract, integration, component, and E2E suites.
4. Stop and demonstrate registration, verification, authenticated session creation, and the empty dashboard.
5. Deploy only after the required CI gates and safe production smoke checks are operational.

### Incremental Delivery

1. **Foundation + US1**: Verified account creation and authenticated empty state.
2. **Add US2**: Secure return and sign-out without changing US1 behavior.
3. **Add US3**: Creator-owned voting events and OPEN/ADMIN_MANAGED participant registration.
4. **Polish**: Close cross-story coverage, accessibility, observability, and automated production delivery.

## Notes

- `[P]` means work is safe only when its stated prerequisites are complete and it does not overlap another task's files.
- Event ownership always comes from the authenticated session, never client input.
- Raw passwords, cookies, verification tokens, email addresses, and phone numbers never appear in logs.
- Public links grant public-event discovery only; private links still require an authorized signed-in identity.
- Commit after each task or coherent task group and run the narrowest relevant tests before broader gates.
