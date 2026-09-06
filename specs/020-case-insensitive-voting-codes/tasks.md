# Tasks: Case-Insensitive Voting Codes

**Input**: Design documents from `/specs/020-case-insensitive-voting-codes/`

## Phase 1: Setup

- [X] T001 Verify existing code generator, digest, GraphQL validation, shared modal, test harness, and ignore configuration in `votiy-api/src/domain/voting-access-code.js`, `votiy-api/src/domain/validation.js`, `votiy-web/src/features/voting/VotingCodeModal.jsx`, and `.gitignore`

## Phase 2: Foundational Tests

- [X] T002 [P] Add failing canonicalization and case-equivalent digest tests in `votiy-api/tests/unit/voting-access-code.test.js`
- [X] T003 [P] Add failing access and ballot input normalization tests in `votiy-api/tests/unit/foundation.test.js`
- [X] T004 [P] Add failing mobile input and lowercase submission tests in `votiy-web/tests/component/voting-access.test.jsx`

## Phase 3: User Story 1 - Enter Code in Any Case (P1)

**Independent Test**: Equivalent case forms resolve to one code; consumed variant cannot be reused.

- [X] T005 [US1] Add shared voting-code canonicalizer and apply it before keyed digest identity in `votiy-api/src/domain/voting-access-code.js`
- [X] T006 [US1] Canonicalize access and ballot code inputs at authoritative validation boundary in `votiy-api/src/domain/validation.js`
- [X] T007 [US1] Extend service decision tests to prove canonical values reach lookup for access and submission in `votiy-api/tests/unit/voting-access-decision.test.js`
- [X] T008 [US1] Extend real MongoDB tests for uppercase access, mixed-case concurrent claim, and consumed-case rejection in `votiy-api/tests/integration/voting-code-claim.test.js`

## Phase 4: User Story 2 - Receive Lowercase Codes (P1)

**Independent Test**: Generated inventory contains lowercase-only codes and retains matching protected identities.

- [X] T009 [US2] Strengthen generation and encrypted inventory assertions for lowercase canonical values in `votiy-api/tests/unit/voting-code-management.test.js` and `votiy-api/tests/integration/voting-code-claim.test.js`

## Phase 5: User Story 3 - Mobile Input Avoids Capitalization (P2)

**Independent Test**: Shared modal disables capitalization/correction/spellcheck and lowercases typed or pasted values.

- [X] T010 [US3] Normalize controlled code input and add mobile keyboard hints in `votiy-web/src/features/voting/VotingCodeModal.jsx`
- [X] T011 [US3] Cover typing, pasting, and mobile field attributes across voting entry flows in `votiy-web/tests/component/voting-access.test.jsx`

## Phase 6: Validation

- [X] T012 Run API unit/contract/integration tests, web tests/lint/build, diff checks, and `specs/020-case-insensitive-voting-codes/quickstart.md` validation

## Dependencies

- T001 precedes all work.
- T002-T004 establish failing coverage before T005-T011.
- T005 precedes T006-T009.
- T010 precedes final UI validation T011.
- T012 follows all implementation.

## Parallel Opportunities

- T002-T004 touch separate test files.
- T008 and T010 touch separate API/UI layers after canonicalizer exists.

## Implementation Strategy

1. Prove failure for case variants and mobile behavior.
2. Canonicalize at domain and validation boundaries.
3. Normalize visible UI value and keyboard hints.
4. Validate single-use integrity with real database concurrency.
