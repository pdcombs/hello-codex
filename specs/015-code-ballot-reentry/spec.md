# Feature Specification: Require New Code for Each Ballot

**Feature Branch**: `main`

**Created**: 2026-08-31

**Status**: Ready for planning

**Input**: Correct code-protected voting so one code permits exactly one ballot, while a voter reviewing a completed ballot can always begin another vote by supplying a different unused code on the same device.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enforce One Ballot Per Code (Priority: P1)

A voter who enters a valid voting code may submit exactly one ballot with that code. After acceptance, the consumed code cannot authorize another ballot, even from the same browser or through a retained browser session.

**Why this priority**: Generated codes represent individual voting rights. Reusing one code would undermine ballot integrity.

**Independent Test**: Submit a ballot with a valid code, then attempt another submission using the same code and device; prove the second ballot is rejected and the first remains unchanged.

**Acceptance Scenarios**:

1. **Given** an unused valid code, **When** a voter submits an accepted ballot, **Then** that code becomes consumed by that ballot.
2. **Given** a consumed code, **When** any voter attempts to use it for another ballot, **Then** access is denied and no additional ballot is stored.
3. **Given** a browser retained access from an earlier code, **When** it starts another vote, **Then** retained access does not bypass the requirement for a new unused code.
4. **Given** two nearly simultaneous submissions using one code, **When** both reach authoritative validation, **Then** no more than one ballot is accepted.

---

### User Story 2 - Vote Again With a New Code (Priority: P1)

After submitting or later revisiting a completed ballot, a person using the same device can choose **Cast another vote**. The application asks for a new voting code before showing a fresh ballot. This supports handing the device to another eligible person without losing access to the prior ballot review.

**Why this priority**: Shared-device voting is the intended reason code-protected events allow multiple ballots from one browser.

**Independent Test**: Submit with one code, select **Cast another vote**, enter a different unused code, and successfully submit a separate ballot from the same browser.

**Acceptance Scenarios**:

1. **Given** a completed code-protected ballot, **When** its review screen appears, **Then** **Cast another vote** is visible.
2. **Given** a voter returns to the voting screen later and sees the latest completed ballot, **When** the event remains open, **Then** **Cast another vote** is visible.
3. **Given** the voter selects **Cast another vote**, **When** the event requires codes, **Then** a code-entry prompt appears before a new editable ballot.
4. **Given** a different unused valid code, **When** it is supplied, **Then** a blank editable ballot opens and the previous ballot remains immutable.
5. **Given** an invalid, expired, or consumed code, **When** it is supplied, **Then** the prompt remains available, an actionable message appears, and no new ballot opens.

---

### User Story 3 - Preserve Completed Ballot Review (Priority: P2)

The same browser can continue to review its latest submitted ballot without re-entering its consumed code. Review access and permission to create another ballot are treated as separate rights.

**Why this priority**: Voters need confirmation of their saved choices without accidentally granting another vote.

**Independent Test**: Submit, leave, and revisit the voting screen; verify the last ballot is visible read-only while starting another vote still requires a new code.

**Acceptance Scenarios**:

1. **Given** a completed ballot on the current browser, **When** the voter revisits, **Then** the latest ballot remains visible read-only.
2. **Given** a visible prior ballot, **When** another vote begins, **Then** the prior ballot is neither edited nor replaced.
3. **Given** another ballot is submitted with a new code, **When** completion is shown, **Then** the newly submitted ballot becomes the latest review while all earlier ballots remain preserved.

### Edge Cases

- Voting closes before the voter enters a new code or submits the next ballot; the new attempt is denied without affecting prior ballots.
- Event rules change away from code-required access; current authoritative rules determine the next-vote flow.
- No unused codes remain; **Cast another vote** remains available, but the code prompt explains that a new unused code is required.
- The voter cancels code entry; the last completed ballot remains visible and unchanged.
- A code was accepted for access but voting closes before submission; code-consumption behavior follows the existing authoritative claim policy, but it must never permit more than one accepted ballot.
- Network retries for one submission attempt return the original result and do not count as another use of the code.
- Multiple completed ballots exist on one browser; only the latest is shown in this review flow, while prior immutable records remain retained.

## Scope Boundaries *(mandatory)*

### In Scope

- One accepted ballot per generated voting code.
- Authoritative prevention of reused-code ballot submission.
- Separation of completed-ballot review access from new-ballot authorization.
- Always-visible **Cast another vote** action for completed code-protected ballots while voting is open.
- New-code prompt before each additional ballot on a code-protected event.
- Shared-device handoff using a different unused code.
- Clear invalid, consumed, unavailable, closed-voting, and retry states.
- Automated coverage of user interface, service boundary, persistence concurrency, and critical end-to-end flows.

### Out of Scope

