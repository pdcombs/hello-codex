# Feature Specification: Cast Event Ballot

**Feature Branch**: `main`

**Created**: 2026-08-31

**Status**: Ready for planning

**Input**: Replace voting placeholder with one-page category ballot supporting single selection, multiple selection, and ordered ranking; confirm and persist submission; show completed ballot read-only.

## Clarifications

### Session 2026-08-31

- Q: Does irreversible submission override existing repeat-voting rules? A: No. Submitted ballot cannot be edited; another ballot remains allowed only when existing rules permit it.
- Q: May participating voter submit partial ranking? A: No. Ranking category must contain every active entry or remain blank.
- Q: Does completed-ballot review survive refresh/revisit? A: Yes. Same account, browser, or code-derived voter identity may privately revisit saved ballot.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Event Ballot (Priority: P1)

Eligible voter enters open event voting screen and sees every active category as one section with every active entry. Control type follows event voting method: one choice, multiple choices, or ordered ranking. Voter may skip categories but must make at least one selection somewhere before submission.

**Why this priority**: Selecting entries across event categories is core voting job.

**Independent Test**: Open eligible ballot containing all three voting methods, make valid selections in one or more categories, leave another category blank, and verify ballot becomes ready for confirmation.

**Acceptance Scenarios**:

1. **Given** eligible voter and open voting, **When** voting screen loads, **Then** every active category and active entry appears in event order.
2. **Given** single-selection method, **When** voter chooses entry, **Then** only one entry remains selected in that category.
3. **Given** multiple-selection method, **When** voter chooses entries, **Then** all choices within current category limits remain selected.
4. **Given** ranking method, **When** voter orders entries, **Then** screen clearly shows best choice first and worst choice last.
5. **Given** voter skips one or more categories but selects at least one valid choice elsewhere, **When** voter continues, **Then** submission remains allowed.
6. **Given** ballot has no selections, **When** voter selects **Submit vote**, **Then** confirmation does not open and screen explains at least one category needs a selection.

---

### User Story 2 - Confirm and Submit Vote (Priority: P1)

Voter uses sticky **Submit vote** action visible while scrolling. Before irreversible submission, bottom sheet asks for confirmation and warns that vote cannot be redone. Confirmed valid ballot is stored once under rules and voting state current at submission time.

**Why this priority**: Ballot integrity requires deliberate, authoritative, duplicate-safe submission.

**Independent Test**: Prepare valid ballot, open confirmation, cancel without changes, reopen, confirm, and prove exactly one immutable ballot is stored.

**Acceptance Scenarios**:

1. **Given** long ballot, **When** voter scrolls, **Then** **Submit vote** stays available at bottom of viewport without covering ballot controls.
2. **Given** valid selections, **When** voter selects **Submit vote**, **Then** accessible bottom sheet asks “Are you sure? You will not be able to redo your vote after submitting.”
3. **Given** confirmation sheet, **When** voter cancels, **Then** no ballot is stored and selections remain editable.
4. **Given** confirmation sheet, **When** voter confirms once, **Then** exactly one ballot is stored and duplicate confirm actions cannot create another copy.
5. **Given** voting closed or rules changed after screen load, **When** voter confirms, **Then** submission fails safely, preserves editable choices, and explains required refresh or closure.

---

### User Story 3 - Review Completed Ballot (Priority: P2)

After successful submission, voter sees completion message at top. Same ballot form remains visible in read-only state showing submitted choices and ranking order.

**Why this priority**: Immediate proof reduces uncertainty and accidental repeat attempts.

**Independent Test**: Submit ballot, verify completion state, then attempt every control and prove saved choices remain visible but cannot change.

**Acceptance Scenarios**:

1. **Given** successful submission, **When** response completes, **Then** top of voting screen states voting is complete.
2. **Given** completed ballot, **When** voter reviews sections, **Then** submitted choices and rank order match stored ballot.
3. **Given** completed ballot, **When** voter tries selection, reorder, or submission controls, **Then** no stored or displayed choice changes.

### Edge Cases

- Category or entry becomes archived after page load; stale selection is rejected and voter can refresh current ballot.
- Voting closes after page load; submission fails closed and no partial ballot is stored.
- Voting rules version changes after page load; stale ballot is rejected and selections are not silently reinterpreted.
- Network response is lost after successful storage; retry uses same submission identity and cannot create duplicate ballot.
- Multiple-selection category enforces configured minimum and maximum only when category has selections; skipped category remains valid.
- Ranking remains keyboard and touch operable, exposes current order to assistive technology, and avoids drag-only interaction.
- Sticky action and confirmation sheet remain usable at 320 CSS pixels, 200% zoom, and with on-screen keyboard open.
- Empty categories display clear empty state and do not count as ballot selection.
- At least one selection means one chosen entry in any method; ranking participation rules require clarification below.

## Scope Boundaries *(mandatory)*

### In Scope

- Real voting screen replacing placeholder route.
- One scrolling form containing all active category sections and entries.
- Single, multiple, and ranking interactions from active event rules.
- Optional category participation with at least one selection across whole ballot.
- Sticky submission action and accessible confirmation bottom sheet.
- Authoritative validation, idempotent ballot persistence, and current state/rules enforcement.
- Completion message and read-only submitted ballot view.
- Loading, empty, validation, conflict, failure, accessibility, responsive, audit, and observability behavior.

### Out of Scope

