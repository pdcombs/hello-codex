# Feature Specification: Event Details Navigation

**Feature Branch**: `main`

**Created**: 2026-07-25

**Status**: Draft

**Input**: Redesign host event details around an event photo, analytics, tabbed entries/participants/results views, and a separate settings page, following the supplied mock.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand Event at a Glance (Priority: P1)

As an event host, I can open an event and immediately identify it, understand its scale, and find its primary details without scanning setup controls.

**Why this priority**: This establishes the new event-details hierarchy shared by every event subpage.

**Independent Test**: Open a hosted event and verify the header presents its photo, three accurate analytics, settings navigation, title, description, and location before the content tabs.

**Acceptance Scenarios**:

1. **Given** a hosted event with categories, participants, and entries, **When** the host opens event details, **Then** the page shows the event photo at top left, category/participant/entry counts beside it, and a settings control at far right.
2. **Given** the event has a title, description, and location, **When** details load, **Then** those values appear beneath the summary row in that order.
3. **Given** the event has no description or location, **When** details load, **Then** missing values do not create blank labels or excess vertical space.
4. **Given** any event subpage is loading or unavailable, **When** the host navigates to it, **Then** the page provides a clear loading or failure state without displaying stale analytics.

---

### User Story 2 - Navigate Event Work by Tab (Priority: P1)

As an event host, I can switch among entries, participants, and future results while retaining the event context.

**Why this priority**: Entries and participants are the host's main event workflows; clear navigation removes the current disconnected participant page.

**Independent Test**: Navigate through all three tabs and verify the active state, URL, browser navigation, and correct existing content for each tab.

**Acceptance Scenarios**:

1. **Given** the host opens the base event URL, **When** the page loads, **Then** Entries is selected and the existing category-and-entry list is rendered unchanged.
2. **Given** the host selects Participants, **When** navigation completes, **Then** Participants is selected and the existing participant list and create-participant option are rendered unchanged.
3. **Given** the host selects Results, **When** navigation completes, **Then** Results is selected and the content reads “🎉 Feature Coming Soon”.
4. **Given** the host is on Participants or Results, **When** they refresh, share the URL, or use browser back/forward, **Then** the same view is restored.
5. **Given** the tab row is used with keyboard navigation, **When** focus moves and a tab is activated, **Then** active state and associated content are conveyed without requiring a pointer.

---

### User Story 3 - Manage Event Settings Separately (Priority: P2)

As an event host, I can open event settings from a recognizable control without setup forms overwhelming the primary details page.

**Why this priority**: Separating management controls keeps event details focused while preserving existing configuration capability.

**Independent Test**: Activate the settings control, verify a dedicated owner-only page opens, and confirm existing voting-rule and voting-code controls remain functional there.

**Acceptance Scenarios**:

1. **Given** the host is on an event content page, **When** they activate the settings control, **Then** a dedicated settings URL opens for that event.
2. **Given** the settings page loads, **When** the host reviews it, **Then** existing voting settings and applicable voting-code management appear there and no longer appear on Entries, Participants, or Results.
3. **Given** a non-owner requests the settings URL, **When** authorization is evaluated, **Then** private settings are not displayed and a safe denial or redirect is shown.
4. **Given** the host changes settings, **When** save succeeds or fails, **Then** existing validation, loading, conflict, success, and failure behavior remains intact.
5. **Given** the host activates Back on settings, **When** navigation completes, **Then** the event’s Entries view opens.

---

### User Story 4 - Represent Event with a Photo (Priority: P2)

As an event host, I can associate a photo with an event so the event is visually recognizable throughout its event workspace.

**Why this priority**: Photo is a new persistent event attribute and central element of the redesigned header.

**Independent Test**: Add a photo, reload all three event content views, and verify the same event photo or defined fallback appears without layout shift.

**Acceptance Scenarios**:

1. **Given** an event has a photo, **When** any event content tab loads, **Then** the photo appears with meaningful event-specific alternative text.
2. **Given** an event has no photo or its photo cannot load, **When** the page renders, **Then** a stable accessible fallback occupies the same space.
3. **Given** a host selects a valid photo, **When** upload succeeds, **Then** the application compresses it for profile-photo-style use and the new photo persists across reloads and content tabs.
4. **Given** a photo is visible, **When** a viewer activates it, **Then** a larger accessible preview opens.
5. **Given** the host opens the photo preview, **When** they choose Replace, **Then** they can upload a replacement that becomes the event photo after successful processing.
6. **Given** the host opens the photo preview, **When** they choose Delete and confirm, **Then** the stored event photo is removed and the fallback appears.
7. **Given** a public viewer opens the photo preview, **When** it appears, **Then** viewing is allowed but Replace and Delete are unavailable.
8. **Given** a non-owner attempts to upload, replace, or delete an event photo, **When** the request is processed, **Then** the change is denied.

