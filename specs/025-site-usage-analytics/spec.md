# Feature Specification: Site Usage Analytics and Privacy

**Feature Branch**: `025-site-usage-analytics`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "Add production-only Google Analytics for visitors, coarse location, browser, normalized route page views, all button actions, and user-visible error/unhappy-path events. Strip PII, use readable event descriptions, and add site footer, privacy policy, and analytics consent controls."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand Site Visits (Priority: P1)

Site operator can review visitor, session, browser, coarse geographic, and normalized page-view trends for production traffic without exposing event identifiers or personal data.

**Why this priority**: Basic traffic visibility shows whether product is being discovered and which areas receive use.

**Independent Test**: Visit production routes through both domains and client-side navigation, then verify one readable page view per navigation with normalized route and non-identifying browser/geography dimensions.

**Acceptance Scenarios**:

1. **Given** visitor opens production site, **When** page becomes active, **Then** visit and page view are available in analytics reporting.
2. **Given** visitor navigates within single-page app, **When** route changes without full reload, **Then** exactly one new page view is recorded.
3. **Given** visitor opens `/events/ABC123/results`, **When** page view is recorded, **Then** route is `/events/:eventId/results`, with event identifier and query values omitted.
4. **Given** visitor opens root short link `/myevent`, **When** alias route is recorded, **Then** route is `/:shortLink`, with alias omitted.
5. **Given** app runs locally, in tests, or on non-production host, **When** pages load or navigation occurs, **Then** no production analytics data is sent.

---

### User Story 2 - Understand User Actions and Problems (Priority: P1)

Site operator can review all button interactions and normalized errors or unhappy paths using stable plain-English descriptions, without receiving labels or details containing user data.

**Why this priority**: Action and failure counts reveal which workflows users attempt and where they struggle.

**Independent Test**: Exercise representative static-label, dynamic-label, success, validation, authorization, not-found, and service-failure flows; verify readable sanitized events and absence of raw data.

**Acceptance Scenarios**:

1. **Given** visitor activates button with safe static label `Open voting`, **When** action is recorded, **Then** analytics identifies action as `Open voting` and normalized route.
2. **Given** button label contains event title, entry name, email, code, identifier, or other user content, **When** action is recorded, **Then** analytics uses predefined generic action name instead of literal label.
3. **Given** visitor encounters validation failure, permission denial, missing resource, conflict, network failure, or unexpected application error, **When** failure becomes user-visible, **Then** one readable normalized unhappy-path event is recorded.
4. **Given** error contains raw message, stack trace, request body, URL parameters, voting code, account data, or identifiers, **When** event is recorded, **Then** prohibited details are omitted.
5. **Given** analytics service is unavailable or blocked, **When** visitor uses app, **Then** application behavior and error handling continue normally.

---

### User Story 3 - Understand and Control Analytics Privacy (Priority: P1)

Visitor can understand analytics data practices, make consent choice, and later change that choice through accessible controls available throughout site.

**Why this priority**: Analytics collection must be transparent and respect visitor choice.

**Independent Test**: Visit in new browser, review consent notice and privacy page, accept or decline, revisit site, and change preference from footer; verify collection behavior matches current choice.

**Acceptance Scenarios**:

1. **Given** visitor has no stored analytics preference, **When** site loads, **Then** analytics storage defaults denied, permitted cookieless measurement begins, and accessible consent UI explains analytics purpose with equally clear accept and decline actions.
2. **Given** visitor accepts analytics, **When** navigating later in same browser, **Then** choice is remembered and analytics storage is enabled.
3. **Given** visitor declines analytics, **When** navigating later in same browser, **Then** choice is remembered, analytics storage remains denied, and only permitted cookieless measurements continue.
4. **Given** visitor changes preference through footer, **When** new choice is saved, **Then** future analytics behavior changes immediately without affecting core app use.
5. **Given** visitor opens any public or authenticated route, **When** page renders, **Then** footer provides Privacy link and analytics preference control.
6. **Given** visitor opens Privacy page, **When** reading notice, **Then** it explains collected categories, purposes, analytics provider, cookieless pre-consent measurement, consent controls, retention/configuration disclosure, data not collected, and placeholder privacy contact.

### Edge Cases

