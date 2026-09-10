# Feature Specification: Descriptive Analytics Event Catalog

**Feature Branch**: `027-descriptive-analytics-events`

**Created**: 2026-09-10

**Status**: Ready for planning

**Input**: User description: "Centralize every Google Analytics event name in one enum-like catalog, require all tracking to reference it, and make event names identify which button was clicked or page was viewed instead of using generic names."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Complete Event Catalog (Priority: P1)

Product owner and developer can open one source-of-truth catalog and see every analytics event name the application may send.

**Why this priority**: Makes tracking understandable, auditable, and maintainable.

**Independent Test**: Review catalog, scan all analytics dispatch sites, and verify every sent event name resolves through catalog with no inline event-name strings.

**Acceptance Scenarios**:

1. **Given** analytics tracking exists, **When** owner opens central catalog, **Then** every supported page, button, and unhappy-path event name is listed in one place.
2. **Given** developer adds tracking, **When** implementation is validated, **Then** event name must reference catalog rather than define new inline string.
3. **Given** duplicate event names exist in catalog, **When** validation runs, **Then** validation fails before release.

---

### User Story 2 - Identify Actions by Event Name (Priority: P1)

Product owner can understand button activity directly from analytics event-name list without opening event parameters.

**Why this priority**: Makes Realtime and Events reports immediately readable.

**Independent Test**: Activate representative controls and verify names identify action, such as `click_open_voting_button`, while never including user-authored text or identifiers.

**Acceptance Scenarios**:

1. **Given** visitor clicks Open voting, **When** event is recorded, **Then** event name identifies Open voting button.
2. **Given** visitor clicks Vote, Accept, Decline, or Save event details, **When** each event is recorded, **Then** each has distinct readable event name.
3. **Given** button label is dynamic, unknown, or contains user content, **When** clicked, **Then** safe generic catalog event is used and raw label is not sent.

---

### User Story 3 - Identify Pages and Failures in Reports (Priority: P1)

Product owner can identify normalized pages through registered reporting dimensions and failure types directly from descriptive event names.

**Why this priority**: Speeds understanding of site traffic and problem areas.

**Independent Test**: Navigate representative routes and trigger representative safe errors; verify standard page views expose normalized page dimensions and descriptive failure names contain no raw IDs, aliases, query data, or messages.

**Acceptance Scenarios**:

1. **Given** visitor opens event results, **When** standard page view is recorded, **Then** registered page dimension identifies event-results page without event ID.
2. **Given** visitor enters short link, **When** standard page view is recorded, **Then** registered page dimension identifies short-link page without alias.
3. **Given** service-unavailable or validation failure appears, **When** event is recorded, **Then** event name identifies safe failure category without raw diagnostic data.

### Edge Cases

- Different buttons share visible label but represent same approved action.
- Button label changes during loading or contains icons only.
- Unknown/dynamic button text contains PII or voting data.
- Route contains event ID, short alias, token, query, or fragment.
- Event name exceeds provider length or character limits.
- Catalog key and provider event value become duplicated or inconsistent.
- Registered page reporting dimension is missing or renamed outside application.
- Cookieless and accepted states must use identical catalog names.

## Scope Boundaries *(mandatory)*

### In Scope

- One code-owned catalog containing every analytics event name.
- No inline event-name strings at dispatch sites.
- Standard `page_view` with centralized normalized page mappings plus descriptive names for approved button actions and safe failure categories.
- Registered page reporting dimensions so normalized page identity appears in reports without changing standard event name.
- Provider-safe lowercase names using words separated by underscores, starting with letter, no more than 40 characters.
- Safe fallback events for unknown buttons, pages, and failures.
- Automated catalog completeness, uniqueness, format, privacy, and dispatch-reference validation.
- Updated analytics documentation showing exact names.

### Out of Scope

