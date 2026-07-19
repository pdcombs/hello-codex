# Feature Specification: Edit Entry Titles

**Feature Branch**: `main`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "Allow an event host editing a category to edit entry titles in prefilled text boxes and save all category and entry changes with one save action."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Entry Titles in a Category (Priority: P1)

An event host opens a category's existing edit mode and sees each active entry title in an editable text field prefilled with its current value. The host may update one or many entry titles, then use the category's existing Save action once to apply every staged change.

**Why this priority**: Hosts must correct or improve voting choices without deleting and recreating entries. One save keeps multi-entry category maintenance fast and predictable.

**Independent Test**: Open a category containing three entries, change all three prefilled titles, save once, and verify all three updated titles appear in category and participant views while entry ownership and category assignment remain unchanged.

**Acceptance Scenarios**:

1. **Given** a host views a category with active entries, **When** the host enables category edit mode, **Then** every entry title appears in a text field prefilled with its current title.
2. **Given** a host changes three entry titles in one category, **When** the host selects Save once, **Then** all three titles update as one completed action.
3. **Given** a host changes the category title and one or more entry titles, **When** the host selects Save, **Then** all staged category and entry title changes apply together.
4. **Given** a host changes an entry title, **When** saving succeeds, **Then** the entry keeps its identity, owner, category, active status, and creation history.
5. **Given** a saved entry title change, **When** the host views categories or participants, **Then** both views show the same updated title without manual reload.

---

### User Story 2 - Correct Invalid Batch Changes (Priority: P2)

An event host receives clear field-level feedback when any staged entry title is invalid. No staged category or entry change applies until every field is valid, so the host can correct the problem without losing other edits.

**Why this priority**: Batch editing is trustworthy only when one invalid field cannot create a partially updated category.

**Independent Test**: Change multiple titles, leave one blank, save, and verify the blank field identifies its problem, all typed values remain, and no title changes persist until correction and resubmission.

**Acceptance Scenarios**:

1. **Given** multiple staged entry title edits with one blank title, **When** the host saves, **Then** the blank field is identified, all staged values remain visible, and no category or entry title changes persist.
2. **Given** an invalid batch was rejected, **When** the host corrects the invalid field and saves again, **Then** all staged changes apply together.
3. **Given** another change makes an entry or category unavailable after edit mode opens, **When** the host saves, **Then** the save is rejected with a clear message and no staged change is applied.
4. **Given** a person who is not the event host attempts the same change, **When** the save is submitted, **Then** access is denied and no title changes.

### Edge Cases

- Saving without changing any values exits edit mode without creating title-change history.
- Leading and trailing whitespace is removed before validation and save.
- A whitespace-only entry title is invalid.
- Duplicate entry titles remain allowed because entries retain separate identities and owners.
- Archived entries are not editable and are excluded from the active category edit form.
- Entry deletion already available in category edit mode remains a separate action and stays compatible with title editing.
- Closing or leaving edit mode without saving discards staged title edits.

## Scope Boundaries *(mandatory)*

### In Scope

- Host-only editing of active entry titles from existing category edit mode.
- One prefilled title field per active entry.
- One save action for category title and entry title edits.
- Atomic validation and persistence of the complete category edit.
- Consistent refreshed titles across category and participant views.
- Auditable title changes containing identifiers and accountable actor without copying title text into operational logs.
- Accessible loading, validation, saving, success, and failure behavior on mobile and desktop.

### Out of Scope