- Changing how hosts generate or manage voting codes.
- Allowing a code to cast more than one accepted ballot.
- Editing, deleting, or replacing prior ballots.
- Showing a history list of every ballot cast from a browser.
- Automated distribution of codes to voters.
- Changing repeat-vote behavior for account-required or anyone-with-link events.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each generated voting code MUST authorize no more than one accepted ballot for its event.
- **FR-002**: Code uniqueness MUST be enforced at the authoritative submission boundary, independent of client or browser state.
- **FR-003**: A retained browser identity or prior code-derived access grant MUST NOT authorize an additional ballot for a code-protected event.
- **FR-004**: Successful code-protected submission MUST associate the accepted ballot with the exact code that authorized it.
- **FR-005**: Concurrent or repeated submission attempts with the same code MUST result in no more than one distinct accepted ballot, excluding an idempotent retry of the original attempt.
- **FR-006**: An idempotent retry of the same accepted submission attempt MUST return the original success without consuming another code or creating another ballot.
- **FR-007**: Completed code-protected ballot review MUST show **Cast another vote** whenever the event is currently open.
- **FR-008**: Revisited code-protected ballot review MUST show **Cast another vote** whenever the event is currently open, regardless of whether the previously used code is consumed.
- **FR-009**: Selecting **Cast another vote** for a code-protected event MUST require a new code before presenting an editable ballot.
- **FR-010**: Only a different valid unused code for the same event MUST unlock the next editable ballot.
- **FR-011**: Starting another vote MUST clear prior editable choices while preserving every previously accepted ballot unchanged.
- **FR-012**: Invalid, consumed, or event-mismatched codes MUST produce actionable feedback and MUST NOT open a new ballot.
- **FR-013**: If no unused code is available, the application MUST explain that a new unused code is required without hiding the option to try another code.
- **FR-014**: Canceling the new-code prompt MUST return the voter to the latest read-only ballot without changing it.
- **FR-015**: Review authorization MUST remain sufficient to retrieve the current browser's latest ballot but MUST remain separate from authorization to submit another ballot.
- **FR-016**: After a second ballot is accepted using a new code, the latest ballot MUST become the read-only review shown on that browser.
- **FR-017**: Current open/closed status and current access rules MUST be revalidated before new-code acceptance and again at ballot submission.
- **FR-018**: Denied code reuse and accepted new-code ballots MUST produce privacy-safe operational and audit signals without exposing code values or vote choices.
- **FR-019**: Code entry, errors, completed review, and repeat-vote controls MUST remain usable by keyboard and on current mobile and desktop browsers.

### Key Entities

- **Voting Code**: Event-scoped credential with unused or consumed state; authorizes at most one accepted ballot.
- **Code-Authorized Ballot**: Immutable accepted ballot associated with the one code that authorized it.
- **Ballot Review Identity**: Retained identity allowing the browser to see its latest completed ballot without granting another submission.
- **Next-Vote Authorization**: Temporary permission created only after a different unused code is supplied for the next ballot.
- **Submission Attempt**: Stable attempt identity distinguishing safe retry from a separate ballot attempt.

### Ownership and Access

- Event host owns and manages the event's code inventory but cannot inspect individual ballot choices through this feature.
- A voter possessing an unused event code may authorize one ballot with that code.
- The same browser may privately review its latest ballot and begin another code-entry flow.
- Possession of review identity alone never grants another code-protected ballot.
- All code state and ballot authorization decisions are enforced at the trusted application boundary.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of sequential and concurrent reuse tests accept no more than one distinct ballot per code.
- **SC-002**: 100% of completed and revisited code-protected ballot screens show **Cast another vote** while voting remains open.
- **SC-003**: 100% of repeat-vote attempts require a different unused code before an editable ballot appears.
- **SC-004**: 100% of accepted second ballots preserve the first ballot unchanged and associate each ballot with a different code.
- **SC-005**: In usability testing, at least 90% of shared-device users begin a second vote and reach a fresh ballot in under 30 seconds when given a valid unused code.
- **SC-006**: Invalid or consumed-code attempts display actionable feedback within two seconds under normal operating conditions and store no ballot.
- **SC-007**: Repeat-vote and code-entry flows remain fully operable with keyboard only and without horizontal overflow at 320 CSS pixels and 200% zoom.

### Critical User Flows *(mandatory)*

- **CUF-001**: Voter submits with code A, sees completed ballot, selects **Cast another vote**, supplies code B, and reaches a blank editable ballot.
- **CUF-002**: Voter submits with code A, revisits later, reviews the latest ballot, and is still offered **Cast another vote**.
- **CUF-003**: Voter attempts another ballot with consumed code A and is denied without creating or changing a ballot.
- **CUF-004**: Two attempts compete to submit with one code; only one distinct ballot is accepted.
- **CUF-005**: Voter cancels or fails new-code entry and safely returns to the unchanged completed ballot.

## Assumptions

- Generated codes remain event-specific and are managed through existing event settings.
- **Cast another vote** remains visible for open code-protected events even when no unused codes are known to be available, because another person may possess a newly generated code.
- The latest-ballot review convention from Feature 014 remains unchanged; a full ballot history screen is deferred.
- Existing code-claim behavior may reserve or consume a code before final ballot acceptance, but every accepted ballot still requires a unique code and a code can never authorize two accepted ballots.
- Non-code access policies retain their existing repeat-voting rules and are not changed by this correction.