- User-authored or raw runtime values in event names.
- Event IDs, short links, emails, codes, titles, tokens, raw URLs, or raw errors in names.
- Analytics dashboard inside Votiy.
- Renaming provider-automated events outside application control.
- Historical analytics data migration or retroactive renaming.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain one authoritative application event-name catalog.
- **FR-002**: Catalog MUST enumerate every page-view, button-action, and unhappy-path event name application can send.
- **FR-003**: Every analytics dispatch MUST resolve event name through catalog; inline event-name literals at dispatch sites are prohibited.
- **FR-004**: Catalog names MUST start with a letter, contain only lowercase letters, numbers, and underscores, and contain no more than 40 characters.
- **FR-005**: Catalog MUST reject duplicate provider event names.
- **FR-006**: Page measurement MUST retain standard `page_view`; normalized page purpose MUST use centrally cataloged safe page values without raw paths, IDs, aliases, queries, fragments, or tokens.
- **FR-007**: Button event names MUST identify approved action without raw dynamic/user-authored labels.
- **FR-008**: Failure event names MUST identify approved safe failure category without messages, stacks, responses, correlation IDs, or request values.
- **FR-009**: Unknown buttons, routes, and failures MUST use explicit safe fallback catalog names.
- **FR-010**: Page reporting MUST register normalized page parameters as reportable dimensions so route purpose can be reviewed without inspecting individual event payloads.
- **FR-011**: Event-name behavior MUST remain identical when analytics storage is accepted, declined, or undecided.
- **FR-012**: Automated validation MUST prove catalog coverage, name format, uniqueness, fallback behavior, sensitive-data exclusion, and absence of dispatch-site literals.
- **FR-013**: Developer documentation MUST list catalog location, naming rules, addition workflow, and exact current event names.
- **FR-014**: Existing production analytics MUST remain non-blocking and production-host-only.
- **FR-015**: Page measurement MUST send only standard `page_view` for each navigation and MUST NOT add duplicate descriptive companion page event.

### Key Entities

- **Analytics Event Catalog**: Authoritative mapping of semantic application event keys to provider-safe event names.
- **Page Event**: Standard page-view event carrying centrally cataloged normalized route purpose.
- **Button Event**: Descriptive event for one approved safe action.
- **Failure Event**: Descriptive event for one approved error category.
- **Fallback Event**: Safe event used when runtime input cannot map to approved specific name.

### Ownership and Access

- Product owner reviews catalog as analytics taxonomy.
- Developers extend catalog and tests together.
- Site visitors provide no content used to create new event names.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of application-sent event names are declared in one catalog and referenced without inline dispatch literals.
- **SC-002**: 100% of catalog names pass format, uniqueness, length, and privacy validation.
- **SC-003**: Representative analytics report identifies normalized page through registered page dimension and identifies approved button action or failure category directly from event name.
- **SC-004**: 100% of dynamic label/path/error tests emit no PII, identifier, code, token, alias, or user-authored content.
- **SC-005**: Existing tracking remains functional in accepted, declined, and undecided consent states.
- **SC-006**: Developer can find complete current event-name list and addition rules in under one minute.

### Critical User Flows *(mandatory)*

- **CUF-001**: Visitor navigates event pages; operator sees standard page views broken down by normalized registered page dimension.
- **CUF-002**: Visitor clicks common controls; operator sees distinct descriptive button event names.
- **CUF-003**: Visitor encounters safe failure; operator sees descriptive failure event name without sensitive details.
- **CUF-004**: Developer adds event through central catalog and automated validation rejects invalid or inline names.

## Assumptions

- Provider event names are case-sensitive and must follow supported character and length rules.
- Controlled event count remains small enough for readable reporting.
- Standard `page_view` remains required for built-in page reporting; normalized page parameters must be registered as reporting dimensions.
- Historical generic events remain in old analytics data; new naming applies prospectively.
- Unknown runtime values always prefer safe generic fallback over descriptive but risky name.