- Changing entry owner, category assignment, order, or status through title editing.
- Participant self-service entry editing.
- Editing archived entries or restoring archived entries.
- Bulk editing entries across multiple categories with one save.
- Maintaining or displaying user-facing title revision history.
- Changing existing rules for category deletion or entry removal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Only the event host MUST be allowed to edit entry titles for that event.
- **FR-002**: Category edit mode MUST show every active entry title in an editable text field.
- **FR-003**: Each entry title field MUST be prefilled with the entry's current title.
- **FR-004**: The existing category Save action MUST submit the category title and all staged entry title changes as one action.
- **FR-005**: A host MUST be able to change any number of entry titles within the edited category before saving.
- **FR-006**: Every retained active entry MUST have a nonblank title conforming to established entry-title length and content rules.
- **FR-007**: Title values MUST be trimmed before validation and persistence.
- **FR-008**: Invalid fields MUST identify the affected entry and explain how to correct the title.
- **FR-009**: If any staged field or operation is invalid, the system MUST preserve all staged form values and apply none of the changes.
- **FR-010**: Successful save MUST apply valid category-title and entry-title changes atomically.
- **FR-011**: Editing a title MUST preserve entry identity, owner, event, category, active status, and original creation time.
- **FR-012**: Archived entries MUST NOT appear as editable entries or accept title changes.
- **FR-013**: Existing entry removal MUST remain a separate compatible action and MUST retain its current archival behavior.
- **FR-014**: Duplicate entry titles MUST remain valid and represent distinct entries.
- **FR-015**: Successful save MUST exit edit mode and refresh category and participant projections so updated titles appear without manual reload.
- **FR-016**: If the event, category, entry, or host permission changes before save, the complete save MUST be rejected without partial changes.
- **FR-017**: A save containing no effective changes MUST succeed without creating false title-change audit history.
- **FR-018**: Each successful entry title change MUST create an auditable event identifying event, category, entry, actor, and time.
- **FR-019**: Operational logs and audit metadata MUST NOT include old or new entry title text.
- **FR-020**: The edit form MUST support keyboard-only operation, logical focus, accessible field names, field-associated errors, and announced save failures.
- **FR-021**: Save controls MUST prevent duplicate submissions while a save is in progress.
- **FR-022**: Retrying the same save after an uncertain response MUST not apply any title change more than once.
- **FR-023**: Existing category viewing, category editing, entry removal, participant projections, and Add Entry flows MUST remain compatible.

### Key Entities

- **Event**: Host-owned voting event that establishes the authorization boundary for category and entry editing.
- **Category**: Event-owned grouping whose edit session may include its title and active entry titles.
- **Entry**: Participant-owned voting choice with stable identity, title, event, category, owner, active or archived status, and timestamps.
- **Category Edit**: One host intent containing the category's staged title plus entry title updates, applied as one completed outcome.
- **Entry Title Change Audit**: Historical record identifying changed entry and accountable host without retaining title text in operational metadata.

### Ownership and Access

- Event host owns category setup and is the only actor authorized to edit entry titles in this feature.
- Entry owner remains unchanged when host edits an entry title.
- Viewers and participants may see updated titles according to existing event visibility but cannot edit them.
- Authorization and event/category/entry relationships MUST be revalidated when saving, not only when edit mode opens.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of first-time host testers can edit three entry titles and save them with one action without assistance.
- **SC-002**: A host can update three entry titles in one category in under 45 seconds from entering edit mode through seeing saved results.
- **SC-003**: In 100% of acceptance tests, successful batch saves update every intended retained entry and never partially apply a rejected batch.
- **SC-004**: In 100% of successful title edits, entry identity, owner, category, status, and creation time remain unchanged.
- **SC-005**: Updated entry titles appear consistently in category and participant views within two seconds under normal operating conditions.
- **SC-006**: In 100% of invalid-title tests, the affected field is identified and all other staged values remain available for correction.
- **SC-007**: Unauthorized edit attempts produce zero entry or category changes and expose no private event-management data.
- **SC-008**: Existing category editing, entry removal, Add Entry, and participant-view acceptance flows remain successful after release.

### Critical User Flows *(mandatory)*

- **CUF-001**: Host opens category edit mode, edits three prefilled entry titles, saves once, and sees all updated titles in the category.
- **CUF-002**: Host edits category and entry titles together, saves once, and sees one consistent completed result.
- **CUF-003**: Host submits one invalid entry title, receives field-level feedback with all edits preserved, corrects it, and saves the full batch.
- **CUF-004**: Host edits and saves an entry title, then uses existing entry removal separately and sees both flows remain consistent.
- **CUF-005**: Unauthorized user attempts entry-title editing and makes no change.

## Assumptions

- Existing category edit mode and Save action remain the entry point and completion control.
- Existing entry title validation limits remain authoritative.
- Existing entry removal remains a separate immediate action, continues to soft archive, and never hard-deletes history.
- Category edits affect one category per save; other categories are independent.
- Duplicate titles are intentionally valid because entry identity is not title-based.
- No user-facing revision-history screen is required; audit availability remains operational and database-level.
- Current event-host role is the only implemented event-management role; future delegated administrators can reuse the same authorization capability when introduced.
