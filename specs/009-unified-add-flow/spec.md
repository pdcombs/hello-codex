# Feature Specification: Unified Add Flow

**Feature Branch**: `main`

**Created**: 2026-07-25

**Status**: Draft

**Input**: Replace separate category, entry, and participant creation controls with one event-level Add
button and guided bottom-sheet flow.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose What to Add (Priority: P1)

As an event host, I can start all event-setup creation from one obvious Add button beside Settings so I
do not need to search different page sections for creation controls.

**Why this priority**: One entry point establishes the simplified setup model and unlocks both supported
creation flows.

**Independent Test**: Open a hosted event, activate Add, and verify an accessible bottom sheet offers
Category and Entry choices and can be dismissed without changing event data.

**Acceptance Scenarios**:

1. **Given** a host is viewing an event, **When** the event summary loads, **Then** one primary Add button
   appears beside the Settings control.
2. **Given** the host activates Add, **When** the bottom sheet opens, **Then** it asks what they are trying
   to add and offers Category and Entry.
3. **Given** the bottom sheet is open, **When** the host dismisses it using Close, Escape, or the backdrop,
   **Then** focus returns to Add and no event data changes.
4. **Given** a non-host or anonymous viewer opens an event, **When** the summary loads, **Then** no Add
   control or creation flow is available.

---

### User Story 2 - Add a Category (Priority: P1)

As an event host, I can select Category from the shared Add flow and create a category without returning
to a separate control at the bottom of the page.

**Why this priority**: Category creation is one of the two required actions consolidated by this feature.

**Independent Test**: Start Add, select Category, enter a valid title, save, and verify the new category
appears using existing category rules.

**Acceptance Scenarios**:

1. **Given** the Add bottom sheet is open, **When** the host selects Category, **Then** the sheet advances
   to category creation and requests a category title.
2. **Given** a valid unique category title, **When** the host saves, **Then** the category is created,
   the sheet closes, and the refreshed category list includes it.
3. **Given** an invalid or duplicate category title, **When** the host saves, **Then** the sheet remains
   open and identifies the field error without losing the entered value.
4. **Given** category creation succeeds, **When** the host reviews the event page, **Then** no separate
   Add Category control remains.

---

### User Story 3 - Add an Entry (Priority: P1)

As an event host, I can select Entry from the shared Add flow, choose its category, choose or create its
owner, and save the entry.

**Why this priority**: Entries are the primary event content and are now the only path that introduces a
new participant relationship.

**Independent Test**: Start Add, select Entry, accept or change the category, choose an existing or new
account, enter a title, save, and verify both category and participant views refresh.

**Acceptance Scenarios**:

1. **Given** the event has a default category, **When** the host selects Entry, **Then** category selection
   is required and initially selects the default category.
2. **Given** multiple active categories, **When** the host changes the selection, **Then** the entry is
   created only in the selected category.
3. **Given** the host selects an existing account, **When** they enter a valid entry title and save,
   **Then** the entry appears under the selected category and its owner appears in Participants.
4. **Given** no suitable account exists, **When** the host creates a new account through the entry flow
   and saves a valid entry, **Then** the new account owns the entry and becomes an entry-derived
   participant.
5. **Given** required category, owner, or title data is missing or invalid, **When** Save is attempted,
   **Then** the sheet identifies each affected field and preserves valid input.
6. **Given** entry creation succeeds, **When** the host reviews category cards, **Then** no separate
   Add Entry control remains.

---

### User Story 4 - Remove Direct Participant Creation (Priority: P2)

As an event host, I see Participants as a derived view of entry owners instead of a separate participant
registration workflow.

**Why this priority**: Removing the old path prevents participant records without entries and reinforces
the established entry-derived participant model.

**Independent Test**: Open Participants and verify participant cards remain available while every direct
participant-creation control is absent.

**Acceptance Scenarios**:

1. **Given** the host opens Participants, **When** the view loads, **Then** existing participant cards and
   entry counts remain unchanged.
2. **Given** the Participants view has no participants, **When** its empty state renders, **Then** it
   directs the host to use Add Entry rather than offering Add Participant.
3. **Given** existing direct participant endpoints or operations remain for compatibility, **When** a new
   UI session loads, **Then** the UI does not expose them.

### Edge Cases

- Event has only its default category.
- Default category is not first in display order.
- Default category is archived or unavailable due to inconsistent legacy data.
- Category list changes while the bottom sheet is open.
- Existing owner search returns no result, duplicate identities, or a recently archived account.
- Host creates an account but entry creation fails.
- Repeated Save actions or network retries must not create duplicate categories, accounts, or entries.
- Session expires or host loses ownership while the sheet is open.
- Bottom sheet content exceeds a short mobile viewport or onscreen keyboard reduces available height.
- Closing and reopening Add starts a clean flow unless an explicit recoverable failure remains visible.

## Scope Boundaries *(mandatory)*

### In Scope

- One owner-only primary Add button beside Settings.
- Accessible bottom sheet with Category and Entry choices.
- Category creation through the shared flow.
- Entry creation with mandatory category selection defaulted to the event's default category.
- Reuse of existing account search, new-account creation, and entry-title behavior.
- Removal of separate Add Category, Add Entry, and Add Participant controls.
- Participants empty-state guidance aligned with entry-derived participation.
- Refresh of categories, entries, analytics, and participants after successful creation.
- Responsive keyboard and mobile behavior.

### Out of Scope

