# Feature Specification: Case-Insensitive Voting Codes

**Feature Branch**: `main`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Make voting codes lowercase in the backend and case-insensitive when entered. Disable mobile first-letter capitalization where possible."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter Voting Code in Any Letter Case (Priority: P1)

As a voter, I can enter a valid voting code using lowercase, uppercase, or mixed case and receive the same access decision, so keyboard capitalization never prevents me from voting.

**Why this priority**: Incorrect rejection blocks voting and is especially common on mobile keyboards that capitalize the first character.

**Independent Test**: Generate one unused code and submit equivalent lowercase, uppercase, and mixed-case forms in isolated tests; each form identifies the same code, while only one completed ballot may consume it.

**Acceptance Scenarios**:

1. **Given** an unused code `abc123`, **When** voter enters `ABC123`, **Then** system recognizes it as `abc123` and grants access under existing voting rules.
2. **Given** an unused code `abc123`, **When** voter enters `AbC123`, **Then** system recognizes same code without case-sensitive failure.
3. **Given** a code already attached to a submitted ballot, **When** voter enters any letter-case variation, **Then** system recognizes same consumed code and rejects reuse under existing rules.
4. **Given** two submissions containing case variants of one code, **When** processed concurrently, **Then** they cannot become separate valid code identities.

---

### User Story 2 - Receive Lowercase Codes (Priority: P1)

As an event host, I receive newly generated voting codes in a consistent lowercase form, so codes are easier to distribute and enter.

**Why this priority**: Canonical lowercase generation prevents confusing visual variants and supports reliable case-insensitive matching.

**Independent Test**: Generate multiple code batches and confirm every displayed, exported, managed, and stored code representation containing letters uses lowercase only.

**Acceptance Scenarios**:

1. **Given** host generates voting codes, **When** batch is returned, **Then** every alphabetical character is lowercase.
2. **Given** generated code is later entered using uppercase or mixed case, **When** access is checked, **Then** it resolves to original lowercase code.
3. **Given** codes created before this enhancement, **When** voters enter their printed value in any case, **Then** valid unused codes remain usable and do not become duplicate identities.

---

### User Story 3 - Mobile Keyboard Does Not Auto-Capitalize Code (Priority: P2)

As a mobile voter, code field avoids automatic capitalization and correction, so typing matches expected lowercase format with less friction.

**Why this priority**: Server-side normalization guarantees correctness, but keyboard hints reduce avoidable confusion and corrections.

**Independent Test**: Inspect and use voting-code field on supported mobile browsers; field requests no capitalization or correction and submitted value remains case-insensitive.

**Acceptance Scenarios**:

1. **Given** voting-code modal opens on supported mobile device, **When** field receives focus, **Then** keyboard is requested not to capitalize first character.
2. **Given** browser ignores keyboard hint and capitalizes text, **When** voter submits, **Then** code still succeeds because matching is case-insensitive.
3. **Given** voter pastes uppercase or mixed-case code, **When** value appears in field, **Then** submission resolves using lowercase canonical value.

### Edge Cases

- Leading and trailing whitespace continues to be ignored according to existing code-entry behavior before comparison.
- Numbers and supported non-letter characters remain unchanged during lowercase normalization.
- Invalid code remains invalid regardless of case variation.
- Blank input remains validation failure.
- Locale-specific casing must not produce different voting-code identities; generated codes use existing restricted character set.
- Existing unused codes remain redeemable after deployment.
- Existing used codes remain used after deployment and cannot be revived by changing case.
- Code management counts, audit history, ballot links, and code status remain accurate after canonicalization.

## Scope Boundaries *(mandatory)*

### In Scope

- Lowercase canonical form for newly generated voting codes.
- Case-insensitive normalization at every authoritative voting-code lookup, claim, validation, and ballot-submission boundary.
- Compatibility for unused and used codes created before deployment.
- Prevention of duplicate code identities that differ only by letter case.
- Lowercase display and input normalization where voting codes are entered or managed.
- Mobile keyboard hints disabling automatic capitalization, correction, and spell checking where supported.
- Automated coverage for generation, lookup, concurrent use, existing-code compatibility, and mobile field behavior.

