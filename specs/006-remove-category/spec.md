# Feature Specification: Remove Category

**Feature Branch**: `main`

**Created**: 2026-07-19

**Status**: Ready for planning

**Input**: User description: "Allow a host to remove an event category from category edit mode, require confirmation that all category entries will be removed, preserve at least one category, and soft delete the category and its entries permanently for audit purposes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove an Unneeded Category (Priority: P1)

An event host opens edit mode for a category and chooses Remove category. Before anything changes, the host sees a clear confirmation explaining that the category and every entry inside it will be removed from active event views. After confirmation, the category and its entries disappear together while their historical records remain available for operational audit.

**Why this priority**: Hosts need to correct event setup without leaving obsolete categories or voting entries visible. The warning and archival behavior protect against accidental loss and preserve accountability.

**Independent Test**: Create an event with two categories, add multiple entries to one category, remove that category and confirm, then verify the category and entries disappear from event and participant views while archived records remain available in the audit data.

**Acceptance Scenarios**:

1. **Given** a host edits one of two or more active categories, **When** the edit view opens, **Then** a Remove category action is available.
2. **Given** a host selects Remove category, **When** confirmation appears, **Then** it states that the category and all entries in it will be removed.
3. **Given** the confirmation is open, **When** the host cancels, **Then** the category and all entries remain unchanged.
4. **Given** the host confirms removal, **When** the operation succeeds, **Then** the category and all entries assigned to it disappear together from every active event, category, and participant view.
5. **Given** a category and its entries were removed, **When** operational history is inspected, **Then** their identities, ownership, timestamps, removal actor, removal time, and removal reason remain available.
6. **Given** a removed category, **When** any user later views or edits the event, **Then** that archived category cannot be restored or selected for new entries.

---

### User Story 2 - Protect the Event's Final Category (Priority: P2)

An event must always retain at least one active category. A host viewing the only remaining category cannot remove it and receives a clear explanation rather than discovering the rule after destructive confirmation.

**Why this priority**: Entries require categories. Preventing a category-less event preserves event integrity and keeps future entry creation usable.

**Independent Test**: Open edit mode on an event with exactly one active category and verify removal is unavailable or disabled with an explanation; also issue a direct removal attempt and verify no records change.

**Acceptance Scenarios**:

1. **Given** an event has exactly one active category, **When** the host edits it, **Then** the category cannot be removed and the interface explains that every event needs one category.
2. **Given** an event has exactly one active category, **When** a removal is attempted outside the normal interface, **Then** the request is rejected and the category and entries remain active.
3. **Given** two category removals are attempted close together, **When** accepting both would remove the final category, **Then** only a safe removal may succeed and at least one active category remains.

### Edge Cases

- A category with no entries still requires confirmation before removal.
- Entries already archived before category removal remain archived and retain their earlier removal history.
- A category or entry added, edited, moved, or archived after the confirmation view opened causes safe rejection rather than partial removal.
- Retrying the same confirmed removal after an uncertain response returns the completed result without creating duplicate archival history.
- An anonymous user, participant, or non-host cannot remove a category or learn private setup details through failure responses.
- A removed category never appears in Add Entry category choices, public event setup, hosted event setup, participant cards, counts, or voting choices.
- If the removed category is the default, the oldest remaining active category automatically becomes the new default.
- A host may reuse an archived category's title, but doing so creates a new category with a new identity and does not restore the archived category or entries.

## Scope Boundaries *(mandatory)*

### In Scope

- Host-only category removal from existing category edit mode.
- A destructive confirmation naming the impact on every entry in the category.
- Enforcement that every event always retains at least one active category.
- One completed operation that archives the category and all active entries assigned to it.
- Removal metadata and auditable history without hard deletion.
- Immediate refresh of event, category, entry, and participant projections.
- Safe retry, concurrent-change protection, accessible interaction, and clear success/failure states.

### Out of Scope