### Edge Cases

- Events with zero active entries show zero participants and zero entries while retaining at least one category under existing event rules.
- Archived categories, archived entries, and users with no active event entries do not contribute to analytics.
- Analytics remain numerically consistent when one participant owns several entries across several categories.
- Long titles, descriptions, locations, and large counts remain readable on narrow and short screens without overlap.
- Missing or failed photos preserve summary alignment and do not expose broken-image controls.
- Invalid, oversized, corrupt, or unsupported photo files are rejected with a clear message and leave the current photo unchanged.
- Photo compression failure leaves the prior photo unchanged and offers a retry.
- Closing the photo preview returns keyboard focus to the photo trigger.
- Direct navigation to an unknown event subpage shows the standard not-found experience.
- Concurrent changes to categories, participants, entries, or settings become visible after the relevant content reloads.
- Results remains non-interactive beyond navigation and the coming-soon message.

## Scope Boundaries *(mandatory)*

### In Scope

- Redesigned owner event header based on the supplied mock.
- Persistent event-photo attribute, compressed upload, accessible preview, replacement, deletion, and fallback presentation.
- Active category, participant, and entry analytics.
- Entries, Participants, and Results tab navigation with stable subpage URLs.
- Reuse of existing category/entry and participant components without changing their business behavior.
- Dedicated owner-only event settings page.
- Relocation of existing voting rules and code management from event details to settings.
- Responsive and keyboard-accessible desktop/mobile behavior.
- Compatible loading, empty, error, and authorization states.

### Out of Scope

- Voting results calculation or display.
- Changes to category, entry, participant, voting-rule, or voting-code business rules.
- General analytics beyond the three specified counts.
- Photo galleries, manual cropping, filters, captions, or multiple event photos.
- Participant-facing profile photos.
- Editing title, description, location, or registration policy unless already supported by an existing moved control.
- Changes to public voting or ballot workflows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every event MUST support one optional event-photo reference without breaking existing events.
- **FR-002**: Event owners MUST be able to upload and manage the event photo, and the resulting photo MUST be visible in both owner and public event views.
- **FR-003**: The application MUST normalize uploaded photos to WebP, encode first at quality 80, retry only at quality 70 and then 60 when required to meet the 350 KiB bound, and reject the upload rather than persist output below quality 60.
- **FR-003a**: Photo processing MUST reject unsupported, invalid, corrupt, or unsafe files before storage and MUST preserve the prior photo when processing fails.
- **FR-003b**: Activating an event photo MUST open an accessible larger preview.
- **FR-003c**: Owners MUST be able to replace or delete the photo from the preview; deletion MUST require confirmation.
- **FR-003d**: Public viewers MAY open the preview but MUST NOT receive photo-management controls.
- **FR-004**: Entries, Participants, and Results MUST display a shared summary containing photo/fallback, category count, participant count, entry count, title, description when present, and location when present.
- **FR-005**: Category count MUST equal active categories visible in the event.
- **FR-006**: Entry count MUST equal active entries across active categories.
- **FR-007**: Participant count MUST equal distinct account owners of active event entries, consistent with the existing entry-derived participant model.
- **FR-008**: Archived categories, archived entries, and owners without active entries MUST be excluded from all three analytics.
- **FR-009**: A settings control MUST be visually right-aligned in the summary row, have an accessible name, and navigate to the event settings page.
- **FR-010**: The event workspace MUST provide Entries, Participants, and Results tabs in that order.
- **FR-011**: Entries MUST be the default view at the base event URL and MUST render the existing category/entry components and actions unchanged.
- **FR-012**: Participants MUST have a stable event subpage URL and MUST render the existing participant list and create-participant capability unchanged.
- **FR-013**: Results MUST have a stable event subpage URL and MUST display “🎉 Feature Coming Soon” without exposing unfinished result controls.
- **FR-014**: Tab active state MUST derive from current URL so refresh, direct links, and browser history restore the expected content.
- **FR-015**: Tabs MUST meet keyboard, focus, active-state, and content-association accessibility expectations.
- **FR-016**: Settings MUST have a stable event subpage URL accessible only to the event owner.
- **FR-017**: Existing voting-rule controls and conditional voting-code management MUST move to Settings and MUST be removed from content tabs.
- **FR-018**: Settings MUST retain existing loading, validation, concurrency, save, success, and failure behavior.
- **FR-019**: Settings MUST include a Back control returning to the event Entries view.
- **FR-020**: Existing event records without a photo and events whose photo was deleted MUST remain readable and show a consistent fallback.
- **FR-021**: Existing event, category, entry, participant, account, and voting contracts MUST remain compatible or receive an explicit migration.
- **FR-022**: Summary analytics MUST refresh after successful category, entry, or participant changes without a full browser reload.
- **FR-023**: Each subpage MUST provide clear loading, empty, authorization-denied, and failure states.
- **FR-024**: Layout MUST preserve readable content and usable controls on supported mobile and desktop viewports.
- **FR-025**: Category, participant, and entry analytics MUST be publicly readable, derived from active public event data, and MUST NOT provide or imply permission to edit the event.
- **FR-026**: Non-host and anonymous viewers MUST NOT see or activate category, entry, participant, photo-management, or settings controls on owner workspace routes; direct API mutations MUST remain server-authorized and denied.

