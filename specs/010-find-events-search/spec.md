# Feature Specification: Find Events Search

**Feature Branch**: `main`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Add a Find Events search control to the shared header for signed-in and
signed-out users. Open a full-screen search overlay, rotate example event-and-location prompts, search
public events by partial title, description, or location, load results continuously, and navigate a
selected result to its public event details."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover Eligible Events (Priority: P1)

A signed-in or signed-out visitor opens Find Events from the shared header, enters part of an event title,
description, or location, and sees matching active public/private events.

**Why this priority**: Discovery is the feature's core value. Visitors need one consistent way to find
events without already having a direct link.

**Independent Test**: Publish several events with distinct titles, descriptions, and locations; search
using partial terms from each field while signed in and signed out; confirm matching public/private events
appear while unlisted/archived events do not.

**Acceptance Scenarios**:

1. **Given** a visitor on any page, **When** the shared header renders, **Then** a clearly named search-icon
   control is available whether the visitor is signed in or signed out.
2. **Given** the visitor activates Find Events, **When** the overlay opens, **Then** it covers the viewport,
   presents a prominent blank search field, moves focus into it, and offers an obvious way to close.
3. **Given** public events containing the partial text in title, description, or location, **When** the
   visitor enters that text, **Then** matching events are returned without requiring an exact phrase or
   exact capitalization.
4. **Given** active public, private, and unlisted events share matching text, **When** results load, **Then**
   public and private events appear while unlisted events do not.
5. **Given** an archived event matches the query, **When** results load, **Then** it is not revealed.
6. **Given** no discoverable event matches, **When** the search completes, **Then** the visitor sees a clear empty
   state rather than a blank or failed-looking overlay.
7. **Given** search cannot complete, **When** failure occurs, **Then** the visitor sees a retryable error
   without losing the entered query.

---

### User Story 2 - Browse More Results (Priority: P2)

A visitor scrolls through a large result set and receives additional matching events without manual page
controls.

**Why this priority**: Continuous browsing keeps discovery usable when a city, event type, or common phrase
matches many events.

**Independent Test**: Create more matching public events than one result page, search once, scroll to the
end repeatedly, and confirm each page appears once in stable order until no results remain.

**Acceptance Scenarios**:

1. **Given** more than 20 matching events, **When** the visitor reaches the result-list boundary, **Then**
   the next result page loads automatically.
2. **Given** a next page is loading, **When** the visitor continues viewing current results, **Then** a
   loading indicator appears and existing results remain usable.
3. **Given** all matches are loaded, **When** the visitor reaches the end, **Then** no duplicate request or
   duplicate event is added and an end state is available.
4. **Given** the query changes while an earlier page is loading, **When** responses arrive, **Then** only
   results for the current query are displayed.

---

### User Story 3 - Open Event Details (Priority: P1)

A visitor selects a search result and lands on the normal viewer-aware event details route.

**Why this priority**: Search provides value only when a result leads to useful event information.

**Independent Test**: Search for a known event and select it while signed out, signed in as a non-host,
and signed in as its host; confirm the server returns the appropriate public, private-summary, or host
projection for the current viewer.

**Acceptance Scenarios**:

1. **Given** a matching result, **When** the visitor selects it, **Then** the search overlay closes and the
   event details view opens.
2. **Given** a signed-in event host selects their own event result, **When** navigation completes, **Then**
   the normal event-details access check recognizes the host and returns the full host view regardless of
   whether navigation began in search, a direct link, or host navigation.
3. **Given** a result becomes unavailable before selection completes, **When** its public details cannot be
   loaded, **Then** the visitor receives the existing public-event unavailable behavior.

---

### User Story 4 - Learn What to Search For (Priority: P4)

Before typing, a visitor sees rotating example searches that demonstrate event types and locations.

**Why this priority**: Examples make the empty search state understandable without blocking core discovery.

**Independent Test**: Open Find Events, leave the field empty, and confirm examples rotate every 2–3
seconds; type a query and confirm examples no longer interfere.

**Acceptance Scenarios**:

1. **Given** the search field is empty, **When** the overlay remains open, **Then** placeholder examples such
   as "motorcycle show in rogers ar", "bbq competition in kansas city", and "talent show in bentonville"
   rotate every 2–3 seconds.
