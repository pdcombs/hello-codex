# Feature Specification: View Previous Vote Submissions

**Feature Branch**: `main`

**Created**: 2026-08-31

**Status**: Ready for planning

**Input**: Let voters bypass new-code entry to privately review ballots previously submitted by their signed-in account or current browser session through a **View previous votes** action in the voting-code confirmation dialog.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Previous Votes From Code Prompt (Priority: P1)

A voter who has already submitted a ballot selects **Vote** on a code-protected event. When asked for another voting code, voter can select **View previous votes** instead. Application closes code-entry flow and opens private read-only submission history without requiring another code.

**Why this priority**: New-code gate currently blocks natural route back to completed ballot review.

**Independent Test**: Submit one ballot, return to event, select **Vote**, choose **View previous votes**, and verify saved ballot appears without entering a code.

**Acceptance Scenarios**:

1. **Given** current account or browser session has prior ballot for event, **When** code prompt opens, **Then** **View previous votes** is available.
2. **Given** prior ballot exists, **When** voter selects **View previous votes**, **Then** code prompt closes and private history opens without code validation.
3. **Given** voter opens history, **When** ballots render, **Then** each ballot is read-only and matches saved selections, category labels, entry labels, ranking, and submission time.
4. **Given** voter has no prior ballot under current identity, **When** code prompt opens, **Then** history action is not presented as available.

---

### User Story 2 - Review Multiple Previous Ballots (Priority: P1)

Account or shared browser may have submitted multiple ballots using different codes. History shows every authorized submission for current event, newest first, with clear separation between ballots.

**Why this priority**: Shared-device code voting deliberately permits multiple people to vote; latest-only review hides earlier confirmed submissions.

**Independent Test**: Submit ballots with two different codes on same browser, open previous votes, and verify both immutable ballots appear newest first.

**Acceptance Scenarios**:

1. **Given** identity has multiple event ballots, **When** history opens, **Then** every matching ballot appears once, newest first.
2. **Given** two ballots contain different choices, **When** reviewed, **Then** each retains its own exact saved snapshots and submission time.
3. **Given** many previous ballots, **When** voter scrolls history, **Then** each remains distinguishable and usable on mobile/desktop.
4. **Given** prior entries/categories were renamed or archived, **When** history renders, **Then** saved ballot labels remain those accepted at submission.

---

### User Story 3 - Keep History Private and Continue Voting (Priority: P2)

Only account or browser identity associated with ballots may review them. From history, voter can return to event or start another vote; code-protected next vote still requires different unused code.

**Why this priority**: Ballot choices are private, and review path must not weaken one-code-per-ballot integrity.

**Independent Test**: Try history from another account/browser and verify no ballots leak; then use legitimate history action and start another vote, confirming new code remains required.

**Acceptance Scenarios**:

1. **Given** another account or browser, **When** it requests event history, **Then** ballots owned by original identity are never returned.
2. **Given** event host did not cast ballots under current voter identity, **When** host accesses event, **Then** ownership alone does not expose individual ballots.
3. **Given** legitimate history view, **When** voter selects **Cast another vote**, **Then** code-entry flow requires different unused code before editable ballot.
4. **Given** voting is closed, **When** voter opens previous history through an available review path, **Then** existing ballots remain reviewable but another vote is unavailable.

### Edge Cases

- Browser identity cookie was cleared; anonymous prior ballots cannot be recovered or exposed.
- User signs in after casting anonymously; anonymous browser ballots are not automatically merged into account history.
- Account has ballots from another device; signed-in account history includes them for same event.
- No prior ballots exist; code prompt remains focused on entering new code and does not offer false history access.
- Prior ballot uses legacy data without stored labels; history uses existing compatible fallback without mutating record.
- Ballot list grows large; history loads in bounded pages and never duplicates/omits records between pages.
- Voting closes while history is open; review remains read-only and repeat-vote action disappears or returns closed message.
- Network or service failure during history load shows retry without returning to code entry or exposing partial foreign data.
- Code-entry prompt error is visible when voter chooses history; history navigation ignores code text/error and performs independent authorization.

## Scope Boundaries *(mandatory)*

### In Scope

- **View previous votes** action in code-entry dialog when current identity has history.
- Private event-specific ballot history for signed-in account or current anonymous browser identity.
- All authorized ballots, ordered newest first.
- Read-only exact ballot snapshots and submission timestamps.
- Empty, loading, failure, pagination, accessibility, and responsive states.
- Return-to-event and start-another-vote actions while preserving fresh-code requirement.
- Server-authoritative history access and privacy-safe observability.

### Out of Scope