### Key Entities

- **Event**: Existing voting event, extended with one optional photo reference while retaining title, description, location, categories, and voting settings.
- **Event Photo**: Event-owned compressed image plus metadata needed to validate, display, replace, delete, and present an accessible fallback.
- **Event Analytics Summary**: Current derived counts of active categories, active entries, and distinct active entry owners; not a separately editable record.
- **Event Workspace View**: One of Entries, Participants, Results, or Settings, identified by event and stable navigation location.

### Ownership and Access

- Event owner may view all workspace views; upload, preview, replace, and delete the event photo; manage entries and participants through existing permissions; and access Settings.
- Public viewers may view the event photo and larger preview but may not change it.
- Non-owner and anonymous viewers MUST NOT access owner-only participant creation, settings, photo management, or event-management controls.
- Analytics are public, read-only event facts derived from active public event data; receiving counts does not grant event-management permission.
- Photo access MUST not reveal storage credentials, private source locations, or upload tokens.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Hosts can identify category, participant, and entry totals within 5 seconds of opening an event.
- **SC-002**: Hosts can move from any event content view to Settings in no more than one action.
- **SC-003**: Hosts can move among Entries, Participants, and Results in one action, with selected content visible within 2 seconds for 95% of normal sessions.
- **SC-004**: All analytics match active source records across test events containing zero, one, and multiple categories, participants, and entries.
- **SC-005**: 100% of existing event-detail management flows remain available after relocation, with no loss of saved settings.
- **SC-006**: All event workspace views fit supported mobile widths without horizontal page scrolling.
- **SC-007**: Keyboard-only users can reach and activate every tab, settings control, Back control, and existing content action.
- **SC-008**: Existing events without photos load successfully and display a stable fallback in 100% of tested cases.
- **SC-009**: 100% of accepted uploads are compressed before storage, and failed uploads leave the previous photo unchanged.
- **SC-010**: Owners can upload, preview, replace, or delete an event photo in no more than three actions from an event content view.
- **SC-011**: Event workspace reads maintain at least 99% successful availability over a rolling 15-minute window, excluding explicit not-found and authorization denials.

### Critical User Flows *(mandatory)*

- **CUF-001**: Host opens event, reads accurate analytics, and manages categories and entries from Entries.
- **CUF-002**: Host selects Participants, views derived participant cards, and opens existing participant creation.
- **CUF-003**: Host selects Results and sees the coming-soon state; browser back restores the previous tab.
- **CUF-004**: Host opens Settings, changes voting rules, returns to Entries, and sees no settings controls on content tabs.
- **CUF-005**: Host uploads a photo, opens its preview, replaces it, reloads all content tabs, deletes it, and sees the fallback.
- **CUF-006**: Non-owner directly requests Settings or photo-management action and is safely denied.
- **CUF-007**: Public viewer opens the event photo preview and cannot access replacement or deletion.

## Assumptions

- Work continues on `main`; no feature branch is required for the sole contributor.
- Base event URL represents Entries; `/participants`, `/results`, and `/settings` are stable event subpages.
- Existing category/entry and participant components retain current business behavior and appearance unless shared workspace layout requires spacing changes.
- “Participants” means distinct owners of active entries, matching the established entry-derived participant model.
- Existing voting rules and code inventory are the settings currently being relocated.
- Results is intentionally a static placeholder in this feature.
- Analytics are computed from authoritative current event data rather than manually maintained values.
- Settings uses the mock’s simplified Back-oriented layout without the event summary or content tabs.
- Photo upload accepts common browser-supported image formats; exact format, dimension, quality, and file-size limits are selected during planning to meet safe profile-photo-style presentation and performance targets.
- Compression is automatic; manual cropping and editing are deferred.