2. **Given** the visitor has entered text, **When** placeholder timing advances, **Then** entered text is
   unchanged and no example replaces it.
3. **Given** reduced-motion preferences are enabled, **When** the field is empty, **Then** the examples remain
   understandable without distracting visual motion.

---

### User Story 5 - Host Controls Event Visibility (Priority: P1)

An event host chooses whether an active event is public, private, or unlisted, and may permanently archive
the event.

**Why this priority**: Search eligibility and private-event disclosure require an explicit server-owned
event visibility lifecycle before discovery can be safe and predictable.

**Independent Test**: As host, change an event among public, private, and unlisted; archive another event;
verify search eligibility, direct-link access, private summary redaction, archived read-only behavior, and
non-host denial.

**Acceptance Scenarios**:

1. **Given** an active event, **When** its host changes visibility among public, private, and unlisted,
   **Then** the new visibility takes effect immediately.
2. **Given** a non-host or signed-out visitor, **When** they open a private event directly or through search,
   **Then** they see only title, description, category count, participant count, entry count, navigation
   labels, and a private-event notice.
3. **Given** a private-event summary visitor, **When** they inspect or call the service directly, **Then**
   location, photo, categories, entries, participants, voting capability, and owner-only controls are absent
   and voting cannot start.
4. **Given** the host opens their private event, **When** details load, **Then** the host retains full
   management access.
5. **Given** an active unlisted event, **When** a visitor has its direct link, **Then** normal public details
   remain available even though search excludes the event.
6. **Given** the host archives an event after confirmation, **When** archival completes, **Then** it leaves
   search, becomes host-only read-only, and cannot be restored.
7. **Given** a non-host requests an archived event, **When** access is evaluated, **Then** the event is not
   revealed.

### Edge Cases

- Empty or whitespace-only input shows an idle discovery state and does not return an unrestricted event
  catalog.
- Punctuation, repeated spaces, letter casing, and leading/trailing whitespace do not prevent reasonable
  partial matches.
- Rapid typing does not flash stale results or issue an unbounded number of searches.
- A result matching more than one field appears once.
- Middle-of-word input matches eligible text, such as `cycle` matching `motorcycle`.
- Duplicate event titles remain distinguishable using description and location context.
- Closing and reopening search starts with a blank query and fresh result state.
- Escape, backdrop selection, and close control dismiss the overlay; focus returns to the header search
  control.
- Keyboard and assistive-technology users can reach, understand, select, and continuously load results.
- Overlay remains usable at 320 CSS pixels, short landscape viewports, and 200% zoom without horizontal
  page scrolling.

## Scope Boundaries *(mandatory)*

### In Scope

- Find Events search-icon control in the shared header for signed-in and signed-out users.
- Full-viewport search overlay with focus management and accessible dismissal.
- Rotating example placeholders while search input is empty.
- Case-insensitive partial matching across public event title, description, and location.
- Stable, paginated results loaded through infinite scrolling.
- Loading, empty, end-of-results, and retryable failure states.
- Navigation from a result to the normal viewer-aware event details view.
- Server-enforced exclusion of events not eligible for public discovery.
- Search observability that excludes raw query text and personal data.
- Host-only event visibility settings for public, private, and unlisted active events.
- Permanent event archival with host-only read-only history.
- Server-redacted private-event summary for non-host visitors.

### Out of Scope

- Search across participants, entries, categories, hosts, voting codes, or voting results.
- Location-radius, map, date, category, or advanced filter controls.
- Search suggestions, query history, saved searches, personalization, or recommendations.
- Search-engine indexing or public marketing pages.
- Editing, joining, registering, or voting directly inside the search overlay.
- Fuzzy spelling correction, semantic search, or synonym expansion.
- Restoring archived events.
- Participant self-registration controls or changes to voting-rule configuration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST show one accessible Find Events search control in the shared header for signed-in
  and signed-out visitors on every page that uses that header.
- **FR-002**: Search control MUST use a recognizable search icon and expose the accessible name "Find
  events" without relying on icon appearance alone.
