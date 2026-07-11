# Feature Specification: Event Categories and Entries

**Feature Branch**: `main`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Add host-managed event setup with categories, participant-owned entries, category-grouped event details, and a secondary participant tab."

## Clarifications

### Session 2026-07-11

- Q: Does "admin" introduce a new role? → A: No. The event host/owner is the sole event administrator for this MVP.
- Q: How are existing participants migrated to mandatory entries? → A: Generate one default-category entry per participant using privacy-safe stable titles: "Entry 1," "Entry 2," and so on.
- Q: How does OPEN-event self-registration satisfy mandatory entry details? → A: Every registration flow collects entry details and starts with one entry row preselected to the default category.
- Q: What owner identity appears with voter-facing entries? → A: Every account has a required display name; existing accounts derive it from the email prefix before `@`.
- Q: Which historical registrations are migrated? → A: Migrate all active and removed registrations while preserving their status.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register Participants with Entries (Priority: P1)

An event host registers a participant using a required email and optional phone, supplies a title for the participant's first entry, confirms or changes the preselected default category, and may add more titled entries in any event category. The participant and all entries are saved together so the event immediately represents what voters will later choose among.

**Why this priority**: Entries are the core voting objects. An event cannot be meaningfully configured for later voting until every registered participant has at least one categorized, titled entry.

**Independent Test**: Create an event, register one participant with three titled entries across two categories, and verify the participant owns all three entries and each entry belongs to its selected category.

**Acceptance Scenarios**:

1. **Given** a new event with its default category, **When** the host registers a participant and supplies one entry title without changing the category, **Then** the participant is registered and one entry is created in the default category.
2. **Given** an event with multiple categories, **When** the host registers a participant and changes the first entry's category, **Then** the first entry is created in the selected category rather than the default category.
3. **Given** an event with multiple categories, **When** the host adds multiple titled entries during participant registration, **Then** every entry is saved under the chosen category and owned by the registered participant.
4. **Given** a participant form with no email, blank entry title, or missing category selection, **When** the host submits it, **Then** nothing is created and each invalid field identifies its problem.
5. **Given** an OPEN event, **When** a verified participant self-registers, **Then** the form starts with one entry row preselected to the default category and registration cannot complete until every entry has a title and category.
6. **Given** a host registering a participant, **When** the host supplies participant details, **Then** display name and email are required and phone remains optional.

---

### User Story 2 - Configure Event Categories (Priority: P2)

An event host views the event setup, starts with one automatically created category, renames that category, and adds additional categories with required titles. A single-category event needs no extra setup, while larger events can organize entries into meaningful groups.

**Why this priority**: Categories provide the structure required to organize entries, but the default category allows the P1 registration flow to work before custom category management is added.

**Independent Test**: Create an event named "Peyton's event," verify its default category is "Peyton's event participants," rename it, add a second category, and verify both category titles appear in event setup.

**Acceptance Scenarios**:

1. **Given** an event named "Peyton's event," **When** creation completes, **Then** it has exactly one default category titled "Peyton's event participants."
2. **Given** an event with its default category, **When** the host edits its title, **Then** the updated title appears everywhere that category is shown.
3. **Given** an event, **When** the host adds a category with a nonblank title, **Then** the new category becomes available for entry assignment.
4. **Given** an anonymous visitor, participant, or other signed-in account, **When** they attempt to change categories or entries, **Then** the system denies the change.
5. **Given** any signed-in account other than the event host, **When** it attempts event setup changes, **Then** the system denies the change because this MVP treats the event host/owner as its only administrator.

---

### User Story 3 - Browse Categories and Entries (Priority: P3)

A person viewing an event sees categories as the primary content and the entries grouped beneath each category. Each entry displays its title and participant owner, making the event's voting choices understandable without emphasizing participant administration.

**Why this priority**: The event page must communicate the configured voting choices clearly, but this read experience depends on categories and entries already existing.

**Independent Test**: Open an event containing multiple categories and entries and verify every category is visible, every entry appears under exactly one category, and each entry shows its title and owner.

**Acceptance Scenarios**:

1. **Given** an event with entries across multiple categories, **When** a viewer opens event details, **Then** categories and their entries are the primary page content.
2. **Given** an entry, **When** it appears in a category list, **Then** its title and participant owner are shown.
3. **Given** a category with no entries, **When** the event page loads, **Then** the category remains visible with a clear empty state.