- Editing or deleting categories or entries.
- Adding participant records without entries.
- Bulk category, entry, account, or participant creation.
- Changing account verification requirements.
- Changing category uniqueness, entry ownership, or archive rules.
- New public, voter, participant, or non-host creation permissions.
- Redesigning participant cards or account search beyond integration into the shared flow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Event owners MUST receive one primary Add control beside Settings on every owner event
  content view where the shared summary appears.
- **FR-002**: Non-owners and anonymous viewers MUST NOT receive or activate the Add control or its
  category, entry, or account-creation actions.
- **FR-003**: Activating Add MUST open a bottom sheet asking what the host wants to add, with exactly
  Category and Entry as choices.
- **FR-004**: The bottom sheet MUST support Close, Escape, and backdrop dismissal and MUST restore focus
  to Add.
- **FR-005**: Choosing Category MUST advance within the bottom sheet to category-title entry and use all
  existing category validation and authorization rules.
- **FR-006**: Successful category creation MUST close the sheet and refresh categories and analytics.
- **FR-007**: Choosing Entry MUST advance within the bottom sheet to an entry flow that requires category,
  owner account, and entry title.
- **FR-008**: Entry category selection MUST default to the active default category.
- **FR-009**: Hosts MUST be able to select another active category before saving an entry.
- **FR-010**: Entry owner selection MUST retain existing recent-participant ordering, account search, and
  new-account creation capabilities.
- **FR-011**: Successful entry creation MUST associate the entry with exactly one selected category and
  one owner account.
- **FR-012**: Successful entry creation MUST refresh categories, entries, analytics, and the
  entry-derived Participants view without requiring a browser reload.
- **FR-013**: Invalid input MUST keep the relevant step open, identify affected fields, preserve valid
  values, and provide a useful failure message.
- **FR-014**: Repeated submission or request replay MUST NOT create duplicate categories, accounts, or
  entries.
- **FR-015**: Separate Add Category and Add Entry controls MUST be removed from category content.
- **FR-016**: Direct Add Participant controls and forms MUST be removed from Participants.
- **FR-017**: Participant cards, entry ownership, and participant counts MUST remain derived from active
  entries and MUST remain unchanged by removal of direct participant creation.
- **FR-018**: Existing supported category and entry creation rules MUST remain server-enforced; hiding
  legacy UI controls MUST NOT weaken authorization.
- **FR-019**: Bottom-sheet steps MUST provide clear loading, validation, empty, success, and failure
  states.
- **FR-020**: Add flow MUST remain fully usable by keyboard and on supported mobile and desktop
  viewports.
- **FR-021**: If no valid default category can be resolved, Entry creation MUST be blocked with a safe
  recovery message rather than selecting an arbitrary archived category.
- **FR-022**: Existing category, entry, account, participant, and event contracts MUST remain compatible
  or receive an explicit migration plan.

### Key Entities

- **Add Session**: Temporary host interaction containing chosen add type and unsaved step values.
- **Category**: Existing event-owned grouping that may be created from the Add flow.
- **Entry**: Existing event content record assigned to one active category and owned by one account.
- **Account**: Existing identity selected or created as entry owner.
- **Participant View**: Derived grouping of active entry owners, not a separately created event record.

### Ownership and Access

- Event owner may start Add and create categories, accounts needed for entries, and entries using existing
  server authorization.
- Non-owner and anonymous viewers may read only event data already allowed by existing policy and may not
  receive creation controls.
- Account creation from Entry MUST collect only fields already required by the established provisional
  account flow.
- Participant association remains derived from active entry ownership; no independent participant
  creation occurs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Hosts can locate the event creation entry point within 3 seconds on supported event views.
- **SC-002**: Hosts can start Category or Entry creation in no more than two actions from an event view.
- **SC-003**: At least 95% of valid category and entry submissions show refreshed event content within
  2 seconds under normal conditions.
- **SC-004**: 100% of newly created entries in acceptance tests have one active category and one owner.
- **SC-005**: 100% of tested entry creations default to the active default category until the host
  explicitly changes it.
- **SC-006**: No direct participant-creation control appears in any tested owner or public view.
- **SC-007**: All Add steps fit supported mobile widths without horizontal page scrolling.
- **SC-008**: Keyboard-only users can open, complete, move back within, and dismiss every Add flow.
- **SC-009**: Replayed submissions create zero duplicate categories, accounts, or entries in tested
  failure and retry scenarios.

### Critical User Flows *(mandatory)*

- **CUF-001**: Host opens Add, selects Category, enters a valid title, saves, and sees refreshed categories
  and analytics.
- **CUF-002**: Host opens Add, selects Entry, accepts the default category, chooses an existing owner,
  enters a title, saves, and sees refreshed Entries and Participants.
- **CUF-003**: Host opens Add, selects Entry, chooses another category, creates a new account, saves, and
  sees the new owner represented as an entry-derived participant.
- **CUF-004**: Host opens Participants and sees cards without any direct participant-creation form.
- **CUF-005**: Non-owner directly attempts each creation action and is denied.

## Assumptions

- Work continues on `main`; no feature branch is needed for the sole contributor.
- Add appears beside Settings in the shared owner event summary and therefore remains available across
  Entries, Participants, and Results.
- “Default category” means the event's existing active default category, not merely the first displayed
  category.
- Existing Add Entry owner search and new-account creation behavior is reused.
- Category and entry creation remain separate submissions after the host chooses a type; this feature
  does not create categories and entries atomically.
- New-account creation may persist before a later entry failure under current account rules; retry
  reuses that account rather than creating a duplicate.
- Existing backend participant compatibility paths may remain temporarily, but no current UI exposes
  direct participant creation.