- **FR-003**: Activating search MUST open one full-viewport modal overlay containing a prominent, initially
  blank search field.
- **FR-004**: Overlay MUST move focus to the search field on open, trap focus while open, support Close,
  Escape, and backdrop dismissal, and restore focus to the trigger after dismissal.
- **FR-005**: Empty search field MUST rotate the three supplied example searches every 2–3 seconds without
  changing the field value.
- **FR-006**: System MUST search active public and private events by case-insensitive middle-of-word partial
  match against title, description, and location.
- **FR-007**: Search eligibility MUST be enforced at the server boundary; active public and private events
  are discoverable, while unlisted and archived events never appear in results or counts.
- **FR-008**: Empty or whitespace-only input MUST NOT return all events.
- **FR-009**: Search MUST begin after a short typing pause and MUST ignore stale responses after the query
  changes or the overlay closes.
- **FR-010**: Each result MUST identify event title and provide enough available description/location
  context to distinguish similar events; private results MUST omit location and show private visibility.
- **FR-011**: Results MUST use stable relevance ordering, with stronger title matches before equivalent
  description/location matches and a deterministic tie-breaker.
- **FR-012**: Initial and subsequent result pages MUST contain at most 20 events.
- **FR-013**: Reaching the end of currently loaded results MUST request the next page when available and
  MUST avoid duplicate events or duplicate page loads.
- **FR-014**: Overlay MUST present explicit idle, initial-loading, additional-loading, no-results,
  end-of-results, and retryable-error states.
- **FR-015**: Selecting a result MUST close search and navigate to the normal event details route, where
  authenticated host identity is evaluated before choosing the host, public, or private-summary projection.
- **FR-016**: Search-origin navigation MUST NOT grant or imply owner, participant, voter, or administrative
  access.
- **FR-017**: Search field, results, controls, and status updates MUST be operable and understandable using
  keyboard navigation and assistive technology.
- **FR-018**: Overlay MUST remain usable at 320 CSS pixels, short landscape heights, and 200% zoom without
  horizontal page scrolling or hidden primary actions.
- **FR-019**: Reduced-motion preferences MUST disable nonessential animated transitions while preserving
  placeholder meaning and all functionality.
- **FR-020**: Search operations MUST record privacy-safe diagnostics containing outcome, duration, result
  count, page, and correlation information without logging raw queries, credentials, tokens, or personal
  data.
- **FR-021**: Existing header navigation, authentication actions, event owner pages, and direct public event
  links MUST remain compatible.
- **FR-022**: Every event MUST have visibility `PUBLIC`, `PRIVATE`, or `UNLISTED` and lifecycle status
  `ACTIVE` or `ARCHIVED`.
- **FR-023**: Only event host MUST be allowed to change visibility or archive event.
- **FR-024**: Existing events and newly created events MUST default to `PUBLIC` and `ACTIVE`.
- **FR-025**: Active public and private events MUST be searchable; active unlisted and all archived events
  MUST not be searchable.
- **FR-026**: Non-host private-event projection MUST disclose only public ID, title, description, visibility,
  lifecycle status, detail-access indicator, and category/participant/entry counts.
- **FR-027**: Non-host private-event response MUST omit location, photo, categories, entries, participants,
  voting capability, and every owner-only field or action through a dedicated private-summary response
  projection. This projection MUST be derived at read time from the existing Event record and MUST NOT
  duplicate event data in persistence.
- **FR-028**: Private-event UI MUST show Entries, Participants, and Results navigation labels plus a clear
  private-event notice, but MUST not reveal protected content or allow voting.
- **FR-029**: Event host MUST retain full access to their active private event.
- **FR-030**: Active unlisted events MUST remain available through direct public link with normal public
  details.
- **FR-031**: Archival MUST require host confirmation, be irreversible, remove event from search, deny
  non-host reads, and leave host a read-only historical view.
- **FR-032**: All event mutations MUST reject archived events except operations explicitly designed to read
  archival history.
- **FR-033**: Every successful or denied visibility change and archival attempt MUST create an immutable
  audit/domain event containing actor identity when known, event identity, action, outcome, prior state,
  requested/new state when applicable, reason code, correlation identifier, and timestamp without storing
  protected event content.

### Key Entities

