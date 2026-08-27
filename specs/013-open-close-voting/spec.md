# Feature Specification: Open / Close Voting

**Feature Branch**: `main`

**Created**: 2026-08-26

**Status**: Draft

**Input**: Event hosts manually open and close voting; eligible visitors pass an access gate before entering a placeholder voting screen.

## Clarifications

### Session 2026-08-26

- Q: How does manual voting status interact with scheduled dates? → A: Manual status alone controls voting; dates are display-only for now.
- Q: Does reopening reset prior ballots, code use, or repeat limits? → A: No; reopening preserves all voting and code history.
- Q: What setup is required before opening? → A: Configured rules plus at least one active entry; code inventory does not block opening, but an empty inventory warns and links the host to event settings.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Controls Voting State (Priority: P1)

An event host can open configured voting from the voting-rules section and close or reopen it at any time. Open voting displays a prominent event banner and permits ballot access; closed voting removes the banner and blocks all ballot submissions.

**Why this priority**: Explicit host control is the trust boundary for every later voting journey.

**Independent Test**: Configure an event, open voting, verify public status and submission gate, close it, then prove the public status and submission gate close immediately.

**Acceptance Scenarios**:

1. **Given** a host viewing a configured event, **When** the host selects **Open Voting**, **Then** voting becomes open, the control changes to **Close Voting**, and an event-wide “Voting is now open” banner appears.
2. **Given** open voting, **When** the host selects **Close Voting**, **Then** voting becomes closed, the open banner disappears, and new ballot submissions fail closed.
3. **Given** closed voting, **When** the host opens it again, **Then** voting becomes open without changing saved voting rules.
4. **Given** two host sessions act on the same voting version, **When** both change status, **Then** exactly one current-version transition succeeds and the stale action receives a refreshable conflict.

---

### User Story 2 - Visitor Requests Voting Access (Priority: P1)

Every host, participant, signed-in visitor, and anonymous visitor sees a **Vote** button while voting is open. Selecting it asks the event to evaluate current voting status, rules, identity, repeat limits, and prior ballot activity before navigation.

**Why this priority**: A visible button without a fresh server-side gate would expose inconsistent or unsafe access.

**Independent Test**: Open one event under each access policy, request access as matching and non-matching visitors, and verify each receives either permission or a structured next requirement.

**Acceptance Scenarios**:

1. **Given** open unrestricted voting and an eligible visitor, **When** the visitor selects **Vote**, **Then** access succeeds and the visitor reaches a blank page stating “Voting feature coming soon”.
2. **Given** closed voting, **When** any visitor views the event, **Then** no **Vote** button appears and the voting-rules summary states “Voting is closed at this time”.
3. **Given** voting closes after the button renders, **When** the visitor selects **Vote**, **Then** the fresh access request is denied and navigation does not occur.
4. **Given** an account-required event and an anonymous visitor, **When** the visitor selects **Vote**, **Then** the UI explains the sign-in requirement and routes to sign-in with a return path to the event that survives registration and email verification.
5. **Given** an identity already at its configured ballot limit, **When** it requests access again, **Then** access is denied with a clear repeat-limit message.

---

### User Story 3 - Visitor Supplies Voting Code (Priority: P1)

A visitor to a code-protected event receives a code-entry modal, submits a generated code, and proceeds only when the code is valid and unused. Successful entry atomically consumes the code so no other visitor can use it.

**Why this priority**: Generated codes are bearer credentials; reuse or race conditions would break vote integrity.

**Independent Test**: Attempt missing, invalid, expired/inactive, used, and concurrent valid code claims; verify only one valid claim proceeds and used-code visitors may enter another code.

**Acceptance Scenarios**:

1. **Given** open code-required voting, **When** a visitor selects **Vote**, **Then** the UI returns an enter-code requirement and opens a focused code modal.
2. **Given** a valid unused code, **When** the visitor submits it, **Then** exactly one atomic claim marks it used and navigation proceeds to the placeholder voting screen.
3. **Given** an invalid or used code, **When** submitted, **Then** navigation is blocked, a safe error appears, and the visitor can retry or enter another code.
4. **Given** two visitors submit the same unused code concurrently, **When** claims resolve, **Then** exactly one proceeds and the other receives the used/invalid response.
5. **Given** a code policy also requiring a completed account, **When** an anonymous visitor supplies a valid code, **Then** the code is not consumed until account requirements also pass.

### Edge Cases

- Host closes voting while another visitor is requesting access or submitting a ballot; each operation rechecks current state and fails closed.
- Event becomes archived or unavailable during access evaluation; no access grant or code consumption occurs.
- Voting rules change between page render and access request; response uses current rules and supplies current requirements.
- Missing browser marker under browser-limited voting is created safely before access evaluation; a visitor who clears browser storage is subject to existing documented limitations.
- Network failure during a status change, access request, or code claim leaves the UI retryable and does not infer success.
- Code claim, access grant, and audit persistence fail together rather than leaving a consumed code without a valid grant.
- Open/close controls remain keyboard accessible, screen-reader named, and usable at 320 CSS pixels and 200% zoom.

## Scope Boundaries *(mandatory)*

### In Scope

- Manual host-only voting state transitions with optimistic conflict protection.
- Open-state banner, host control, closed-state messaging, and public **Vote** button.
- Fresh voting-access decision returning allowed, closed, sign-in-required, code-required, repeat-limit, or unavailable outcomes.
- Atomic generated-code claim and retry behavior.
- Sign-in/registration/verification return path back to event.
- Placeholder voting destination; current ballot submission boundary respects manual status.
- Audit, observability, accessibility, responsive behavior, and layered automated tests.

### Out of Scope

