# Feature Specification: Add Entries

**Feature Branch**: `main`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "Allow an event host or administrator to add an entry from a category, select its owner through contact typeahead or recent event participants, enter a title, and save the entry into that category."

## Clarifications

### Session 2026-07-19

- Q: May typeahead partially search accounts outside event? A: Yes. Authorized hosts and administrators may partially search global account directory by email or phone, with privacy safeguards and bounded results.
- Q: What happens when no account matches? A: Host or administrator may create provisional account using supplied contact details and display name, then use it as entry owner.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add an Entry to a Category (Priority: P1)

An event host or administrator starts from a category on their event, selects the account that owns the entry, provides an entry title, and saves it. The new entry appears in the selected category and its owner is automatically represented in the event participant list.

**Why this priority**: Entries are the voting objects within an event. Hosts cannot prepare an event for voting until they can add titled, owned entries to categories.

**Independent Test**: From an empty category, select an existing account, enter a valid title, save, and verify the entry appears in the original category and the selected account appears in the participant list.

**Acceptance Scenarios**:

1. **Given** an empty category and an authorized host, **When** the host selects Add entry, **Then** a focused step-by-step dialog opens with that category already selected.
2. **Given** the host has selected an account in the first step, **When** the host advances, enters an entry title, and saves, **Then** one entry is created in the originating category and owned by the selected account.
3. **Given** the selected account previously owned no active entry in the event, **When** the entry is saved, **Then** the account automatically appears in the event participant list without a separate registration action.
4. **Given** the selected account already owns event entries, **When** another entry is saved, **Then** the new entry is added without creating a duplicate participant.
5. **Given** entry creation fails, **When** the host sees the failure, **Then** the dialog retains their selections and title so they can retry safely without creating a duplicate entry.
6. **Given** no existing account matches a complete valid contact, **When** the host supplies a display name and confirms provisional-account creation, **Then** that account is selected as owner and the host can finish adding the entry.

---

### User Story 2 - Quickly Reuse a Recent Participant (Priority: P2)

When opening the entry dialog, a host sees people already associated with the event below the search field, ordered with the most recently added entry owner first. This makes repeated entry creation for the same people quick.

**Why this priority**: Hosts commonly add several entries consecutively. Recent-participant shortcuts reduce repeated searching and data-entry time.

**Independent Test**: Create entries for multiple accounts at known times, open Add entry, and verify distinct participants appear in descending order of their most recently added active entry and can be selected directly.

**Acceptance Scenarios**:

1. **Given** the event has active entries owned by multiple accounts, **When** the host opens Add entry, **Then** the first step lists each participant once below the search field.
2. **Given** one participant received the event's most recently added entry, **When** the participant choices load, **Then** that participant appears first.
3. **Given** a participant owns multiple event entries, **When** choices load, **Then** the participant appears once and is ordered by their most recently added active entry.
4. **Given** the host selects a recent participant, **When** the selection is accepted, **Then** the host can proceed without performing a search.
5. **Given** a participant choice is displayed, **Then** it shows the participant's display name, email, and phone when each value is available, with unavailable values clearly omitted or labeled.

---

### User Story 3 - Find an Account by Contact Information (Priority: P3)

A host can type an email address or phone number and see matching account choices update as they type, then select the correct account as the entry owner.

**Why this priority**: Search supports entry owners who are not already associated with the event while reducing identity mistakes.

**Independent Test**: Enter a known email or phone value progressively, select the intended account from the returned choices, and verify the selected account becomes the saved entry owner without exposing results to an unauthorized user.

**Acceptance Scenarios**:

1. **Given** an authorized host is in the owner-selection step, **When** the host enters a supported portion of an email address or phone number, **Then** matching choices appear without a full-page refresh.
2. **Given** the host changes the search text rapidly, **When** results return out of order, **Then** only choices matching the current text are presented.
3. **Given** no eligible account matches, **When** search completes, **Then** the dialog presents a clear no-results state and does not select an unrelated account.
4. **Given** an unauthorized person attempts account lookup, **When** access is evaluated, **Then** no account names, email addresses, or phone numbers are disclosed.
5. **Given** multiple accounts could match, **When** results appear, **Then** each result provides enough permitted identity information for the host to choose deliberately.

### Edge Cases

- The category is archived, unavailable, or changed after the dialog opens; saving is blocked with a clear message and no entry is created.
- The selected account becomes unavailable before save; the host is informed and no ownerless entry is created.
- The host loses event-management permission while the dialog is open; save and subsequent lookup are denied.
- The title is blank, whitespace-only, or exceeds the established entry-title limit; the title step identifies the problem and preserves the owner selection.
- Two hosts or administrators submit the same operation more than once; one intended entry is created rather than duplicates caused by retry.
- Recent participants with archived entries only are excluded because they are no longer active participants in the event.
- A participant without a phone or email still has a usable, privacy-safe identity presentation based on available account information.
- Search input contains mixed phone formatting, capitalization, leading/trailing spaces, or incomplete contact text; matching treats equivalent contact forms consistently.
- The dialog is dismissed before save; no entry is created and reopening begins a fresh flow for the category selected at that time.
- The event has many participants; the initial recent list remains bounded and responsive, while search can locate participants outside that initial list.