- **Event Search Query**: Visitor-entered discovery phrase, normalized for matching but not retained as a
  user profile or logged in raw form.
- **Event Search Result**: Discovery projection containing public route identity, title, optional
  description, visibility, and public-only optional location.
- **Search Page**: Ordered result subset with continuation state and indication of whether more matches
  exist.
- **Event**: Existing event record whose current access and lifecycle state determines search eligibility.
- **Event Visibility State**: Host-controlled public, private, or unlisted discovery/direct-view policy.
- **Event Lifecycle State**: Active or irreversibly archived event state.
- **Event Detail Access**: Viewer-aware server decision returning the existing Event projection for full
  host/public access, a read-time private-summary projection for a non-host private view, an archived host
  read-only projection, or no disclosure.

### Ownership and Access

- Search is available anonymously and to authenticated users.
- Search results contain only title, description, location, visibility, and public route identity.
- Event hosts do not receive broader search results than anonymous visitors.
- Existing event ownership controls remain unchanged; search grants no mutation rights, but the normal
  event-details request returns the full host view whenever the authenticated viewer owns the event.
- Server decides event discoverability and result fields for every request.
- Host alone changes visibility or archives event.
- Private summary and archived access are enforced server-side, never only by hidden UI.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of valid searches show the first matching result page within 1 second under
  normal operating conditions.
- **SC-002**: Visitors can open search, find a known event, and reach its viewer-appropriate details in under 30
  seconds on desktop and mobile.
- **SC-003**: Partial terms from title, description, or location find the expected eligible event in 100%
  of defined acceptance fixtures, while any fixture ineligible for public view appears 0% of the time.
- **SC-004**: Every matching event appears at most once while a visitor loads multiple pages.
- **SC-005**: 100% of tested signed-in and signed-out header states expose the same Find Events capability.
- **SC-006**: All critical search actions are completable at 320 CSS pixels and 200% zoom using keyboard
  only, with no horizontal page scrolling.
- **SC-007**: Search diagnostics contain 0 raw search phrases and 0 personal identifiers in automated
  privacy checks.
- **SC-008**: Existing critical event, authentication, voting, setup, and public-view flows retain passing
  regression coverage.
- **SC-009**: Public and private fixtures appear in 100% of matching searches; unlisted and archived fixtures
  appear in 0%.
- **SC-010**: Non-host private-event responses expose 0 protected detail values across contract and
  integration fixtures.
- **SC-011**: 100% of non-host visibility/archive mutations are denied and 100% of archived event mutations
  are denied.
- **SC-012**: 100% of successful and denied visibility/archive attempts produce exactly one immutable,
  privacy-safe audit/domain event in integration fixtures.

### Critical User Flows *(mandatory)*

- **CUF-001**: Signed-out visitor opens Find Events, searches by partial title, selects a result, and reaches
  viewer-appropriate event details.
- **CUF-002**: Signed-in visitor searches by partial description or location, loads another result page,
  selects an event, and receives the full host view when they own it or the visitor projection otherwise.
- **CUF-003**: Visitor searches for text shared by public, private, unlisted, and archived fixtures and
  receives only active public/private results, then opens a private result and sees only its summary.
- **CUF-004**: Keyboard-only visitor opens, uses, scrolls, retries, and dismisses search with focus restored.
- **CUF-005**: Host changes event visibility, confirms permanent archival, and verifies archived event is
  host-only read-only and absent from search.

## Assumptions

- Active public and private events are discoverable; unlisted events remain direct-link-only.
- Private visibility restricts event-detail disclosure, not voting-rule configuration or future participant
  self-registration policy.
- Archived events retain database history permanently and cannot be restored.
- Search requires at least two alphanumeric characters after normalization rather than providing a
  browse-all catalog.
- Result page size is 20 events.
- Relevance prioritizes title matches, then description and location matches, with deterministic ordering
  for equivalent matches.
- Partial matching includes middle-of-word substrings.
- Search starts after a brief typing pause appropriate for responsive type-ahead behavior.
- Placeholder examples rotate approximately every 2.5 seconds only while the field is empty.
- Overlay resets query and results after closing.
- Public event title, description, and location are approved for display in search results.