### Out of Scope

- Changing code length, alphabet, batch limits, expiration, encryption, one-code-per-ballot rule, or reuse behavior.
- Regenerating or invalidating existing codes.
- Redesigning voting-code modal or management screen.
- Changing voter access policies unrelated to code casing.
- Guaranteeing keyboard behavior on browsers that ignore input hints.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Newly generated voting codes MUST use lowercase for every alphabetical character.
- **FR-002**: Authoritative code comparison MUST be case-insensitive.
- **FR-003**: Every user-supplied code MUST be converted to one canonical lowercase value before validation, lookup, claim, consumption, and ballot association.
- **FR-004**: Leading and trailing whitespace MUST be normalized consistently with current accepted behavior before comparison.
- **FR-005**: Uppercase, lowercase, and mixed-case variants MUST resolve to one code identity.
- **FR-006**: Case variation MUST NOT bypass one-vote-per-code enforcement.
- **FR-007**: Concurrent claims using different case variants MUST retain existing atomic single-code guarantees.
- **FR-008**: Existing unused codes MUST remain valid and redeemable using any letter case after deployment.
- **FR-009**: Existing used codes MUST remain consumed and reject reuse using every letter-case variation.
- **FR-010**: Existing ballot-to-code associations and auditing MUST remain intact.
- **FR-011**: Voting-code entry UI MUST communicate and display canonical lowercase value consistently.
- **FR-012**: Voting-code field MUST request disabled automatic capitalization on supported mobile browsers.
- **FR-013**: Voting-code field MUST request disabled automatic correction and spell checking where supported.
- **FR-014**: Pasted uppercase or mixed-case values MUST receive same case-insensitive handling as typed values.
- **FR-015**: Invalid and blank code responses MUST retain current user-visible error behavior and reveal no code inventory information.
- **FR-016**: Code management totals and states MUST not change solely because canonical casing is introduced.

### Key Entities

- **Voting Code**: One event-scoped access credential with canonical lowercase value, protected stored identity, lifecycle state, generation time, and optional ballot association.
- **Code Entry**: Voter-supplied typed or pasted value normalized before authoritative comparison.
- **Ballot Association**: Existing single-use link proving code was consumed only by completed ballot submission.

### Ownership and Access

- Event host retains existing authority to generate and manage code inventory.
- Voters may submit codes only through existing access flow.
- Canonicalization does not expose stored codes, hashes, code availability, ballot identity, or additional event data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of lowercase, uppercase, and mixed-case variants of a valid test code produce same access identity.
- **SC-002**: 100% of newly generated codes contain no uppercase alphabetical characters.
- **SC-003**: 100% of case-variant reuse attempts for consumed codes are rejected.
- **SC-004**: 100% of pre-deployment valid-code compatibility tests preserve unused and used status.
- **SC-005**: Concurrent case-variant claim tests allow no more than one successful ballot association per code.
- **SC-006**: Supported mobile browsers receive field configuration requesting no automatic capitalization, correction, or spell checking.
- **SC-007**: Voters can submit uppercase or mixed-case codes without manually correcting capitalization.

### Critical User Flows *(mandatory)*

- **CUF-001**: Mobile voter enters code with first letter automatically capitalized, receives access, submits ballot, and same code cannot be reused in another case.
- **CUF-002**: Host generates lowercase batch, distributes code, and voter successfully enters uppercase version.
- **CUF-003**: Existing unused code survives deployment, works using changed case, and becomes used only after ballot association.

## Assumptions

- Existing voting-code character set is safe for deterministic lowercase normalization.
- Canonical casing changes code identity comparison only; all current security, encryption, lifecycle, and consumption rules remain authoritative.
- Existing stored code data may require compatibility handling, but no host action or code redistribution is acceptable.
- Browser keyboard hints are advisory; backend normalization remains final guarantee.
