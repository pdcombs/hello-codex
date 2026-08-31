# Feature Specification: Review Voting Results

**Feature Branch**: `main`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Allow event hosts to review vote totals at any time, including ballot count and per-category results for single-select, multi-select, and ranked voting."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Vote Totals (Priority: P1)

As an event host, I can open Review Results at any time and see total ballots received plus results for every category, so I can understand current voting outcomes while voting is open or after it closes.

**Why this priority**: Hosts need one trusted place to understand participation and outcomes.

**Independent Test**: Open results for an event with accepted ballots and confirm total received equals accepted ballot count and every category appears with all eligible entries.

**Acceptance Scenarios**:

1. **Given** an event has accepted ballots, **When** its host opens Review Results, **Then** total votes received equals accepted ballot count and category results reflect all accepted ballots available at load time.
2. **Given** voting is open, closed, or has been reopened, **When** host opens Review Results, **Then** results are available without changing voting state.
3. **Given** event has no accepted ballots, **When** host opens Review Results, **Then** page shows zero votes, every category and entry with zero totals, and a clear empty-results message.
4. **Given** viewer is not event host, **When** viewer attempts to open results directly, **Then** private results are not returned or displayed.

---

### User Story 2 - Review Choice Results (Priority: P1)

As an event host using choose-one or choose-multiple voting, I see selection count beside each entry, ordered from most selections to least, with leading entries highlighted.

**Why this priority**: Direct selection totals determine outcomes for two supported voting methods.

**Independent Test**: Submit known single- and multi-select ballots, open results, and verify each selected entry gains one count per ballot selection, sorting is descending, and all positive leaders are highlighted.

**Acceptance Scenarios**:

1. **Given** choose-one ballots, **When** results load, **Then** each entry total equals number of ballots selecting it.
2. **Given** choose-multiple ballots, **When** results load, **Then** each selected entry gains one count from each ballot that selected it and unselected entries gain none.
3. **Given** entries have different totals, **When** category displays, **Then** entries are ordered largest total first.
4. **Given** multiple entries share highest positive total, **When** category displays, **Then** all tied leaders are highlighted as winners.

---

### User Story 3 - Review Ranked Results (Priority: P1)

As an event host using ranked voting, I see a weighted score for every entry, ordered highest first, so rankings across ballots produce a clear aggregate outcome.

**Why this priority**: Ranked ballots cannot be understood through raw selection counts.

**Independent Test**: For a category with five entries, submit known rankings and verify positions earn 4, 3, 2, 1, and 0 points, totals aggregate across ballots, and leaders are highlighted.

**Acceptance Scenarios**:

1. **Given** a ranked category has `N` entries, **When** one ballot is tallied, **Then** position `1` earns `N-1` points, position `2` earns `N-2`, continuing until final position earns `0`.
2. **Given** multiple ranked ballots, **When** results load, **Then** each entry's score equals sum of its awarded points across accepted ballots.
3. **Given** ranked entries have different scores, **When** category displays, **Then** entries are ordered highest score first.
4. **Given** multiple entries share highest positive score, **When** category displays, **Then** all tied leaders are highlighted as winners.

### Edge Cases

- Zero ballots show zero totals and no winner highlight.
- Entries tied below first place remain tied but are not highlighted as winners.
- Entries with equal totals retain event category entry order for deterministic display.
- Categories or entries archived after ballots were submitted remain represented when they are required to explain accepted ballot results.
- Accepted ballots containing historical titles continue to use ballot-time labels where available.
- A category with one ranked entry awards that entry zero points; after at least one ballot it is still the sole leader and is highlighted.
- Blank categories on individual ballots contribute no counts or points.
- Duplicate or malformed selections are excluded by ballot acceptance rules and cannot alter results.
- New ballots submitted after page load appear after results are refreshed or reopened; live streaming is not required.
- Temporary loading or service failures show retryable feedback without displaying stale totals as current.

## Scope Boundaries *(mandatory)*

### In Scope

- Host-only Review Results access from event workspace.
- Total accepted ballot count for event.
- Per-category results across all accepted ballots.
- Raw selection counts for choose-one and choose-multiple methods.
- weighted rank totals using `entry count - ranking position`.
- Descending result order, deterministic tie order, and winner highlighting.
- Zero-vote, loading, access-denied, and failure states.
- Current results whenever host loads or refreshes page.

### Out of Scope

