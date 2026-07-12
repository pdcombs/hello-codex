# Feature Specification: Entry-Derived Participants

**Feature Branch**: `main`

**Created**: 2026-07-12

**Status**: Draft

**Input**: User description: "Make event participation derive from entry ownership, prevent orphaned entries, and replace the Participants tab with participant cards showing name, email, entry titles, and entry count."

## Clarifications

### Session 2026-07-12

- Q: What should participant and entry removal do? → A: Every removal archives records rather than hard deleting them. Archiving one entry leaves participation intact while another active entry remains; archiving the final active entry removes derived participation; removing a participant archives all of that account's active entries in the event.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Derive Participants from Entries (Priority: P1)

An event host sees a participant whenever that account owns at least one entry in the event. Participation is not maintained as a separate event relationship, so the participant list cannot disagree with the event's entries.

**Why this priority**: Entries are the event's voting objects and the sole source of participation. Removing duplicate participation state prevents orphaned entries and inconsistent participant views.

**Independent Test**: Give an account active entries in one event and a pre-archived final-entry fixture in another, then verify the account appears exactly where it still owns active entries while its account and archived history remain intact.

**Acceptance Scenarios**:

1. **Given** an account owns one or more entries in an event, **When** participation is viewed, **Then** the account appears exactly once as a participant in that event.
2. **Given** an account owns no entries in an event, **When** participation is viewed, **Then** the account does not appear as a participant in that event.
3. **Given** an account owns entries in multiple events, **When** one event's participants are viewed, **Then** only entries and participation for that event are included.
4. **Given** an account has a pre-archived final event entry and no active entries, **When** the event is viewed, **Then** the account is not considered a participant, while the account and archived entry history remain intact.

---

### User Story 2 - Review Participant Cards (Priority: P2)

An event host opens the Participants tab and sees one card per entry-owning account. Each card presents the participant's display name, email address, entry count, and a simple list of entry titles.

**Why this priority**: Hosts need a concise, accurate view of who participates and what each person entered without exposing unrelated account or category details.

**Independent Test**: Open the Participants tab for an event whose participants own different numbers of entries and verify every card's identity, titles, and count against the event entries.

**Acceptance Scenarios**:

1. **Given** a participant owns three event entries, **When** the host opens the Participants tab, **Then** one card shows the participant's display name as title, email as subtitle, all three entry titles in the body, and the number 3 on the right.
2. **Given** multiple accounts own entries in the event, **When** the tab loads, **Then** each account appears on exactly one card and no account without an event entry appears.
3. **Given** an event has no entries, **When** the host opens the Participants tab, **Then** a clear empty state explains that participants appear after entries are added.
4. **Given** an entry is added or archived, **When** the participant view refreshes, **Then** the affected card's title list and count reflect the active entries.

---

### User Story 3 - Keep Entry Changes Consistent (Priority: P3)

An event host can change event entries without leaving stale participant records or entry references. Any participant-management action operates through the person's entries rather than a separate event registration.

**Why this priority**: Consistency safeguards the new model and prevents recurrence of the reported orphaned-entry defect.

**Independent Test**: Exercise entry creation and archival for an existing and a new account, then verify categories, participant cards, and entry counts all describe the same active entries.

**Acceptance Scenarios**:

1. **Given** a host adds the first event entry for an account, **When** creation succeeds, **Then** the account automatically appears in the participant view without a separate participant record.
2. **Given** a host removes one of several entries owned by an account, **When** removal succeeds, **Then** only that entry is archived and disappears from active views, while the participant remains with the reduced count.
3. **Given** a host removes an account's final active event entry, **When** removal succeeds, **Then** the entry is archived, disappears from its category, and the account disappears from the participant view.
4. **Given** a host removes a participant, **When** the host confirms removal, **Then** all active entries owned by that account in the event are archived together and the account disappears from the participant view.
5. **Given** an entry change fails, **When** the event reloads, **Then** categories and participant cards remain consistent with the last successful state.

### Edge Cases

- An account with entries in multiple categories appears once, with all of its event entry titles and one aggregate count.
- Duplicate entry titles remain separate entries and each contributes one to the displayed count.
- A participant account without a display name uses the established privacy-safe display-name fallback until account migration is complete.
- A participant account without an email displays a privacy-safe unavailable-email label rather than phone or another private identifier.
- Concurrent removal of the same entry produces one successful archive outcome and does not corrupt participant counts or audit history.
- Removing an entry never hard deletes it, deletes its owner account, or affects that account's entries in other events.
- Participant removal archives all of the account's active entries in that event as one complete operation; partial archival is not retained.
- Legacy event-participant relationships are migrated or ignored only after their entry ownership is reconciled, so active entries are not lost.

## Scope Boundaries *(mandatory)*

### In Scope

- Defining event participation solely from ownership of one or more entries in that event.
- Eliminating separate event-participant state from active product behavior.
- Keeping category entry lists, participant cards, and entry counts consistent after entry changes.
- A host-only Participants tab with one card per entry-owning account.
- Participant cards containing display name, email, entry titles, and right-aligned entry count.
- Reconciliation of existing participant and entry data into the entry-derived model.
- Archival history and audit records for every entry-level and participant-level removal.
- Clear loading, empty, and failure states for the participant-card view.

### Out of Scope