---

### User Story 4 - Review Participants Separately (Priority: P4)

An event host opens a Participants tab from event details to review registered participants separately from the category-and-entry setup. Each participant row shows the participant identity and total entry count.

**Why this priority**: Participant administration remains necessary but is secondary to configuring the event's actual entries.

**Independent Test**: Open the Participants tab for an event with participants owning different numbers of entries and verify each participant appears once with the correct count.

**Acceptance Scenarios**:

1. **Given** a host viewing event details, **When** they open the Participants tab, **Then** they see all event participants and each participant's entry count.
2. **Given** a participant with entries in multiple categories, **When** the participant list loads, **Then** the count includes all entries across the event.
3. **Given** a viewer who cannot administer the event, **When** they view event details, **Then** private participant-management controls are unavailable.

### Edge Cases

- Category titles containing only whitespace are rejected; leading and trailing whitespace is ignored.
- Duplicate category titles within one event are rejected to keep category selection unambiguous.
- Entry titles containing only whitespace are rejected; leading and trailing whitespace is ignored.
- A participant may own multiple entries with the same title only when the host intentionally creates them; each remains a distinct entry.
- A category with no entries remains visible to the host so it can be used during setup.
- If participant registration or any requested entry creation fails, the participant and all entries from that submission remain unchanged; partial setup is not retained.
- Concurrent attempts to register the same participant or repeat the same submission do not create duplicate participants or entries.
- Existing events receive a default category, and each existing participant automatically receives one entry in that category with a privacy-safe title using stable event order: "Entry 1," "Entry 2," and so on.

## Scope Boundaries *(mandatory)*

### In Scope

- Automatic creation of one default category for every newly created event.
- Host-authorized category creation and category title editing.
- Required first entry and optional additional entries during participant registration.
- Required category and title for every entry.
- Participant ownership of multiple entries across categories.
- Category-grouped entry display on event details.
- A separate Participants tab showing participants and aggregate entry counts.
- Clear loading, empty, validation, success, and failure states for setup flows.
- Auditable events for category and entry creation or modification.

### Out of Scope

- Voting, ballots, winner calculation, and results.
- Category deletion, reordering, or merging.
- Entry editing, deletion, transfer, or reordering after participant registration.
- Post-registration participant self-service category or entry editing; initial OPEN-event self-registration entry collection is in scope.
- Bulk import of categories, participants, or entries.
- Invitations, notifications, and verification messages.
- Cross-event category templates or reusable entry catalogs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every newly created event MUST start with exactly one default category.
- **FR-002**: The default category title MUST combine the event title with the word "participants" using the pattern "{Event title} participants."
- **FR-003**: An authorized event setup editor MUST be able to rename any event category.
- **FR-004**: An authorized event setup editor MUST be able to add categories with required, nonblank titles.
- **FR-005**: Category titles MUST be unique within an event after whitespace normalization and case-insensitive comparison.
- **FR-006**: Only the event host/owner, acting as the event's sole administrator in this MVP, MUST be allowed to create or rename categories and create entries.
- **FR-007**: Host-managed participant registration MUST require display name and email address and MAY include a phone number.
- **FR-008**: Participant registration MUST create at least one entry owned by the registered participant.
- **FR-009**: The first entry category MUST default to the event's default category and MUST remain changeable before submission.
- **FR-010**: The registering host MUST be able to add multiple entries before submitting participant registration.
- **FR-011**: Every entry MUST have exactly one nonblank title, one category in the same event, and one participant owner registered for that event.
- **FR-012**: One participant MUST be allowed to own multiple entries in one or multiple event categories.
- **FR-013**: Participant registration and its requested entries MUST succeed or fail as one operation without partial records.
- **FR-014**: Repeated or concurrent participant-entry submissions MUST NOT create unintended duplicate entries.
- **FR-015**: Event details MUST present categories and their entries as the primary content.
- **FR-016**: Each displayed entry MUST show its title and participant owner.
- **FR-017**: Every event category MUST remain visible in event setup even when it has no entries.
- **FR-018**: Event details MUST provide a distinct Participants tab for authorized event administrators.
- **FR-019**: The Participants tab MUST list each registered participant once with their total number of entries across the event.
- **FR-020**: Validation failures MUST identify each affected field and preserve the host's unsaved input.
- **FR-021**: Category and entry changes MUST produce auditable domain events without exposing participant contact details in logs.
- **FR-022**: Existing events MUST receive one default category, and each existing participant MUST receive exactly one entry assigned to it with a privacy-safe title following stable event order: "Entry 1," "Entry 2," and so on.
- **FR-023**: Every account MUST have a nonblank display name; normal account creation and host-created participant accounts MUST collect it.
- **FR-024**: Existing accounts with email MUST receive a display name derived by removing `@` and everything after it from the stored email string; legacy phone-only accounts MUST receive a privacy-safe stable fallback such as "Participant 1."
- **FR-025**: OPEN-event self-registration MUST collect one or more titled entries and MUST prepopulate the first entry's category with the event's default category.
- **FR-026**: Migration MUST update active and removed registrations, preserve their status, and keep removed registrations excluded from active event and participant views.

