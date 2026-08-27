# Tasks: Secure Password Reset

**Input**: Design documents from `/specs/012-password-reset/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Constitution requires unit, contract, real-Mongo integration, component, desktop/mobile E2E, privacy, concurrency, smoke, and 80% line/branch coverage.

**Organization**: Tasks grouped by independently testable user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallel-safe; different files and no incomplete dependency
- **[Story]**: User story traceability label
- Every task includes exact file path

## Phase 1: Setup

**Purpose**: Register Feature 012 contracts and shared fixtures.

- [X] T001 Register `specs/012-password-reset/contracts/schema-extension.graphql` in `votiy-api/src/api/graphql/schema.js`
- [X] T002 [P] Add reusable reset account/token/time fixtures in `votiy-api/tests/support/password-reset-fixtures.js`
- [X] T003 [P] Add fake password-reset email capture helpers in `votiy-api/tests/support/fake-email.js`
- [X] T004 [P] Add normal, bypass, invalid-token, and concurrent browser setup helpers in `tests/e2e/fixtures/password-reset.js`

---

## Phase 2: Foundational

**Purpose**: Lock security, persistence, privacy, and CI boundaries before user flows.

**CRITICAL**: Finish before any story implementation.

- [X] T005 Add `PasswordResetRequest` domain constructor/invariants and exact 15-minute expiry in `votiy-api/src/domain/password-reset.js`
- [X] T006 Add request, inspect, and reset input validation reusing `passwordSchema` in `votiy-api/src/domain/validation.js`
- [X] T007 Add retained `passwordResetRequests` validator and indexes without TTL in `votiy-api/src/repositories/indexes.js`
- [X] T008 Implement create, supersede, inspect-active, delivery-failure, and atomic-consume repository operations in `votiy-api/src/repositories/password-reset-repository.js`
- [X] T009 Add atomic password-hash/credential-version update operation in `votiy-api/src/repositories/account-repository.js`
- [X] T010 Add password-reset audit names and privacy-safe metadata allowlist in `votiy-api/src/repositories/audit-event-repository.js`
- [X] T011 [P] Add reset privacy assertions rejecting email, token, password, digests, and message content in `votiy-api/tests/support/audit-assertions.js`
- [X] T012 Wire reset repository/service dependencies and existing transaction/token/bypass primitives in `votiy-api/src/server.js`
- [X] T013 Extend CI with Feature 012 API, web, build, desktop/mobile E2E, and smoke gates in `.github/workflows/ci.yml`

**Checkpoint**: Reset records, security primitives, contracts, and gates ready.

---

## Phase 3: User Story 1 - Request Password Reset (Priority: P1) MVP

**Goal**: Signed-out user requests neutral recovery; eligible normal account receives one safe 15-minute email link.

**Independent Test**: Request known normal, unknown, ineligible, and malformed emails; verify neutral behavior, one eligible email, retained digest-only record, supersession, and delivery-failure safety.

### Tests for User Story 1

- [X] T014 [P] [US1] Add domain/service unit tests for normalization, eligibility, neutral response, 15-minute expiry, supersession, rate-limit errors, and safe logs in `votiy-api/tests/unit/password-reset-request.test.js`
- [X] T015 [P] [US1] Add GraphQL contract tests for request input/result, field errors, neutral success, bypass-token nullability, and correlation IDs in `votiy-api/tests/contract/password-reset-request.contract.test.js`
- [X] T016 [P] [US1] Add persistence contract tests for digest-only storage, retained statuses, no TTL, active-account indexes, and delivery failure in `votiy-api/tests/contract/password-reset-persistence.contract.test.js`
- [X] T017 [P] [US1] Add email contract tests for canonical origin, one unique link, 15-minute text, warning, HTML/text parity, and secret-free diagnostics in `votiy-api/tests/contract/password-reset-email.contract.test.js`
- [X] T018 [P] [US1] Add real-Mongo tests for issuance, concurrent supersession, unknown/ineligible neutrality, retained audit, and failed-email invalidation in `votiy-api/tests/integration/password-reset-request.test.js`
- [X] T019 [P] [US1] Add request-page component tests for link, validation, loading lock, neutral success, errors, and focus in `votiy-web/tests/component/forgot-password.test.jsx`
- [X] T020 [P] [US1] Add CUF-001/CUF-003 email-request browser coverage in `tests/e2e/password-reset.spec.js`

### Implementation for User Story 1

- [X] T021 [US1] Extend email sender with password-reset text/HTML message using configured origin in `votiy-api/src/email/email-sender.js`
- [X] T022 [US1] Implement normal request flow, account eligibility, dummy-work neutrality, supersession, delivery failure, and safe telemetry in `votiy-api/src/services/password-reset-service.js`
- [X] T023 [US1] Expose request resolver and success/failure audit recording in `votiy-api/src/api/graphql/account-resolvers.js`
- [X] T024 [US1] Add request operation/client mapping in `votiy-web/src/features/auth/password-reset.graphql.js`
- [X] T025 [US1] Add “Forgot password?” action with optional reset-success notice in `votiy-web/src/features/auth/SignInPage.jsx`
- [X] T026 [US1] Build email request form and neutral states in `votiy-web/src/features/auth/ForgotPasswordPage.jsx`
- [X] T027 [US1] Register public `/forgot-password` route and route focus in `votiy-web/src/app/AppRouter.jsx`
- [X] T028 [US1] Add responsive request/reset form and status styles in `votiy-web/src/App.css`

**Checkpoint**: Normal email request journey independently functional.

---

## Phase 4: User Story 2 - Reset Through Email Link (Priority: P1)

**Goal**: Valid link shows linked email, accepts matching compliant passwords once, revokes sessions, and returns user to sign-in.

**Independent Test**: Inspect valid/invalid links; submit matching/mismatching passwords; prove one concurrent winner, new-password sign-in, old-password failure, session revocation, and retained consumption audit.

### Tests for User Story 2

- [X] T029 [P] [US2] Add service unit tests for inspection disclosure, password-rule reuse, mismatch preservation, expiry boundary, atomic consume, version increment, and safe failures in `votiy-api/tests/unit/password-reset-completion.test.js`
- [X] T030 [P] [US2] Add GraphQL contract tests for inspect/reset operations, read-only email result, invalid-token errors, and reset success in `votiy-api/tests/contract/password-reset-completion.contract.test.js`
- [X] T031 [P] [US2] Add real-Mongo transaction tests for password replacement, session revocation, credential version, concurrent single winner, reuse, expiry, supersession, and rollback in `votiy-api/tests/integration/password-reset-completion.test.js`
- [X] T032 [P] [US2] Add reset-page component tests for token loading, email display, autocomplete, password guidance, mismatch, invalid state, duplicate lock, and redirect in `votiy-web/tests/component/reset-password.test.jsx`
- [X] T033 [P] [US2] Extend CUF-001/CUF-004/CUF-005/CUF-006 browser coverage for completion, invalid links, concurrency, and session revocation in `tests/e2e/password-reset.spec.js`

### Implementation for User Story 2

- [X] T034 [US2] Implement inspection and transactional reset completion with Argon2id, credential increment, and session revocation in `votiy-api/src/services/password-reset-service.js`
- [X] T035 [US2] Expose inspect/reset resolvers with privacy-safe success/denial audits in `votiy-api/src/api/graphql/account-resolvers.js`
- [X] T036 [US2] Add inspect/reset client operations and error mapping in `votiy-web/src/features/auth/password-reset.graphql.js`
- [X] T037 [US2] Build token inspection, read-only email, matching password form, invalid-link recovery, and sign-in redirect in `votiy-web/src/features/auth/ResetPasswordPage.jsx`
- [X] T038 [US2] Register public `/reset-password` route and sign-in success state handling in `votiy-web/src/app/AppRouter.jsx` and `votiy-web/src/features/auth/SignInPage.jsx`

**Checkpoint**: Complete email recovery independently functional and secure.

---

## Phase 5: User Story 3 - Configured Domain Bypass (Priority: P2)

**Goal**: Exact configured domain skips email and continues same browser with unique normal reset authorization.

**Independent Test**: Compare exact, uppercase-normalized, suffix, subdomain, lookalike, empty, and malformed configurations; only exact match gets direct token, with normal expiry/audit/single-use/session rules.

### Tests for User Story 3

- [X] T039 [P] [US3] Add unit tests for exact normalized domain matching, fail-closed configuration, unique token generation, no email, and no deterministic verification token reuse in `votiy-api/tests/unit/password-reset-bypass.test.js`
- [X] T040 [P] [US3] Add contract tests proving bypass token only appears for exact eligible match and normal result remains neutral in `votiy-api/tests/contract/password-reset-bypass.contract.test.js`
- [X] T041 [P] [US3] Add real-Mongo/email tests for bypass record lifecycle, zero mail, expiry, supersession, completion, and retained audit in `votiy-api/tests/integration/password-reset-bypass.test.js`
- [X] T042 [P] [US3] Add request-page component tests for bypass navigation and absent email-success claim in `votiy-web/tests/component/forgot-password.test.jsx`
- [X] T043 [P] [US3] Add CUF-002 exact/non-exact bypass browser coverage in `tests/e2e/password-reset.spec.js`

### Implementation for User Story 3

- [X] T044 [US3] Add exact-domain bypass branch returning unique direct token while reusing normal record lifecycle in `votiy-api/src/services/password-reset-service.js`
- [X] T045 [US3] Map bypass token through resolver/client without exposing it to normal or unknown requests in `votiy-api/src/api/graphql/account-resolvers.js` and `votiy-web/src/features/auth/password-reset.graphql.js`
- [X] T046 [US3] Navigate matching bypass request directly to reset route without email claim in `votiy-web/src/features/auth/ForgotPasswordPage.jsx`

**Checkpoint**: Bypass and email paths both functional with identical reset security.

---

## Phase 6: Polish & Cross-Cutting

- [X] T047 [P] Add Feature 012 keyboard, 320px, 200% zoom, touch-target, reduced-motion, and overflow checks in `tests/e2e/responsive-accessibility.spec.js`
- [X] T048 [P] Extend production synthetic smoke for neutral request, bypass/no-mail, reset completion, session revocation, retained record, and schema compatibility in `tests/smoke/production-smoke.js`
- [X] T049 [P] Add privacy-safe audit/log assertions and request/reset latency/error signal coverage in `votiy-api/tests/integration/password-reset-observability.test.js`
- [X] T050 [P] Document recovery configuration, Mailpit/provider behavior, signals, incident handling, and retained-record rollback in `README.md` and `docs/operations.md`
- [X] T051 Run API/web coverage, lint, formatting, build, desktop/mobile E2E, smoke, and full regressions from `specs/012-password-reset/quickstart.md`
- [X] T052 Verify 80% line/branch floors and close every token, ownership, lifecycle, privacy, concurrency, email-failure, and bypass decision gap in `votiy-api/tests/` and `votiy-web/tests/`
- [X] T053 Validate code-only rollback without deleting reset records or restoring credentials/sessions and record result in `specs/012-password-reset/quickstart.md`

---

## Dependencies & Execution Order

### Phase dependencies

```text
Setup -> Foundation -> US1 -> US2
                    -> US3 (reuses US1 issuance and US2 completion)