## Scope Boundaries *(mandatory)*

### In Scope

- Host- and administrator-only entry creation from an event category.
- A prominent Add entry prompt for an empty category and an available Add entry action for a populated category.
- A two-step focused dialog: select the entry owner, then enter and confirm the entry title.
- Preselection and preservation of the category from which the flow was opened.
- Contact-based account typeahead with explicit account selection.
- Provisional-account creation from a complete valid contact and required display name when no account matches.
- A bounded recent-participant list ordered by each participant's latest active entry creation time, newest first.
- Participant choices displaying available display name, email, and phone information to authorized event managers.
- Creation of an entry owned by the selected account and assigned to the selected category.
- Automatic participant-list inclusion derived from the new entry's ownership.
- Loading, no-results, validation, success, cancellation, retry, and access-denied states.
- Auditable entry-creation activity without unnecessary contact data in operational records.

### Out of Scope

- Participant self-service entry creation or editing.
- Voting, ballots, results, judging, or winner calculation.
- Editing or archiving an existing entry within this flow.
- Moving an entry between categories.
- Bulk import or bulk entry creation.
- Creating categories from the entry dialog.
- Invitations, verification messages, or other participant communications.
- A user-facing audit-history screen.
- Custom sorting or filtering of recent participants.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Only the event host or an authorized event administrator MUST be able to open or complete the Add entry flow.
- **FR-002**: Every category visible to an authorized event manager MUST provide an Add entry action; an empty category MUST present this action as its primary empty-state prompt.
- **FR-003**: Selecting Add entry MUST open a focused, dismissible, step-by-step dialog without navigating away from the event.
- **FR-004**: The dialog MUST retain the originating event and category as fixed context throughout the flow.
- **FR-005**: The first step MUST ask "Who is this entry for?" and require explicit selection of one account before continuing.
- **FR-006**: The first step MUST provide one search field that accepts email or phone input and updates matching account choices as the host types.
- **FR-007**: Authorized hosts and administrators MUST be able to partially search the global account directory by normalized email or phone input after entering at least three searchable characters.
- **FR-007a**: Global lookup MUST return no more than ten choices per search and MUST expose results only within the authorized event-management session.
- **FR-008**: The system MUST discard or ignore stale lookup results when the host's current search text has changed.
- **FR-009**: Lookup MUST provide clear loading, no-results, failure, and retry states without clearing valid host input.
- **FR-010**: Below the search field, the first step MUST list a bounded set of distinct participants who currently own active entries in the event.
- **FR-011**: Recent participants MUST be ordered by the creation time of each participant's most recently added active event entry, newest first.
- **FR-012**: A participant with multiple entries MUST appear only once in the recent list.
- **FR-013**: Each recent-participant and search-result choice MUST show the account display name and any permitted email and phone values that are available.
- **FR-014**: Selecting a recent participant or search result MUST identify that account as the prospective entry owner and enable progression to the title step.
- **FR-015**: When no account matches a complete valid email or phone, the flow MUST allow the host to create a provisional account using that contact and a required display name.
- **FR-015a**: Provisional-account creation MUST require at least one complete valid email or phone value, MUST reuse an existing matching account found during final validation, and MUST NOT create duplicate identities for equivalent normalized contact values.
- **FR-015b**: A newly created provisional account MUST be selected as prospective entry owner but MUST NOT become an event participant until its entry is saved successfully.
- **FR-016**: The title step MUST require a nonblank entry title that conforms to the established entry-title rules.
- **FR-017**: The dialog MUST clearly identify the selected participant and category before final save.
- **FR-018**: Saving MUST create exactly one active entry assigned to the originating event and category and owned by the selected account.
- **FR-019**: Entry creation MUST NOT create or require a separate event-participant record; the owner MUST appear as a participant by virtue of owning the active entry.
- **FR-020**: Adding another entry for an existing participant MUST retain one participant representation while increasing that participant's active entry list and count.
- **FR-021**: Successful save MUST close the dialog and refresh the affected category so the new entry is visible without a manual page reload.
- **FR-022**: Failed save MUST leave the dialog open, preserve the selected owner and title, explain the failure safely, and allow retry.
- **FR-023**: Retrying the same intended save MUST NOT create duplicate entries because of network or response uncertainty.
- **FR-024**: If event, category, account, or permission state changes before save, the system MUST revalidate all four and reject an invalid creation without an ownerless or miscategorized entry.
- **FR-025**: Unauthorized account lookup or entry creation MUST reveal no private account details and MUST produce a safe access-denied outcome.
- **FR-026**: Account search and recent-participant data MUST be limited to the minimum identity details required for an authorized host to select the correct owner.
- **FR-027**: Entry creation MUST produce an auditable domain event identifying the event, category, entry, owner account, actor, and time without copying email addresses or phone numbers into operational logs.
- **FR-028**: The complete flow MUST be keyboard operable, maintain logical focus between steps, return focus to the initiating category action when dismissed, and provide accessible names and error associations.
- **FR-029**: The flow MUST remain usable on current mobile and desktop browsers without obscuring required actions or identity information.