- Public or voter access to event-wide results.
- Percentages, charts, exports, printable reports, or result sharing.
- Live push updates while results page remains open.
- Tie-breakers or declaring one winner when top totals are tied.
- Changing, deleting, or recounting accepted ballots.
- Per-voter ballot identity disclosure.
- Finalizing, certifying, or locking results.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Event host MUST be able to open Review Results regardless of whether voting is open or closed.
- **FR-002**: Results access MUST require authenticated event-host ownership at authoritative boundary.
- **FR-003**: Non-hosts MUST NOT receive event-wide ballot counts, category totals, scores, or winner indicators.
- **FR-004**: Results MUST count only accepted ballot submissions for requested event.
- **FR-005**: Page MUST show total accepted ballots as “votes received,” counting each ballot once regardless of selections made.
- **FR-006**: Results MUST include every event category and every relevant entry, including entries with zero selections or points.
- **FR-007**: For choose-one categories, each valid entry selection MUST add exactly one to that entry's total.
- **FR-008**: For choose-multiple categories, each selected entry MUST add exactly one per ballot and each unselected entry MUST add zero.
- **FR-009**: For ranked categories containing `N` entries, rank position `P` MUST award `N-P` points.
- **FR-010**: Ranked entry score MUST equal sum of points awarded across all accepted ballots.
- **FR-011**: Entries within each category MUST sort by total or score descending.
- **FR-012**: Entries tied on total or score MUST retain category entry order; if unavailable, stable title order MUST be used.
- **FR-013**: Every entry tied for highest positive total or score MUST be marked as winner.
- **FR-014**: A sole ranked entry MUST be marked winner after at least one ballot ranks it even though its score is zero.
- **FR-015**: No winner MUST be marked for a category with no contributing ballot selections or rankings.
- **FR-016**: Historical accepted ballot selections MUST remain countable when entries or categories are later archived.
- **FR-017**: Results MUST preserve ballot-time category and entry labels when those snapshots exist and provide safe fallback labels otherwise.
- **FR-018**: Reloading or refreshing results MUST calculate against latest accepted ballots without mutating ballots or voting status.
- **FR-019**: Page MUST provide clear loading, zero-result, success, access-denied, and retryable failure states on current mobile and desktop browsers.
- **FR-020**: Result access MUST create privacy-safe audit and operational records without ballot choices, voter contact data, voting codes, or browser identifiers.

### Key Entities *(include if feature involves data)*

- **Event Results**: Host-only summary containing event identity, accepted ballot count, calculation time, and ordered category results.
- **Category Result**: Voting method plus ordered entry results and indication whether any ballot contributed to category.
- **Entry Result**: Entry identity, display title, original display order, selection count or ranked score, and winner status.
- **Accepted Ballot**: Immutable source vote counted once in event total and interpreted per category voting method.

### Ownership and Access *(include if feature involves user-controlled data)*

- Event host owns event-wide aggregated results and may view them at any voting state.
- Participants, voters, anonymous visitors, and non-owner accounts cannot view event-wide results in this feature.
- Individual ballot ownership and private ballot-history permissions remain unchanged.
- Result views expose aggregates only and never identify which voter selected an entry.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of test events show votes received equal to accepted ballot count.
- **SC-002**: 100% of choose-one and choose-multiple fixtures produce exact expected selection totals.
- **SC-003**: 100% of ranked fixtures produce exact `N-P` aggregate scores, including zero-point final positions.
- **SC-004**: 100% of top ties highlight all co-winners and no lower-place entries.
- **SC-005**: 100% of unauthorized result requests reveal no aggregate or ballot data.
- **SC-006**: Hosts see results or actionable failure feedback within 2 seconds for events containing up to 10,000 accepted ballots under normal conditions.
- **SC-007**: At least 90% of hosts in usability validation correctly identify ballot count and category leaders without instructions.

### Critical User Flows *(mandatory)*

- **CUF-001**: Authenticated host opens event Review Results, sees current votes received, reviews ordered results for single, multiple, and ranked categories, and identifies highlighted winner or co-winners.
- **CUF-002**: Non-host attempts direct results access and receives no private aggregate data.

## Assumptions

- “Votes received” means number of accepted ballots, not number of selected entries.
- Rank scoring follows Borda-style `N-P`: with five entries, ranks one through five earn 4, 3, 2, 1, and 0 points.
- Ties remain ties; all top tied entries are co-winners.
- Choose-one and choose-multiple winners require a positive total. Ranked sole-entry category may have a zero-point winner when at least one ranking contributed.
- Existing accepted ballots and ballot-time label snapshots are authoritative inputs.
- Results are recalculated when requested; stored ballots remain immutable.
- Existing host event workspace and authentication are reused.