US1 + US2 + US3 -> Polish
```

- Setup starts immediately.
- Foundation depends on Setup and blocks all stories.
- US1 delivers request MVP.
- US2 depends on issued reset records from US1.
- US3 depends on shared issuance/completion primitives but remains independently testable with bypass fixture.
- Polish requires all selected stories; full release requires all three.

### Within each story

- Write tests first and confirm failure.
- Domain/persistence before service.
- Service before resolver/client.
- Client before UI integration.
- Core behavior before E2E.

## Parallel Opportunities

- T002-T004 can run together.
- T011 and T013 can run beside foundational model/repository work after contract registration.
- US1 tests T014-T020 can run together.
- US2 tests T029-T033 can run together after issuance contract is stable.
- US3 tests T039-T043 can run together after shared service shape is stable.
- T047-T050 can run together.

## Parallel Examples

### User Story 1

```text
Task: T014 request service unit tests
Task: T015 GraphQL request contract tests
Task: T017 reset email contract tests
Task: T019 forgot-password component tests
```

### User Story 2

```text
Task: T029 completion service unit tests
Task: T030 inspect/reset contract tests
Task: T031 real-Mongo transaction tests
Task: T032 reset-page component tests
```

### User Story 3

```text
Task: T039 bypass unit tests
Task: T040 bypass contract tests
Task: T041 bypass integration tests
Task: T043 bypass browser flow
```

## Implementation Strategy

### MVP first

1. Finish Setup and Foundation.
2. Finish US1 normal request and delivery.
3. Validate neutral behavior, audit retention, and email contract.
4. Add US2 before production release so request has usable completion.

### Incremental delivery

1. US1: request and email issuance.
2. US2: secure completion and session invalidation.
3. US3: controlled bypass path.
4. Polish: accessibility, smoke, observability, docs, coverage, rollback.

## Notes

- Never store/log raw reset token or password.
- Never attach TTL to retained reset records.
- Never reuse deterministic email-verification bypass token for password reset.
- Invalid token never discloses account email.
- Password and reset consume must commit atomically.