### Key Entities

- **Event**: A host-controlled voting event containing categories and entries; its active entry owners form its participant list.
- **Category**: The fixed event grouping selected before the flow opens and receiving the new entry.
- **Entry**: A titled, active voting object assigned to one event category and owned by exactly one account.
- **Account**: The persistent identity selected as entry owner, represented to authorized event managers by display name and available permitted contact details.
- **Provisional Account**: An incomplete account created by an authorized event manager from a required display name and at least one valid contact value when no matching account exists; it follows established account-completion lifecycle.
- **Recent Participant Choice**: An event-specific projection of a distinct active entry owner, including identity display fields and the time of that owner's most recently created active event entry for ordering.
- **Entry Creation Attempt**: The host's intended event, category, owner, title, and retry identity used to ensure one completed outcome.

### Ownership and Access

- The event host owns event setup and may create entries in the event's categories.
- An event administrator with equivalent setup permission may perform the same Add entry actions; no other persona may use this feature.
- The selected account owns the resulting entry, while the host or administrator remains the accountable actor who created it.
- Only authorized event managers may view contact details returned for owner selection.
- The selected account does not need to be an existing event participant; participation is derived automatically after its first active event entry is created.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of first-time host testers can add a correctly titled entry to the intended category and owner without assistance.
- **SC-002**: A host can add an entry for a visible recent participant in under 30 seconds, measured from selecting Add entry through seeing the entry in its category.
- **SC-003**: A host can locate and select an eligible account by email or phone in under 15 seconds under normal operating conditions.
- **SC-004**: Matching participant choices become usable within one second of the host pausing contact input for events and account directories within supported operating limits.
- **SC-005**: In 100% of acceptance tests, a successful save produces exactly one entry in the originally selected category with the selected account as owner.
- **SC-006**: In 100% of acceptance tests, adding an account's first event entry makes it appear once in participants, and adding later entries never duplicates the participant.
- **SC-007**: In 100% of tested unauthorized and failure paths, private account contact details are not disclosed and no partial or ownerless entry remains.
- **SC-008**: At least 90% of host testers correctly identify why the most recently used participant appears first without instruction.
- **SC-009**: The dialog remains fully operable with keyboard-only input and at mobile viewport sizes in all critical-flow acceptance tests.

### Critical User Flows *(mandatory)*

- **CUF-001**: An authorized host opens Add entry from an empty category, selects a recent participant, enters a title, saves, and sees the entry in that category.
- **CUF-002**: An authorized host searches by contact information, selects the intended account, saves an entry, and sees that owner appear once in the participant list.
- **CUF-003**: A host adds multiple entries consecutively and sees the last-used participant move to the top of the recent list for quick reselection.
- **CUF-004**: A save attempt fails and the host retries successfully without losing input or creating duplicate entries.
- **CUF-005**: An unauthorized user attempts participant lookup and entry creation and receives no private identity data or state change.

## Assumptions

- The existing event, category, account, entry, authentication, and entry-derived participant concepts remain authoritative.
- "Event administrator" means an account granted event-setup permission by the product's authorization model; current MVP grants that permission only to event owner, and administrator assignment/revocation is outside this feature.
- Display name is the current account name presented as first and last name when available; this feature does not introduce a separate legal-name model.
- "Most recently used" means the owner whose newest active entry in this event has the latest creation timestamp.
- Archived entries do not establish participation and do not influence recent-participant ordering.
- The recent-participant list is intentionally bounded; planning will set an appropriate limit that keeps the dialog responsive.
- Email and phone values are normalized for equivalent matching, while the displayed values follow established privacy-safe formatting.
- Global typeahead begins after three searchable characters and returns at most ten choices, balancing usable discovery with bounded contact exposure.
- Provisional accounts reuse established incomplete-account behavior; verification and account completion remain outside this feature.
- The originating category cannot be changed inside the dialog; the host cancels and starts from another category to change it.
- The modal closes on successful save and returns focus to the Add entry action that opened it.
- Development continues on `main` under the project's established single-contributor workflow.
