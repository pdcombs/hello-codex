# Feature Specification: Defer Voting Code Consumption

**Feature Branch**: `main`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Do not mark a voting code used unless an accepted ballot is attached to it. Entering a code without voting must leave it available for later use."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter Code Without Consuming It (Priority: P1)

As a voter, I can enter a valid unused voting code and open the ballot without consuming that code, so leaving before submission does not waste my opportunity to vote.

**Why this priority**: A code represents one completed vote, not one visit to the voting form. Consuming it early permanently blocks legitimate voters.

**Independent Test**: Enter a valid code, reach the voting form, leave without submitting, then reuse the same code and confirm it remains accepted and listed as unused.

**Acceptance Scenarios**:

1. **Given** an unused code for an open event, **When** a voter enters it successfully, **Then** the voting form opens and the code remains unused.
2. **Given** a voter entered a valid code, **When** the voter closes, refreshes, or leaves the voting form without an accepted ballot, **Then** the code remains reusable.
3. **Given** a previously validated code still has no ballot, **When** that voter or another voter enters it later, **Then** the code can authorize voting again.

---

### User Story 2 - Consume Code With Accepted Ballot (Priority: P1)

As an event host, I can trust that each used code is attached to exactly one accepted ballot and that one code cannot create multiple ballots.

**Why this priority**: Ballot integrity requires code consumption and ballot acceptance to succeed or fail together.

**Independent Test**: Submit a valid ballot with an unused code and confirm one ballot exists, the code is used, and the code references that ballot; then attempt another submission with the same code and confirm rejection.

**Acceptance Scenarios**:

1. **Given** a valid unused code and valid ballot, **When** submission is accepted, **Then** the ballot is stored and the code is marked used with a relationship to that ballot as one indivisible outcome.
2. **Given** ballot submission fails validation or storage, **When** no ballot is accepted, **Then** the code remains unused.
3. **Given** two voters validated the same unused code, **When** both submit, **Then** exactly one ballot is accepted and attached to the code, while the other submission receives a clear code-already-used response.
4. **Given** an accepted submission response is lost, **When** the same submission is retried, **Then** the original accepted ballot is returned without creating another ballot or consuming another code.

---

### User Story 3 - Recover Stranded Codes (Priority: P2)

As a host, I regain codes consumed by the prior early-consumption behavior when no ballot was ever attached, while codes supporting real ballots remain used.

**Why this priority**: Existing stranded codes must become usable again without changing legitimate ballot records.

**Independent Test**: Process existing used codes both with and without related ballots; confirm ballot-backed codes remain used and orphaned codes become unused with an audit record.

**Acceptance Scenarios**:

1. **Given** a code is marked used and a ballot references that code, **When** existing data is reconciled, **Then** the code remains used and is linked to the ballot.
2. **Given** a code is marked used but no ballot references it, **When** existing data is reconciled, **Then** the code becomes reusable and the correction is auditable.
3. **Given** a reconciled code appears in host settings, **When** the host reviews code inventory, **Then** its displayed state matches whether an accepted ballot is attached.

### Edge Cases

- Multiple browsers may validate the same unused code before either submits; validation alone grants no exclusive claim.
- If another voter consumes the code after the form opens, submission fails clearly and asks for another code without creating a ballot.
- If voting closes, event rules change, or the code is revoked after validation, submission uses current authoritative state and fails without consuming the code.
- Invalid or empty ballots do not consume codes.
- Network loss after successful acceptance is handled through submission retry safety, without duplicate ballots.
- Failure to complete any required ballot, code, or audit state change leaves neither a partial ballot nor a consumed code.
- Clearing browser storage does not alter code state; accepted ballot linkage remains authoritative.
- Legacy used codes with missing direct ballot linkage are cross-checked against ballot records before restoration.

## Scope Boundaries *(mandatory)*

### In Scope

- Validate unused voting codes without marking them used.
- Consume a code only when its associated ballot is accepted.
- Preserve one accepted ballot per code under concurrent submissions and retries.
- Give voters actionable feedback when a code becomes unavailable before submission.
- Keep host code inventory consistent with accepted ballot relationships.
- Reconcile codes stranded by prior early-consumption behavior.
- Record auditable validation, consumption, rejection, and reconciliation events without exposing code secrets.

### Out of Scope