### Key Entities

- **Category**: An event-owned grouping with an immutable identity, title, default-category designation, creation time, and last-updated time. Each category belongs to exactly one event.
- **Entry**: A titled voting choice owned by one registered participant and assigned to exactly one category in the same event. Each entry belongs to exactly one event through its category and participant registration.
- **Event**: A host-owned voting event containing one or more categories, participant registrations, and participant-owned entries.
- **Event Registration**: The relationship between an event and participant account; after migration every active or removed registration retains one or more participant-owned entries while status controls active visibility.
- **Account**: The identity that hosts an event or owns entries through an event registration; every account has a required display name used for voter-facing ownership labels.

### Ownership and Access

- The event owns its categories and entries; the event host controls event setup.
- A participant account owns the meaning of its entries, but cannot modify event setup in this feature.
- Category and entry creation or updates MUST verify event-level authority at the server boundary.
- Event-category and entry visibility follows the event's existing detail visibility, while participant management remains restricted to authorized event administrators.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A host can create an event and see its correctly named default category without additional setup in 100% of successful event creations.
- **SC-002**: A host can register a participant with three entries across two categories in under three minutes during usability testing.
- **SC-003**: In automated acceptance testing, 100% of entries display under the selected category with the correct title and owner.
- **SC-004**: Unauthorized setup-change attempts are denied in 100% of tested permission paths.
- **SC-005**: Participant registration failures produce no partial participant or entry records in 100% of tested failure paths.
- **SC-006**: The Participants tab reports the correct event-wide entry count for every participant in acceptance fixtures.
- **SC-007**: At least 90% of first-time test users can identify where to manage categories, entries, and participants without assistance.
- **SC-008**: Event setup and category-grouped detail views become usable within two seconds for events containing up to 100 categories, 1,000 participants, and 5,000 entries under normal operating conditions.

### Critical User Flows *(mandatory)*

- **CUF-001**: A host creates an event, confirms the default category, registers a participant with one default-category entry, and sees that entry grouped under the category.
- **CUF-002**: A host adds and renames categories, then registers one participant with multiple entries assigned across them.
- **CUF-003**: A host opens the Participants tab and verifies each participant's total entry count.
- **CUF-004**: An unauthorized account attempts event setup changes and receives a safe denial without any persisted change.

## Assumptions

- The existing account, session, event ownership, event registration, and public event-detail foundations remain in use.
- "Default category" is an immutable designation even if its display title changes.
- Category and entry deletion, post-registration entry editing, and ordering are deferred rather than inferred.
- Category and entry lists use stable creation order for this feature because custom ordering is out of scope.
- Entry titles need only be unique per entry; duplicate titles are permitted because distinct participants or submissions may legitimately use the same voter-facing title.
- Event title changes after creation do not automatically rename an edited or existing default category.
- Participant contact information remains private on public event details; entry ownership uses the account's required display name.
- The event host/owner is the only event administrator in this MVP; delegated and global administrator roles are deferred.
- Migration-generated entry titles use stable event order and never contain participant email addresses or phone numbers.
- Development remains on `main` because the project has one contributor; each implementation task is committed and pushed only after its task-specific tests pass.