- Event vote totals, winners, rankings, public results, or analytics.
- Host access to individual voter ballots.
- Editing, deleting, withdrawing, or replacing submissions.
- Recovering anonymous ballots after browser identity is lost.
- Merging anonymous browser history into signed-in account history.
- Cross-event ballot history dashboard.
- Revealing code values used for prior ballots.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Code-entry dialog MUST offer **View previous votes** only when current account/browser identity has at least one ballot for current event.
- **FR-002**: History action MUST not require entering or validating new voting code.
- **FR-003**: Selecting history MUST close code dialog and open event-specific private ballot history.
- **FR-004**: Signed-in history MUST include ballots associated with current account for event across devices.
- **FR-005**: Anonymous history MUST include ballots associated with current browser identity for event.
- **FR-006**: Account identity MUST take precedence when signed in; anonymous history MUST NOT be silently merged into account history.
- **FR-007**: History MUST return every authorized ballot exactly once, ordered newest first with stable ordering for equal timestamps.
- **FR-008**: Each history item MUST show submission time and exact immutable category, entry, selection, and ranking snapshots.
- **FR-009**: History MUST preserve compatibility with readable legacy ballots without modifying accepted records.
- **FR-010**: History MUST never expose ballots associated only with another account or browser identity.
- **FR-011**: Event host ownership MUST NOT grant access to individual ballot history.
- **FR-012**: History access MUST be authorized independently from code-entry state and repeat-vote authorization.
- **FR-013**: History MUST remain available for accepted ballots when voting is closed, subject to same identity authorization.
- **FR-014**: **Cast another vote** from history MUST follow current event status/rules and require different unused code for code-protected events.
- **FR-015**: History MUST support bounded pagination with no duplicate or missing ballot across page boundaries.
- **FR-016**: History screen MUST provide loading, empty, failure, retry, and read-only states.
- **FR-017**: Code dialog and history MUST be keyboard-operable, screen-reader labeled, mobile usable, and free of horizontal overflow at 320 CSS pixels and 200% zoom.
- **FR-018**: History reads MUST emit privacy-safe operational signals without logging choices, raw codes, browser markers, or personal data.
- **FR-019**: Existing one-code-per-ballot restriction MUST remain unchanged and authoritative.

### Key Entities

- **Ballot History**: Event-scoped ordered collection of ballots authorized for current identity.
- **Ballot History Item**: Immutable submitted ballot snapshot with identity, submission time, categories, choices, and ranks.
- **History Identity**: Signed-in account or retained anonymous browser identity used for private authorization.
- **History Page**: Bounded ordered slice plus continuation indicator.
- **Voting Code Prompt**: Existing gate for new ballot access, enhanced with independent prior-history action.

### Ownership and Access

- Voter account may view ballots stored under that account for selected event.
- Anonymous browser may view ballots stored under current retained browser identity for selected event.
- Signed-in identity does not automatically inherit anonymous browser ballots.
- Host cannot view individual ballots unless host independently cast them under same voter identity.
- Public users and other identities receive no indication or content of another voter’s ballot history.
- Server boundary authorizes every history request; interface visibility alone grants no access.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of returning voters with prior submissions reach history from event page in under 15 seconds without entering code.
- **SC-002**: 100% of authorized history tests return all matching ballots exactly once in newest-first order.
- **SC-003**: 100% of unauthorized account, browser, host-only, and cleared-session tests reveal zero foreign ballot choices.
- **SC-004**: 100% of rendered history choices and rankings match immutable accepted snapshots.
- **SC-005**: 100% of start-another-vote attempts from code-protected history still require different unused code.
- **SC-006**: History becomes visibly ready within two seconds for 95% of normal requests containing up to 50 ballots.
- **SC-007**: Code prompt and history remain usable by keyboard, at 320 CSS pixels, and at 200% zoom without hidden controls or horizontal overflow.

### Critical User Flows *(mandatory)*

- **CUF-001**: Returning code voter selects **Vote**, chooses **View previous votes**, and reviews saved ballot without new code.
- **CUF-002**: Shared browser submits code A and code B ballots, then reviews both newest first with exact choices.
- **CUF-003**: Another account/browser or event host attempts history and receives no foreign ballots.
- **CUF-004**: Voter opens history after voting closes and reviews prior ballots without repeat-vote action.
- **CUF-005**: Voter starts another vote from history and must supply different unused code before editable ballot.

## Assumptions

- “Previous results” means voter’s own submitted ballot choices, not aggregated event results or winners.
- Current browser identity remains available through existing retained marker; clearing it makes anonymous recovery impossible.
- Signed-in account is authoritative identity even when browser also has anonymous ballot marker.
- All previous ballots for current event are desired, not latest-only review.
- Initial history pages are bounded at a reasonable default; voter can load more when needed.
- Exact accepted snapshots introduced by Feature 014 remain primary display source.
- Feature 015 new-code enforcement remains unchanged.