- Ballot selection, review, submission UI, results, and winner calculation changes.
- Resetting ballots, browser history, account limits, or generated-code usage when voting reopens; all history remains authoritative.
- Scheduled automatic opening or closing behavior; saved opening and closing dates remain display-only for now.
- Editing voting rules through the access gate.
- Administrator override of host voting state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist an explicit event voting status supporting closed and open states, with a versioned host-controlled transition history.
- **FR-002**: Only event host MUST be able to open, close, or reopen voting.
- **FR-003**: Host status transition MUST reject stale versions without silently overwriting a newer transition.
- **FR-004**: System MUST prevent opening until voting rules are configured and at least one active event entry exists.
- **FR-004a**: Code-protected voting MUST remain openable without unused codes; when none exist, host UI MUST explain that codes are unavailable and link to event settings where codes remain manageable.
- **FR-005**: Open event MUST display a prominent “Voting is now open” banner to every viewer.
- **FR-006**: Open event MUST display a **Vote** primary action to every viewer, including host and anonymous visitors.
- **FR-007**: Closed event MUST hide **Vote**, remove open banner, and state “Voting is closed at this time” in voting-rules summary.
- **FR-008**: Every access request MUST evaluate fresh event lifecycle, voting status, current rules version, access policy, visitor identity, browser marker where relevant, prior ballots, and configured limits.
- **FR-009**: Access decision MUST return a stable requirements object that distinguishes allowed, voting closed, sign-in required, generated code required, account completion required, repeat limit reached, and event unavailable.
- **FR-010**: Allowed decision MUST navigate to a blank event voting route displaying “Voting feature coming soon”.
- **FR-011**: Account-required denial MUST explain requirement and offer sign-in while preserving event return path through sign-in, registration, and email verification.
- **FR-012**: Code-required decision MUST open an accessible modal without consuming a code.
- **FR-013**: Valid code submission MUST atomically verify current open status and all other applicable requirements, consume exactly one unused event code, and return allowed access.
- **FR-014**: Invalid or used code MUST remain retryable without disclosing whether a code belongs to another event or visitor.
- **FR-015**: Concurrent claims of one code MUST produce one winner.
- **FR-016**: Code-required visitors MUST always be able to reenter or replace a rejected/used code.
- **FR-017**: Existing ballot submission operations MUST independently require current open status; client navigation or a prior access grant MUST NOT bypass submission checks.
- **FR-018**: Closing voting MUST immediately prevent new access grants and ballot submissions, including requests based on stale UI.
- **FR-019**: Opening or closing MUST NOT modify voting rule selections, categories, entries, ballots, or generated codes except as explicitly decided for reopening history.
- **FR-019a**: Closing and reopening MUST preserve every ballot, code status, browser history marker, account limit, and audit record.
- **FR-019b**: Manual voting status MUST be authoritative for access and submission; saved opening and closing dates MUST be display-only and MUST NOT automatically change or gate status.
- **FR-020**: Important state transitions, denials, code claims, and conflicts MUST create privacy-safe audit records with correlation identifiers and no raw code, browser marker, or personal data.
- **FR-021**: UI MUST provide loading locks, retryable failure states, focus management, keyboard operation, 44 CSS-pixel primary targets, reduced-motion behavior, and no horizontal overflow at 320 CSS pixels or 200% zoom.

### Key Entities

- **Voting State**: Current manual status, version, transition timestamp, actor, and relationship to saved voting rules.
- **Voting Access Decision**: Short-lived result describing whether navigation is allowed and any next requirement; not authority for later ballot submission.
- **Voting Code Claim**: Atomic use of one event-generated code by an eligible access request.
- **Voter Identity Evidence**: Existing account, browser marker, generated code, and prior ballot evidence used to enforce repeat rules.
- **Voting State Audit Event**: Retained privacy-safe record of host transition, access denial, conflict, or code claim.

### Ownership and Access

- Event host owns voting state transitions for that event.
- All viewers may read public voting status and request an access decision while event is available.
- Only server boundary may evaluate eligibility, inspect prior ballots, or claim generated codes.
- Raw generated codes and browser markers remain secret and never appear in logs or audit metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Host can open or close voting in two interactions or fewer, with visible state confirmation within two seconds for 95% of successful attempts.
- **SC-002**: 100% of access and ballot attempts made after confirmed closure are rejected.
- **SC-003**: 100% of concurrent same-code claim tests produce exactly one successful claimant.
- **SC-004**: Every denied visitor receives one actionable requirement or safe failure state within two seconds for 95% of requests.
- **SC-005**: 100% of tested viewers see **Vote** only while current voting state is open.
- **SC-006**: Host and visitor journeys remain usable with keyboard only, at 320 CSS pixels, and at 200% zoom without horizontal overflow.
- **SC-007**: Voting state and access journeys maintain at least 99% successful-operation availability, excluding correct eligibility denials.

### Critical User Flows *(mandatory)*

- **CUF-001**: Host opens voting, all viewers see open state and Vote, host closes voting, all access and submissions stop.
- **CUF-002**: Eligible unrestricted visitor selects Vote and reaches placeholder voting route.
- **CUF-003**: Anonymous account-required visitor signs in or registers/verifies and returns to event.
- **CUF-004**: Code-required visitor enters unused code, wins atomic claim, and reaches placeholder; reuse fails retryably.
- **CUF-005**: Duplicate account/browser voter is denied before navigation, while code visitor may enter another code.

## Assumptions

- Existing event voting rules, generated-code inventory, session identity, browser marker, ballots, audit storage, and event routes are reused.
- Status is closed for existing events until host explicitly opens it after deployment.
- Public event availability and archived-event protections remain authoritative.
- Access grants are advisory navigation decisions; ballot submission always repeats authoritative checks.
- Hosts continue generating and managing voting codes through existing event settings while voting is open or closed.
- No new email or external provider is required.
