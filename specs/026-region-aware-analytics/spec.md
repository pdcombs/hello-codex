# Feature Specification: Cookieless Analytics Measurement

**Feature Branch**: `026-region-aware-analytics`

**Created**: 2026-09-09

**Status**: Ready for planning

**Input**: User description: "Prompt everyone for cookie consent, but send page views, button actions, and unhappy-path events regardless of cookie acceptance."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Cookie Choice (Priority: P1)

Every first-time visitor sees same cookie prompt regardless of country and can accept or decline without losing site access.

**Why this priority**: Avoids unreliable country guessing and gives every visitor clear control.

**Independent Test**: Open site in fresh browsers representing multiple countries and unknown location; verify same prompt, equal Accept and Decline choices, and fully usable site.

**Acceptance Scenarios**:

1. **Given** visitor has no saved preference, **When** site opens, **Then** analytics storage starts denied and cookie prompt appears regardless of country.
2. **Given** visitor accepts, **When** choice is saved, **Then** analytics storage becomes granted and prompt closes.
3. **Given** visitor declines, **When** choice is saved, **Then** analytics storage remains denied, prompt closes, and site remains fully usable.
4. **Given** visitor previously chose, **When** visitor returns, **Then** saved choice is honored without prompting again.

---

### User Story 2 - Measure Activity Without Cookies (Priority: P1)

Site operator receives aggregate page views, button actions, and unhappy-path measurements before consent choice and after decline, without analytics cookies.

**Why this priority**: Preserves broad product-usage visibility while respecting storage choice.

**Independent Test**: In fresh and declined sessions, navigate routes, activate buttons, and encounter safe errors; verify normalized measurements are sent while analytics cookies remain absent.

**Acceptance Scenarios**:

1. **Given** visitor has not chosen, **When** visitor navigates or activates enabled buttons, **Then** normalized events remain eligible for cookieless measurement.
2. **Given** visitor declined, **When** visitor navigates, activates buttons, or encounters an unhappy path, **Then** corresponding sanitized measurements continue without analytics storage.
3. **Given** visitor accepts, **When** same actions occur, **Then** measurements use granted analytics storage.
4. **Given** storage is denied, **When** operator reviews reporting, **Then** reporting limitations are documented and no promise of exact unique visitor/session counts is made.

---

### User Story 3 - Change Preference (Priority: P2)

Visitor can change cookie preference later from footer, immediately changing storage behavior without changing which safe events application records.

**Why this priority**: Preference must remain reversible.

**Independent Test**: Decline, reopen preferences, accept, then reverse again; verify storage state changes immediately and safe measurement continues throughout.

**Acceptance Scenarios**:

1. **Given** visitor chose either option, **When** preferences reopen from footer, **Then** visitor can choose other option.
2. **Given** preference changes, **When** next event occurs, **Then** event uses new storage consent state without reload.

### Edge Cases

- Preference storage is unavailable or corrupted.
- Analytics tag is blocked, delayed, offline, or unavailable.
- Visitor rapidly changes preference or navigates before choosing.
- Same action is observed by local and global tracking.
- Button text or error details contain PII, IDs, voting codes, ballots, or user-authored content.
- Browser clears local storage, returning visitor to undecided state.

## Scope Boundaries *(mandatory)*

### In Scope

- Cookie prompt for every first-time visitor regardless of location.
- Analytics storage denied before choice and after Decline.
- Cookieless normalized page-view, button-action, and unhappy-path measurement before choice and after Decline.
- Stored Accept or Decline preference and footer control.
- Privacy notice explaining cookieless measurement and reduced reporting precision.
- Verification that existing privacy sanitization applies identically in every consent state.

### Out of Scope

- Country or region detection.
- Automatic acceptance or default-granted analytics storage based on location.
- Legal determination of consent obligations or final legal approval.
- Advertising consent, personalization, remarketing, or sale/share opt-outs.
- Precise geolocation, fingerprinting, or circumventing privacy tools and blockers.
- Exact unique visitor/session counts when analytics storage is denied.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every first-time visitor MUST see cookie prompt regardless of country or region.
- **FR-002**: Analytics storage MUST default to denied before visitor chooses.
- **FR-003**: Accept MUST grant analytics storage; Decline MUST keep analytics storage denied.
- **FR-004**: System MUST remember explicit choice in current browser and suppress prompt on later visits.
- **FR-005**: Visitor MUST be able to reopen preferences from footer and change choice immediately.
- **FR-006**: Page views, enabled-button actions, and unhappy paths MUST remain eligible for cookieless measurement before choice and after Decline.
- **FR-007**: Denied analytics storage MUST prevent analytics cookies and app identifiers from being read or written.
- **FR-008**: Existing route, action, error, PII, voting-data, query, token, and identifier sanitization MUST apply equally to stored and cookieless events.
- **FR-009**: Advertising storage, advertising user data, and advertising personalization MUST remain denied regardless of choice.
- **FR-010**: Application MUST NOT infer location from IP address, language, timezone, browser, or device.
- **FR-011**: Cookie choice or analytics failure MUST NOT block or reduce application functionality.
- **FR-012**: Analytics tag blocking, network failure, or offline mode MUST NOT produce user-visible application errors.
- **FR-013**: Duplicate prevention MUST record one event per route transition, button activation, or user-visible failure.
- **FR-014**: Privacy notice MUST explain that cookieless measurements are sent before choice and after Decline, describe their purpose, and disclose reduced visitor/session precision.
- **FR-015**: Analytics reporting guidance MUST distinguish measured events from potentially modeled or less precise visitor/session totals.

### Key Entities

- **Analytics Preference**: `undecided`, `accepted`, or `declined` browser-scoped state.
- **Cookieless Measurement**: Sanitized event sent with analytics storage denied and without analytics identifiers.
- **Normalized Analytics Event**: Approved page, action, or failure description without prohibited values.

### Ownership and Access

- Visitor owns browser preference and may change it at any time.
- Site operator sees aggregate reporting only.
- No consent state grants access to event, account, participant, entry, code, or ballot data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of fresh-session tests show prompt with analytics storage denied before choice.
- **SC-002**: 100% of Accept and Decline tests update and remember correct storage state.
- **SC-003**: Page, button, and unhappy-path measurements remain observable in undecided and declined sessions with zero analytics cookies.
- **SC-004**: 100% of sensitive-data tests observe zero prohibited values in stored and cookieless events.
- **SC-005**: Site remains fully usable when cookie storage, analytics script, or network is unavailable.
- **SC-006**: Duplicate tests observe exactly one record per route transition, activation, or failure.

### Critical User Flows *(mandatory)*

- **CUF-001**: Fresh visitor sees prompt, declines, navigates, clicks buttons, and generates cookieless sanitized measurements.
- **CUF-002**: Visitor accepts, later changes to Decline from footer, and site measurement continues under denied storage.
- **CUF-003**: Analytics is blocked while visitor completes normal application flow without disruption.

## Assumptions

- Advanced consent measurement supports event pings while analytics storage is denied.
- Cookieless measurements support aggregate usage analysis, but unique visitor and session totals may be modeled or less precise.
- Consent UI and privacy notice remain product drafts pending owner/legal review.
- Country-aware behavior can be reconsidered later after trusted infrastructure and legal guidance exist.
