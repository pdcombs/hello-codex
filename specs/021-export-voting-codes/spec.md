# Feature Specification: Export Voting Codes

**Feature Branch**: `021-export-voting-codes`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Improve voting-code management with used and available totals, a status-first table, and an Excel-compatible CSV export."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand Code Availability (Priority: P1)

Event host sees event-wide counts for used and available voting codes before reviewing individual codes.

**Why this priority**: Host must know whether enough codes remain before distributing codes or opening voting.

**Independent Test**: Open voting-code settings for event containing used and unused codes; verify totals match entire event inventory, including codes beyond current visible page.

**Acceptance Scenarios**:

1. **Given** event has 12 used and 38 unused codes, **When** host opens voting-code settings, **Then** summary shows 12 used and 38 available.
2. **Given** event has no codes, **When** host opens voting-code settings, **Then** summary shows zero used and zero available with existing empty-state guidance.
3. **Given** list is paginated, **When** host views first page, **Then** summary still represents all codes for event.

---

### User Story 2 - Scan and Copy Codes (Priority: P1)

Event host reviews codes in table with clear code, status, and usage information. Used codes appear before unused codes.

**Why this priority**: Current card-like list makes copying codes and distinguishing availability difficult.

**Independent Test**: Open inventory containing used and unused codes; verify rows align consistently, used rows precede unused rows, and individual code text can be selected and copied.

**Acceptance Scenarios**:

1. **Given** mixed code statuses, **When** table loads, **Then** used codes appear first and unused codes follow.
2. **Given** used code has usage timestamp and claimant details, **When** host reviews row, **Then** table clearly displays available usage information without exposing it to non-hosts.
3. **Given** host uses narrow mobile screen, **When** table exceeds viewport width, **Then** code rows remain readable through horizontal scrolling without breaking settings page.

---

### User Story 3 - Export Complete Code Inventory (Priority: P2)

Event host downloads all voting codes as CSV that opens cleanly in Excel and other spreadsheet applications.

**Why this priority**: Hosts need efficient offline distribution, printing, and record keeping without copying each row.

**Independent Test**: Export event with more codes than one displayed page; open downloaded CSV and verify every code appears once with accurate status and usage timestamp.

**Acceptance Scenarios**:

1. **Given** event has voting codes, **When** host selects export, **Then** browser downloads one CSV containing all event codes, not only currently loaded rows.
2. **Given** exported inventory has mixed statuses, **When** file opens, **Then** header and row columns are clear, used rows appear first, and code values preserve exact lowercase text.
3. **Given** event has no codes, **When** host views settings, **Then** export action is unavailable and empty state remains visible.
4. **Given** export fails, **When** host attempts download, **Then** host sees actionable error and no misleading success state.

### Edge Cases

- Inventory changes while page is open; refreshed summary, table, and export must reflect latest saved state.
- Event may contain up to current system limit of 100,000 codes; export must include full inventory without silently truncating rows.
- Claimant display name or email may contain commas, quotes, or line breaks; exported fields must remain valid spreadsheet cells.
- Used timestamp or claimant details may be absent for legacy records; table and export use blank values rather than fabricated data.
- Revoked legacy/future codes, if returned, are neither used nor available and appear after unused codes with clear revoked status.
- Only event host may view or export code inventory; unauthorized requests fail without revealing codes or counts.

## Scope Boundaries *(mandatory)*

### In Scope

- Event-wide used and available code totals in voting-code settings.
- Host-only, accessible table for code inventory with used-first ordering.
- Copy-friendly lowercase code text and clear status labels.
- Download of complete event inventory as Excel-compatible CSV.
- Export columns for code, status, used timestamp, claimant display name, and claimant email when available.
- Loading, empty, and failure feedback for inventory and export.

### Out of Scope

- Native Excel workbook format.
- Bulk code import, editing, revocation, deletion, or regeneration.
- Custom export column selection, filters, or date ranges.
- Public or voter access to code inventory or export.
- Changes to voting-code generation, validation, or single-use rules.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST show event host total used code count and total available code count above code inventory.
- **FR-002**: Counts MUST cover entire event inventory rather than only currently displayed rows.
- **FR-003**: System MUST define available as a code eligible for a new ballot and used as a code attached to a submitted ballot.
- **FR-004**: System MUST display inventory in an accessible table with labeled columns for code, status, used time, and claimant information when available.
- **FR-005**: System MUST order used codes before unused codes; within each status group, newest usage or creation records MUST appear first for deterministic display.
- **FR-006**: Code text MUST remain selectable, copyable, and lowercase in displayed and exported output.
- **FR-007**: Wide tables MUST remain usable on supported mobile screens without obscuring surrounding controls.
- **FR-008**: System MUST provide host an export action only when at least one code exists.
- **FR-009**: Export MUST contain every code belonging to event exactly once, independent of visible pagination.
- **FR-010**: Export MUST produce a UTF-8 CSV with a header row and columns for code, status, used timestamp, claimant display name, and claimant email.
- **FR-011**: Exported values MUST be safely encoded so spreadsheet applications preserve cell boundaries and do not interpret user-controlled values as formulas.
- **FR-012**: Export rows MUST use same deterministic used-first ordering as displayed inventory.
- **FR-013**: Download filename MUST identify event and export date while remaining valid across common operating systems.
- **FR-014**: System MUST show clear loading and error feedback while retrieving inventory or preparing export.
- **FR-015**: Only authenticated event host MUST be authorized to view counts, inventory, or exported code data.
- **FR-016**: Generating new codes MUST refresh counts and inventory without requiring full page reload.

### Key Entities

- **Voting Code Inventory**: Host-controlled set of codes for event, including code value, status, creation time, optional use time, and optional claimant details.
- **Inventory Summary**: Event-wide totals grouped into used, available, and any non-available/non-used status.
- **Code Export**: Point-in-time representation of complete authorized event inventory with stable columns and ordering.

### Ownership and Access

- Event host owns and may view or export event voting-code inventory.
- Non-host accounts and anonymous users may not view inventory, totals, claimant data, or export contents.
- Export is generated on demand and is not retained as a separate platform record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Host can identify used and available totals within 5 seconds of opening voting-code settings.
- **SC-002**: Host can distinguish used from unused code rows with 100% accuracy in acceptance testing.
- **SC-003**: Export of up to 100,000 codes completes without missing or duplicate rows and begins download within 10 seconds under normal conditions.
- **SC-004**: Exported file opens in current Excel and common spreadsheet applications with 100% of tested rows aligned to correct columns.
- **SC-005**: Unauthorized inventory and export attempts reveal zero code values, claimant details, or aggregate counts.

### Critical User Flows *(mandatory)*

- **CUF-001**: Authenticated event host opens settings, reviews accurate used/available totals, scans used-first table, and downloads complete CSV inventory.

## Assumptions

- “Export to Excel” means downloadable CSV compatible with Excel; native workbook output is not required.
- Existing host authentication and event ownership rules remain authoritative.
- “Available” maps to current unused status; revoked codes are excluded from both used and available totals.
- Existing maximum inventory is 100,000 codes per event.
- Existing claimant details remain part of host-only inventory and may be included in export.