- Account deletion or removal from the application.
- Participant invitations, messaging, or verification.
- Displaying phone numbers, category names, entry metadata, or account controls on participant cards.
- Participant self-service profile or entry management.
- Voting, ballots, results, and winner calculation.
- Changing category creation or category presentation.
- Card sorting, filtering, search, pagination, or custom layout preferences.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: An account MUST be considered a participant in an event if and only if it owns at least one active entry in that event.
- **FR-002**: The system MUST NOT require or create a separate event-participant relationship to establish participation.
- **FR-003**: Creating an account's first entry in an event MUST automatically make that account visible as an event participant.
- **FR-004**: Archiving an account's final active entry from an event MUST automatically remove that account from the event's participant view without deleting the account or archived entry.
- **FR-005**: Entry creation or removal MUST keep category entry lists, participant membership, listed entry titles, and entry counts consistent as one completed outcome.
- **FR-006**: An entry change failure MUST leave all event views consistent with the last successful state.
- **FR-007**: The Participants tab MUST derive its membership and counts from active event entries.
- **FR-008**: The Participants tab MUST show each entry-owning account exactly once.
- **FR-009**: Each participant card MUST show the account display name as its title.
- **FR-010**: Each participant card MUST show the account email address as its subtitle when available.
- **FR-011**: Each participant card MUST list every active event entry owned by the account using only each entry's title.
- **FR-012**: Each participant card MUST show, on its right side, the total number of active entries the account owns in the event.
- **FR-013**: Duplicate entry titles MUST be listed and counted as distinct entries.
- **FR-014**: Participant cards MUST NOT display phone numbers, category names, or unrelated account details.
- **FR-015**: Only the event host MUST be able to access participant email addresses and participant-management actions.
- **FR-016**: An event with no entries MUST show a participant empty state rather than stale or legacy participants.
- **FR-017**: Entry changes MUST NOT delete owner accounts or change their entries or participation in other events.
- **FR-018**: Existing event, entry, account, and legacy participant data MUST be reconciled without losing valid entries, changing entry ownership, or exposing removed legacy relationships as current participants.
- **FR-019**: Participant and entry changes MUST produce auditable domain events without recording email addresses or other unnecessary personal data in operational logs.
- **FR-020**: The participant-card view MUST provide clear loading and safe failure states without showing stale counts as current.
- **FR-021**: Every entry removal MUST archive the entry with its ownership, event, category, removal time, and accountable actor retained for history and audit; hard deletion MUST NOT occur.
- **FR-022**: Removing one of multiple active entries owned by an account MUST archive only that entry and MUST leave the account visible with its remaining active entries.
- **FR-023**: Removing a participant MUST require explicit confirmation and MUST archive all active entries owned by that account in that event as one complete operation.
- **FR-024**: Participant removal MUST NOT archive or otherwise change the account's entries in another event.
- **FR-025**: Archived entries MUST be excluded from active category lists, participant cards, and active entry counts while remaining retained in persistent storage for database-level audit and historical investigation; no user-facing archive query is required.
- **FR-026**: Removal audit records MUST identify the action, event, affected entry identities, accountable actor, and time without exposing unnecessary participant contact details.

### Key Entities

- **Account**: A persistent user identity with a display name and email address. An account becomes an event participant only by owning active entries in that event.
- **Entry**: A titled voting choice owned by one account and assigned to one category in one event. Its active or archived state is retained; only active entries establish participation.
- **Event**: A host-owned voting event whose participants are the distinct account owners of its active entries.
- **Category**: An event grouping containing active entries; archival updates active contents and derived participation while retaining historical association.
- **Participant Card**: A host-facing projection of one entry-owning account, containing display name, email, event entry titles, and total event entry count.

### Ownership and Access

- The account owns its identity; removing event participation MUST NOT delete the account.
- The event host controls event entries and is the only user who may view participant email addresses in this feature.
- Participation is derived and has no independent owner or lifecycle.
- Entry ownership and event/category membership MUST be validated before any host-initiated entry change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of acceptance cases, the participant set exactly matches the distinct owners of active event entries.
- **SC-002**: In 100% of tested entry additions and removals, category lists, participant cards, entry titles, and counts agree after the operation.
- **SC-003**: A host can identify a participant's name, email, entry titles, and total entry count from one card within 10 seconds during usability testing.
- **SC-004**: At least 90% of first-time host testers correctly explain that participants are determined by entry ownership without assistance.
- **SC-005**: No tested removal operation hard deletes an entry, deletes an account, or changes entries belonging to another event.
- **SC-006**: The Participants tab becomes usable within two seconds for events containing up to 1,000 participants and 5,000 entries under normal operating conditions.
- **SC-007**: Private participant contact details are absent from unauthorized views and operational logs in 100% of tested access and failure paths.

### Critical User Flows *(mandatory)*

- **CUF-001**: A host adds an account's first event entry and sees that account automatically appear as one participant card.
- **CUF-002**: A host opens the Participants tab and verifies each card's display name, email, entry-title list, and count against category entries.
- **CUF-003**: A host archives one of several owned entries and sees the participant remain with the correct reduced list and count while history is retained.
- **CUF-004**: A host archives an account's final active entry and sees the category entry and derived participant disappear from active views without deleting the account or history.
- **CUF-005**: An unauthorized viewer attempts to access participant email details and is denied without private data exposure.
- **CUF-006**: A host confirms participant removal and all of that account's active entries in the event are archived together without affecting other events.

## Assumptions

- The event host remains the sole event administrator for this MVP.
- Existing entry ownership, category membership, account identity, and event ownership remain authoritative inputs.
- Participant cards use stable account display names and the account email already required by current host-managed entry creation.
- Participant cards use stable account order and stable entry order; custom sorting is deferred.
- A missing legacy email is shown as unavailable and does not expose a phone number as a substitute.
- Migration favors preserving valid entries and their owners; legacy participant relationships without entries do not remain visible as participants.
- Archived entries are retained indefinitely in persistent storage and never hard deleted; a future specification may define a different non-destructive retention policy, but active event views never include archives.
- Legacy removals without a verifiable human actor use the dedicated system migration actor so every archived entry retains accountable provenance.
- Development continues on `main` under the project's existing single-contributor workflow.