- Initial load plus route initialization must not create duplicate page views.
- Redirect chains, including short-link redirect and sign-in return route, must not expose raw aliases, event identifiers, tokens, or query strings.
- Rapid double-clicks may be separate genuine actions; one browser activation must never create duplicate events.
- Buttons containing only icons use stable accessible action names; unnamed buttons use safe generic fallback and are flagged for accessibility remediation.
- Nested elements inside button must resolve to parent button once.
- Programmatic button activation and keyboard activation are counted; disabled controls are not.
- Errors repeated during one failed operation must not be double-counted by both local handler and global boundary.
- Consent storage unavailable or corrupted returns visitor to undecided state without breaking app.
- Analytics blockers, offline mode, script failure, and delayed analytics load never delay or break navigation, voting, or account flows.
- Coarse geographic reporting comes from analytics provider; app never requests device location permission or transmits precise coordinates.
- Browser reporting comes from normal analytics service capabilities; app sends no custom fingerprint.

## Scope Boundaries *(mandatory)*

### In Scope

- Production analytics for `votiy.com` and `www.votiy.com` using measurement identifier `G-3KJEB4ZGRH`.
- Visitor, session, page-view, browser, and provider-derived coarse geographic reporting.
- Exactly-once page views for initial loads and client-side navigation.
- Normalized route patterns with query strings, fragments, event identifiers, short aliases, tokens, and codes removed.
- All enabled button activations mapped to safe stable plain-English action descriptions.
- Normalized client-visible errors and unhappy paths.
- Global unexpected client error coverage without stack traces or raw messages.
- PII and sensitive voting-data exclusion at collection boundary.
- Site-wide footer, Privacy page, analytics consent UI, remembered preference, and preference reopening.
- Clear behavior when analytics is blocked or unavailable.

### Out of Scope

- Advertising, remarketing, personalization, Google Signals, ad conversion tracking, or cross-site profiling.
- Sending user IDs, emails, names, phone numbers, event titles, entry titles, participant data, voting codes, ballots, raw identifiers, exact coordinates, IP addresses as custom fields, request bodies, raw errors, or stack traces.
- Server-side analytics, backend log replacement, performance monitoring, session replay, heatmaps, or screen recording.
- Tracking text-field contents, form values, selections, keystrokes, uploaded files, or copied data.
- Per-event popularity reporting based on raw event ID or short alias.
- Analytics administration dashboard inside Votiy.
- Final legal approval of privacy notice; owner/legal reviewer remains responsible before production use.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Analytics MUST operate only on exact production hosts `votiy.com` and `www.votiy.com`.
- **FR-002**: Analytics MUST use configured production measurement property identified as `G-3KJEB4ZGRH`.
- **FR-003**: System MUST record one page view for initial production page load and exactly one for each completed client-side route navigation.
- **FR-004**: Page-view records MUST include normalized route, safe page title, and no query string or fragment.
- **FR-005**: Dynamic event route identifiers MUST normalize to `:eventId`; root short aliases MUST normalize to `:shortLink`; token-like route values MUST never be transmitted.
- **FR-006**: System MUST support visitor, session, browser-family, device-class, and provider-derived country/region/city aggregate reporting without custom fingerprinting or device-location permission.
- **FR-007**: Every enabled button activation MUST record one button-action event containing normalized route and stable safe action description.
- **FR-008**: Button tracking MUST use literal label only when label comes from approved static application copy; dynamic or user-authored labels MUST map to approved generic action description.
- **FR-009**: Button-action descriptions and unhappy-path descriptions MUST be plain English and understandable without source-code knowledge.
- **FR-010**: System MUST record normalized events for user-visible validation failures, authentication requirements, authorization denials, conflicts, not-found states, rate limits, network/service failures, and unexpected client errors.
- **FR-011**: Error analytics MUST use approved category and safe operation description; raw error messages, stack traces, response bodies, correlation IDs, request variables, and user data MUST NOT be sent.
- **FR-012**: Analytics collection boundary MUST reject or sanitize emails, phone numbers, names, event/entry/participant titles, voting codes, ballots, public/internal identifiers, token values, query values, and free-form user content.
- **FR-013**: Analytics loading, recording, and failures MUST be non-blocking and MUST NOT change functional app behavior.
- **FR-014**: Development, preview, automated-test, localhost, and legacy hosting traffic MUST send zero events to production analytics property.
- **FR-015**: Production analytics MUST use advanced consent behavior: load immediately with analytics storage denied by default and permit cookieless measurements before a visitor chooses.
- **FR-016**: First-time visitor MUST receive accessible consent notice with plain-language purpose plus Accept analytics and Decline analytics choices of comparable prominence.
- **FR-017**: Accept analytics MUST grant analytics storage; Decline analytics MUST keep analytics storage denied while permitted cookieless measurements continue.
- **FR-018**: Advertising storage, advertising user data, and advertising personalization MUST remain denied regardless of analytics choice.
- **FR-019**: Visitor choice MUST be remembered in current browser and remain changeable through site-wide footer.
- **FR-020**: Changing consent choice MUST affect future collection immediately without requiring sign-in or page reload.
- **FR-021**: Consent refusal or analytics blocking MUST NOT reduce access to application features.
- **FR-022**: Site-wide footer MUST appear on public and authenticated pages and link to Privacy page plus analytics preference control.
- **FR-023**: Privacy page MUST describe data categories collected, purpose, provider, cookieless measurement before and after decline, high-level geographic/browser derivation, retention/configuration disclosure, consent controls, categories explicitly excluded, and placeholder contact route.
- **FR-024**: Privacy notice MUST clearly state it is product-provided draft pending owner/legal review before being treated as final legal advice.
- **FR-025**: Analytics preference UI and Privacy page MUST meet existing keyboard, focus, readable text, and mobile usability expectations.
- **FR-026**: Duplicate prevention MUST ensure same page transition, button activation, or handled failure does not produce multiple identical records from overlapping trackers.
- **FR-027**: A documented analytics event catalog MUST define every field, approved value source, normalization rule, and prohibited data class before implementation.