- Restoring or unarchiving a removed category or its entries.
- Moving entries to another category during removal.
- Removing an entire event.
- Allowing participants or voters to manage categories.
- A user-facing audit-history screen.
- Automatically deleting participant accounts whose entries are removed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Only the event host MUST be allowed to remove a category from that event.
- **FR-002**: Category edit mode MUST show a Remove category action when removal is permitted.
- **FR-003**: The system MUST prevent removal when the event has only one active category.
- **FR-004**: Final-category protection MUST be enforced when the removal is committed, not only when the edit view is rendered.
- **FR-005**: Selecting Remove category MUST present a confirmation before any record changes.
- **FR-006**: The confirmation MUST state that every entry in the category will also be removed.
- **FR-007**: Cancelling confirmation MUST leave the category and entries unchanged.
- **FR-008**: Confirmed removal MUST archive the category and all of its active entries as one completed outcome.
- **FR-009**: A failed or rejected removal MUST archive neither the category nor any entry.
- **FR-010**: Archived categories and entries MUST remain stored and MUST NOT be hard deleted.
- **FR-011**: Archived category history MUST identify the event, category, accountable host, removal time, and removal reason.
- **FR-012**: Each entry archived through category removal MUST retain its identity, owner, event, category, creation history, and category-removal reason.
- **FR-013**: Successfully removed categories and entries MUST disappear from all active event, entry, participant, category-selection, and voting projections without manual reload.
- **FR-014**: A removed category MUST NOT be restorable or reusable as the same category identity.
- **FR-015**: New entries MUST NOT be assignable to an archived category.
- **FR-016**: The system MUST safely reject removal if relevant category membership or event setup changed after the host began removal.
- **FR-017**: Concurrent removal attempts MUST never leave an event with zero active categories.
- **FR-018**: Retrying the same confirmed removal MUST NOT repeat archival changes or duplicate audit history.
- **FR-019**: Duplicate removal attempts using changed intent MUST be rejected safely.
- **FR-020**: Unauthorized or invalid attempts MUST reveal no private entry or participant information.
- **FR-021**: Category and entry archival MUST create auditable events containing identifiers and accountable actor without copying category titles, entry titles, email, or phone into operational logs.
- **FR-022**: The removal control and confirmation MUST support keyboard-only use, clear focus, announced warnings/errors, and mobile and desktop layouts.
- **FR-023**: Existing category creation, category/entry title editing, Add Entry, individual entry removal, participant projection, and public event viewing MUST remain compatible.
- **FR-024**: If the removed category is the default, the oldest remaining active category MUST become the new default in the same completed removal outcome.
- **FR-025**: A host MAY create a new category with the same title as an archived category, but the new category MUST receive a distinct identity and MUST NOT restore or inherit archived entries or history.

### Key Entities

- **Event**: Host-owned voting event that must always retain at least one active category.
- **Category**: Event-owned entry grouping with active or archived lifecycle, default designation, creation history, and removal metadata.
- **Entry**: Participant-owned voting choice assigned to a category; category removal archives active entries without changing identity or ownership history.
- **Category Removal Intent**: One confirmed host action identifying the event, category, known setup state, and retry identity.
- **Category Removal Audit**: Historical record of the category and entry archival outcome, accountable host, time, reason, and affected counts without sensitive titles or contact data.

### Ownership and Access

- The event host is the only current persona authorized to remove event categories.
- Entry owners do not gain category-management permission through ownership of entries.
- Authorization, event ownership, category membership, active-category count, and entry relationships MUST be revalidated when removal commits.
- Archived records remain operationally available for audit but are not exposed through normal user-facing event flows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of first-time host testers can remove a non-final category and understand that its entries will also be removed without assistance.
- **SC-002**: A host can complete a confirmed category removal and see the refreshed event in under 30 seconds.
- **SC-003**: In 100% of acceptance tests, an event retains at least one active category after successful, failed, retried, and concurrent removal attempts.
- **SC-004**: In 100% of successful removals, the category and every formerly active entry in it disappear from all active views within two seconds under normal conditions.
- **SC-005**: In 100% of failed or cancelled removal tests, no category or entry archival state changes.
- **SC-006**: In 100% of audit verification tests, removed category and entry identities, ownership, actor, time, and reason remain available with no hard deletion.
- **SC-007**: Unauthorized removal attempts make zero data changes and disclose no private setup information.
- **SC-008**: Existing category, entry, participant, and public-event critical flows remain successful after release.

### Critical User Flows *(mandatory)*

- **CUF-001**: Host edits a non-final populated category, reviews the destructive warning, confirms removal, and sees the category and entries disappear.
- **CUF-002**: Host opens removal confirmation and cancels with no changes.
- **CUF-003**: Host edits the event's only active category and cannot remove it.
- **CUF-004**: Concurrent category-removal attempts preserve at least one active category and create no partial archival state.
- **CUF-005**: Unauthorized user attempts category removal and changes nothing.

## Assumptions

- Existing category edit mode remains the entry point for removal.
- "Remove" means permanent archival from active product behavior, never hard deletion.
- Active entries in a removed category are archived with a category-removal reason; already archived entries are not rewritten.
- Participant association remains derived from active entries. A person with no remaining active entries in the event automatically disappears from its participant view, while their account remains unchanged.
- Removed category and entry records are available for operational/database audit only; no user-facing history screen is included.
- The host sees an affected-entry count in confirmation when it is safely available, but the warning remains valid without relying on that count.
- "Oldest remaining" is determined by the original category creation time, with stable identity used to resolve an exact timestamp tie.