- Vote counting, results, winners, ties, result publication, or analytics.
- Editing entries, categories, voting rules, or voting status from ballot screen.
- Draft ballot persistence before confirmed submission.
- Changing or deleting accepted ballots.
- Free-text write-ins.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Allowed voter selecting **Vote** MUST reach event ballot screen instead of placeholder.
- **FR-002**: Ballot screen MUST show event identity, current open status, every active category, and every active entry grouped by category in stable order.
- **FR-003**: Ballot MUST use event-level voting method consistently for all categories unless existing stored compatibility data explicitly resolves otherwise.
- **FR-004**: Single-selection category MUST allow no selection or exactly one active entry.
- **FR-005**: Multiple-selection category MUST allow no selection or selections satisfying configured minimum and maximum.
- **FR-006**: Ranking category MUST allow either no ranking or every active entry exactly once in a unique best-to-worst order.
- **FR-007**: Voter MUST be allowed to leave any category blank.
- **FR-008**: Ballot MUST contain at least one selected entry across all categories before confirmation.
- **FR-009**: Ranking interaction MUST communicate best-to-worst direction and support pointer, touch, and keyboard operation without drag-only dependency.
- **FR-010**: **Submit vote** action MUST remain sticky at viewport bottom while ballot is editable and MUST not obscure content or controls.
- **FR-011**: Valid submission attempt MUST open accessible confirmation bottom sheet with clear irreversible warning, cancel action, and confirm action.
- **FR-012**: Canceling confirmation MUST preserve editable selections and MUST NOT store ballot.
- **FR-013**: Confirming MUST revalidate current event availability, manual open status, voting rules version, entries, eligibility, access policy, repeat limits, and category selections.
- **FR-014**: Successful confirmation MUST atomically store exactly one immutable ballot and all related code/access effects.
- **FR-015**: Retried or duplicate confirmation for same attempt MUST return original success without another ballot.
- **FR-016**: Accepted ballot MUST never be edited or replaced; voter MAY submit another separate ballot only when current repeat-voting rules permit it.
- **FR-017**: Successful submission MUST show completion message at top and render submitted ballot read-only with exact saved selections and order.
- **FR-018**: Same account, browser, or code-derived voter identity MUST be able to privately retrieve and review its accepted ballot after refresh or revisit without reusing a consumed code.
- **FR-019**: Read-only state MUST remove or disable all selection, reorder, confirmation, and submission actions.
- **FR-020**: Submission failures MUST preserve local selections when safe and provide actionable closed, changed-rules, invalid-selection, repeat-limit, used-code, or service failure message.
- **FR-021**: System MUST reject categories or entries not active under current authoritative event state, regardless of stale client display.
- **FR-022**: Ballot records MUST retain event, applicable voter/access evidence, rules version, category choices, ordered ranks, submission time, and immutable identity needed for later results.
- **FR-023**: Ballot reads MUST reveal vote choices only to voter authorized for that exact ballot; host/public result access remains out of scope.
- **FR-024**: Successful submissions and integrity failures MUST produce privacy-safe audit and operational signals without logging vote choices, codes, browser markers, or personal data.
- **FR-025**: Voting screen MUST provide loading, empty, validation, confirmation, submitting, success, and retryable failure states usable on current mobile and desktop browsers.

### Key Entities

- **Ballot Form**: Current event categories, active entries, resolved method, rules version, voting-state version, and voter selections before submission.
- **Category Choice**: Optional selection for one category; one entry, multiple entries, or ordered entries according to method.
- **Submitted Ballot**: Immutable accepted vote with event, rules snapshot references, access evidence, ordered category choices, and submission time.
- **Submission Attempt**: Stable identity preventing double storage during retries or repeated confirmation.
- **Ballot Review Authorization**: Evidence allowing exact voter to read submitted choices without exposing them to host or public result views.

### Ownership and Access

- Eligible voter owns ability to create ballot under current event rules, not event host.
- Accepted ballot choices are private to submitting voter in this feature.
- Event host controls open/closed state and rules but cannot inspect individual ballot choices through this feature.
- Server boundary authoritatively evaluates eligibility and stores ballots; client state never grants submission permission.
- Public and other voters cannot read another voter’s selections.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of eligible test users complete ballot containing up to 10 categories and 100 entries in under five minutes without assistance.
- **SC-002**: 100% of accepted ballots match selections shown in completed read-only state.
- **SC-003**: 100% of duplicate confirmation and lost-response tests store exactly one ballot per submission attempt.
- **SC-004**: 100% of submissions after voting closure, stale rules, or lost eligibility are rejected without partial ballot storage.
- **SC-005**: Voting form, sticky action, ranking controls, and confirmation remain usable with keyboard only, at 320 CSS pixels, and at 200% zoom without horizontal overflow or hidden controls.
- **SC-006**: 95% of voting screens and submission outcomes become visibly ready within two seconds under normal operating conditions.
- **SC-007**: 100% of empty-ballot attempts receive actionable validation before confirmation.

### Critical User Flows *(mandatory)*

- **CUF-001**: Eligible voter opens ballot, selects one or more categories across configured method, confirms, and sees exact read-only completed ballot.
- **CUF-002**: Voter leaves categories blank but makes at least one valid selection and successfully submits.
- **CUF-003**: Voter cancels confirmation, edits choices, then submits once without duplicate storage.
- **CUF-004**: Voting closes or rules change before confirmation; stale submission fails safely with selections preserved for recovery.
- **CUF-005**: Keyboard/mobile voter completes ranking and confirmation without drag-only controls or obscured content.

## Assumptions

- Feature 013 access gate, manual open/closed state, account/browser/code policies, and generated-code claim remain authoritative.
- Durable ballot review uses existing account identity or retained browser/access grant evidence; clearing anonymous browser identity may make prior ballot review unavailable.
- Event-level voting method introduced by Feature 011 applies to all categories; legacy category overrides remain compatibility data but are not editable.
- Category order and entry order use existing event display order.
- Ballots remain immutable after acceptance; results interpretation is deferred.
- Confirmation copy may receive minor editorial polish without changing warning meaning.
- No autosaved draft; selections live only in current page until accepted.
