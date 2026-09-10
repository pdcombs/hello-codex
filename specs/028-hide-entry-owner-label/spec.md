# Feature Specification: Hide Entry Owner Label

**Feature Branch**: `028-hide-entry-owner-label`

**Created**: 2026-09-10

**Status**: Ready for planning

**Input**: User description: "Temporarily hide the 'Owned by (user name)' label shown beneath each category entry on the event details page. UI only; keep everything else unchanged so it can be restored later."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cleaner Category Entries (Priority: P1)

Host, participant, or public visitor viewing event details sees entry titles without owner attribution labels beneath them.

**Why this priority**: Removes unwanted visual detail while preserving event content and behavior.

**Independent Test**: Open event details containing category entries with known owners and verify titles remain visible while no `Owned by` text or owner display name appears as entry attribution.

**Acceptance Scenarios**:

1. **Given** event category contains entry with owner, **When** any viewer opens event details, **Then** entry title appears and `Owned by (name)` label does not.
2. **Given** event has several categories and entries, **When** details render, **Then** no entry displays owner attribution label.
3. **Given** host uses existing category or entry controls, **When** owner label is hidden, **Then** controls and behavior remain unchanged.

### Edge Cases

- Entry owner name is missing, long, duplicated, or contains special characters.
- Event has no categories, empty categories, or archived entries.
- Host enters editable category state; existing accessible form labeling must remain usable.
- Same owner data is used by setup, participant, search, or editing workflows outside event-details entry display.
- Responsive mobile and desktop layouts must not leave empty owner-label spacing.

## Scope Boundaries *(mandatory)*

### In Scope

- Hide visible `Owned by (user name)` attribution beneath category entries on event details page.
- Apply same display behavior to host, participant, and public event-details views that share entry rendering.
- Remove resulting empty visual space.
- Preserve reversible source structure or narrowly scoped change so label can return later.

### Out of Scope

- Removing owner data from API, database, event models, or queries.
- Removing owner selection or owner display from entry creation, editing, setup, search, participant management, or other screens.
- Changing entry titles, category layout, permissions, sorting, controls, or behavior.
- Anonymizing or deleting event ownership records.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Event-details category entries MUST continue displaying entry title.
- **FR-002**: Event-details category entries MUST NOT visibly display `Owned by` label or owner display name as attribution.
- **FR-003**: Hidden attribution MUST apply consistently to all viewer roles using event-details category list.
- **FR-004**: Change MUST affect presentation only; owner data contracts, persistence, and retrieval MUST remain unchanged.
- **FR-005**: Entry add, edit, archive, category, participant, voting, and results behavior MUST remain unchanged.
- **FR-006**: Other screens that intentionally display or use entry owner MUST remain unchanged.
- **FR-007**: Hidden label MUST leave no blank row, placeholder, separator, or extra spacing.
- **FR-008**: Editable entry controls MUST retain clear accessible labels even when visible owner attribution is hidden.
- **FR-009**: Automated coverage MUST verify title presence, attribution absence, and unchanged relevant controls.

### Key Entities

- **Event Entry**: Existing category item with title and owner metadata; only owner attribution presentation changes.
- **Owner Attribution Label**: Visible `Owned by (name)` text temporarily omitted from event-details display.

### Ownership and Access

- No ownership or access rules change.
- Owner metadata remains available to authorized workflows and backend logic.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of tested event-details entries display titles and zero visible `Owned by` labels.
- **SC-002**: 100% of existing tested entry/category controls remain functional.
- **SC-003**: API and stored owner data remain byte-for-byte contract-compatible.
- **SC-004**: Mobile and desktop entry rows show no empty attribution spacing.
- **SC-005**: Existing event-details, entry-editing, accessibility, and browser tests pass after change.

### Critical User Flows *(mandatory)*

- **CUF-001**: Public visitor opens event and reads category entries without owner labels.
- **CUF-002**: Host opens same event, sees same clean entry list, and can still use existing entry controls.
- **CUF-003**: Host enters entry editing workflow and accessible controls continue working.

## Assumptions

- Requested label is visible `<span>` rendered by shared event entry row in non-editable state.
- Temporary means behavior should be easy to restore through small UI-only change; no feature toggle requested.
- Owner names may remain present in hidden application data and in unrelated authorized workflows.