- Reserving codes for a voter or device while a ballot is in progress.
- Expiring pending voting-form access.
- Saving incomplete ballot drafts.
- Editing or deleting accepted ballots.
- Changing code generation, ballot history, results, or event voting-rule behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Entering a valid unused voting code MUST authorize access to the voting form without changing the code's unused state.
- **FR-002**: Code validation before ballot submission MUST NOT set a used time, attach a ballot, or otherwise represent the code as consumed.
- **FR-003**: Any temporary voter access associated with a validated code MUST NOT by itself count as code use.
- **FR-004**: Leaving, refreshing, timing out, or abandoning the voting form before an accepted submission MUST leave the code reusable.
- **FR-005**: Submission MUST revalidate the code, event, voting status, voting rules, and ballot against current authoritative state.
- **FR-006**: A successful code-based submission MUST store the ballot, mark the exact code used, and attach that code to the ballot as one indivisible outcome.
- **FR-007**: If any required submission state change fails, the system MUST leave both the ballot unaccepted and the code unused.
- **FR-008**: Concurrent submissions using one code MUST result in no more than one accepted ballot.
- **FR-009**: A submission losing a code-use race MUST receive an actionable message explaining that another unused code is required.
- **FR-010**: An exact retry of an already accepted submission MUST return the original result without creating a duplicate ballot or consuming another code.
- **FR-011**: Host code inventory MUST show a code as used only when an accepted ballot is associated with it.
- **FR-012**: A voter returning to a previously opened voting form MAY continue with the validated code only while that code remains unused and current voting requirements remain satisfied.
- **FR-013**: If a previously validated code was consumed elsewhere, the voter MUST provide a different unused code before submitting.
- **FR-014**: Existing one-ballot-per-code restrictions MUST remain enforced in both user-facing and authoritative submission checks.
- **FR-015**: Audit records MUST distinguish code validation from code consumption and MUST NOT record plaintext code values or unnecessary voter data.
- **FR-016**: Existing codes marked used without a direct ballot relationship MUST be reconciled against ballot records: ballot-backed codes remain used and are linked; codes with no related ballot become unused.
- **FR-017**: Reconciliation MUST preserve all accepted ballots and prior audit history and MUST add an audit record for each corrected code.
- **FR-018**: Voting and settings experiences MUST provide clear loading, success, validation, and failure states usable on current mobile and desktop browsers.

### Key Entities *(include if feature involves data)*

- **Voting Code**: Event-scoped credential with unused or used state; a used code identifies its one accepted ballot and consumption time.
- **Ballot**: Immutable accepted vote associated with an event and, for code-required voting, exactly one voting code.
- **Pending Voter Access**: Temporary authorization showing that a code was validated; it does not reserve or consume the code.
- **Audit Event**: Privacy-safe record of code validation, consumption, rejection, or legacy-data reconciliation.

### Ownership and Access *(include if feature involves user-controlled data)*

- Event host owns and may view or manage event voting-code inventory according to existing permissions.
- Voters may validate and submit an eligible code but may not view code inventory or another voter's ballot.
- Only authoritative submission processing may mark a code used or attach it to a ballot.
- Reconciliation is restricted to trusted operational processing and does not expose private ballot selections.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of tested code-entry sessions abandoned before ballot acceptance leave the code reusable.
- **SC-002**: 100% of accepted code-based ballots have exactly one used code relationship, and no used code is associated with more than one ballot.
- **SC-003**: In concurrent same-code submission tests, exactly one submission succeeds and all others receive actionable feedback.
- **SC-004**: 100% of simulated validation, submission, storage, and audit failures leave no partial ballot or falsely consumed code.
- **SC-005**: Reconciliation preserves 100% of ballot-backed used codes and restores 100% of verified orphaned code claims.
- **SC-006**: At least 95% of voters receiving a code-unavailable message understand that they must enter another code in usability validation.

### Critical User Flows *(mandatory)*

- **CUF-001**: Voter enters unused code, opens ballot, leaves without submitting, returns, reuses code, submits at least one selection, and sees completed ballot while host inventory shows code attached to that ballot.
- **CUF-002**: Two voters validate one code, then submit; one succeeds, one is prompted for another code, and only one ballot exists for that code.

## Assumptions

- Voting codes continue to permit exactly one accepted ballot each.
- Validation is intentionally non-exclusive; another voter may consume the code before an open form is submitted.
- Current event status, rules, code validity, and ballot validation remain authoritative at submission time.
- Existing ballot submission retry identifiers remain available to distinguish an exact retry from a new vote.
- Legacy reconciliation can determine ballot association from either the code's direct ballot relationship or a ballot's code reference.
- Feature 016 private ballot-history behavior remains unchanged.