### Key Entities

- **Analytics Preference**: Visitor's current accept, decline, or undecided choice; browser-scoped and changeable.
- **Normalized Route**: Stable route pattern stripped of identifiers, aliases, tokens, query strings, and fragments.
- **Button Action**: One safe semantic interaction with plain-English approved description and normalized route.
- **Unhappy-Path Event**: Safe failure category and operation description without raw diagnostic or user data.
- **Privacy Notice**: Site-visible disclosure explaining analytics practices and visitor controls.
- **Analytics Event Catalog**: Governed allowlist of event types, descriptions, fields, safe value sources, and prohibited fields.

### Ownership and Access

- Visitor owns analytics preference stored in their browser and may change it without account.
- Site operator owns analytics property and aggregate reporting access.
- No analytics record grants access to event, account, participant, entry, code, or ballot data.
- Privacy page is public; analytics reporting remains outside public application.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of supported production route tests record exactly one normalized page view with zero raw identifiers, query values, or fragments.
- **SC-002**: 100% of representative button tests record one readable action; dynamic-label tests transmit zero user-authored content.
- **SC-003**: 100% of defined unhappy-path categories appear under stable readable descriptions and contain zero raw errors, request data, identifiers, codes, or PII.
- **SC-004**: Local, test, preview, and non-production host tests transmit zero production analytics events.
- **SC-005**: Accepting, declining, and changing analytics preference succeeds in under 15 seconds and never blocks core site use.
- **SC-006**: Privacy page and preference controls are reachable from 100% of tested public and authenticated routes on mobile and desktop.
- **SC-007**: Site remains fully usable when analytics script is blocked, offline, delayed by 10 seconds, or returns errors.
- **SC-008**: Within 24 hours of production deployment, operator can view visitors, sessions, normalized route page views, button actions, unhappy-path counts, browser family, device class, and available coarse geography.
- **SC-009**: Automated sensitive-data tests exercise every prohibited data class and observe zero prohibited values leaving analytics boundary.

### Critical User Flows *(mandatory)*

- **CUF-001**: New production visitor reviews consent notice, chooses preference, navigates multiple routes, and reporting follows choice without duplicate page views.
- **CUF-002**: Visitor activates safe and dynamic-label buttons; operator receives readable sanitized actions without user content.
- **CUF-003**: Visitor encounters handled and unexpected failures; app remains usable and operator receives one normalized unhappy-path record per failure.
- **CUF-004**: Visitor opens footer Privacy page, reviews analytics disclosure, returns, and changes preference.

## Assumptions

- Both production domains serve same application and analytics property.
- Provider supplies visitor/session estimation plus browser and coarse geography from ordinary request context; app requests no precise location.
- Route and event normalization prioritizes privacy over per-event popularity analysis.
- “All button clicks” means activations of enabled semantic button controls, not clicks on every link or arbitrary page element.
- Button action names use controlled static mappings when visible text could include user content.
- Privacy content is a transparent product draft, not legal advice, and needs owner/legal review.
- Consent preference is device/browser-specific and is not synchronized to user account.
- Advanced consent sends cookieless measurements while analytics storage is denied; privacy notice states this clearly.
- Advertising-related consent remains denied because advertising and personalization are out of scope.
- Existing operational logs remain authoritative for server diagnosis; analytics provides aggregate product-usage signals only.
