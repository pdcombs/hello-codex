# Feature Specification: Event Details and Voting Summary

**Feature Branch**: `main`

**Created**: 2026-08-26

**Status**: Ready for task generation

**Input**: Allow hosts to edit event title, description, and location; show voting schedule, access rules, and event-wide voting method on event pages; remove active per-category voting-method controls; and present the completed-account option as a polished toggle.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Event Details (Priority: P1)

An event host edits the event title, description, and location from Event Settings so visitors always see accurate event information without recreating the event.

**Why this priority**: Incorrect core event details currently cannot be corrected after creation and directly affect discovery and visitor understanding.

**Independent Test**: A host changes all three fields, saves, reloads the settings and event pages, and sees the new values everywhere while a non-host cannot make the same change.

**Acceptance Scenarios**:

1. **Given** an active host-owned event, **When** the host opens Event Settings, **Then** title, description, and location fields contain the current saved values.
2. **Given** valid changes to one or more event-detail fields, **When** the host saves, **Then** the changed values appear on the event page, host dashboard, and eligible search results.
3. **Given** a host clears the optional description or location and saves, **Then** that value is removed and its empty display row is omitted from the event page.
4. **Given** an anonymous visitor or non-host, **When** they attempt to change event details by any route, **Then** the change is denied and the saved event remains unchanged.
5. **Given** an archived event, **When** its host opens Event Settings, **Then** event details remain visible but cannot be edited.
6. **Given** another host update was saved after the page loaded, **When** the stale page attempts to save, **Then** the newer data is not overwritten and the host is prompted to reload.

---

### User Story 2 - Understand When and How to Vote (Priority: P1)

Hosts and visitors see a concise voting summary directly below the event description and location. The summary states the configured voting window, who may vote, and how ballots work using language appropriate to the viewer.

**Why this priority**: Voters need the rules before interacting with a ballot, and hosts need a quick confirmation that their configuration communicates the intended experience.

**Independent Test**: Configure each access policy and voting method, view the event as host and public visitor, and verify the schedule and exact matching summary sentence for each audience.

**Acceptance Scenarios**:

1. **Given** both voting opening and closing times are configured, **When** any eligible viewer opens the main event page, **Then** both times appear below the description and location in the viewer's local time with an unambiguous timezone.
2. **Given** voting-code access, **When** the host views the event, **Then** the summary says “Voters need a code to vote.”
3. **Given** voting-code access, **When** a public or non-host viewer views the event, **Then** the summary says “This event requires a registered code to vote.”
4. **Given** account-required access, **When** the host views the event, **Then** the summary says “Voters need a completed account to vote.”
5. **Given** account-required access, **When** a public or non-host viewer views the event, **Then** the summary says “You need a completed account to vote in this event.”
6. **Given** anyone-with-link access, **When** the host views the event, **Then** the summary says “Anyone with the event link can vote.”
7. **Given** anyone-with-link access, **When** a public or non-host viewer views the event, **Then** the summary says “Anyone with this event link can vote.”
8. **Given** a configured event-wide voting method, **When** the event page loads, **Then** the access sentence is followed by the audience-appropriate instruction: hosts see “Voters choose one entry in each category,” “Voters choose [minimum]–[maximum] entries in each category,” or “Voters rank all entries in each category”; public viewers see the corresponding direct instruction beginning with “Choose” or “Rank.”
9. **Given** a private event viewed by a non-host, **When** protected details are minimized, **Then** the voting schedule and rule summary are not disclosed.

---

### User Story 3 - Configure One Voting Method Per Event (Priority: P2)

An event host selects one voting method that governs every active category, avoiding contradictory category-level configuration.

**Why this priority**: A single event-level choice makes ballot behavior easier for hosts to configure and voters to understand.

**Independent Test**: Select each supported event-wide method, save and reload it, and verify every category uses that method with no category-specific method controls available.

**Acceptance Scenarios**:

1. **Given** an event with multiple categories, **When** the host opens voting rules, **Then** exactly one voting-method control is available for the whole event and no category-specific method controls appear.
2. **Given** the host changes the event-wide method, **When** the change is saved, **Then** every active category uses the selected method for future ballots.
3. **Given** the host selects multiple-choice voting, **When** the method is configured, **Then** one event-wide minimum and maximum selection range applies to every category.
4. **Given** legacy category-specific methods exist, **When** this feature becomes active, **Then** they no longer affect ballots or appear as editable controls, and their historical values are retained for possible future restoration.
5. **Given** a category is added after method configuration, **When** voting occurs, **Then** the new category automatically uses the current event-wide method.

---

### User Story 4 - Configure Code Account Requirement Clearly (Priority: P3)

When code-based voting is selected, the host uses a clearly labeled toggle to decide whether voters must also have a completed account.

**Why this priority**: The current checkbox is visually weak and makes an important eligibility choice easy to overlook.

**Independent Test**: Use the toggle with keyboard, pointer, and touch; save both states; reload; and confirm its label, state, focus, and dependent account-limit field remain clear.

**Acceptance Scenarios**:

1. **Given** code-based access is selected, **When** the rules form appears, **Then** “Require completed account” is presented as an accessible toggle with visible on/off state and explanatory text.
2. **Given** the toggle receives keyboard focus, **When** the host activates it, **Then** its state changes and remains visibly focused.
3. **Given** the toggle is on, **When** the form renders, **Then** the ballots-per-account control is available; when off, that dependent control is omitted.
4. **Given** either toggle state is saved, **When** the host reloads Event Settings, **Then** the saved state is restored.

### Edge Cases

- Title contains only whitespace, exceeds its supported length, or includes characters that require safe display handling.
- Description or location is cleared, contains leading or trailing whitespace, or reaches its supported maximum length.
- A save loses connectivity, is submitted twice, or conflicts with a newer host edit.
- Updating title, description, or location changes discovery text without changing the event's stable link.
- Voting opening or closing time is absent, invalid, reversed, equal, or falls across a daylight-saving transition.
- A viewer's locale or timezone differs from the host's timezone.
- An event is archived between loading and saving its settings.
- Event-wide multiple-choice bounds cannot be satisfied by one or more active categories at voting time.
- Dormant legacy category rules reference categories that were later archived or removed.
- Voting rules are changed while an event page is already open; the next reload reflects the authoritative summary.
- Summary text remains understandable with large text, narrow screens, assistive technology, and no color perception.

## Scope Boundaries *(mandatory)*

### In Scope

- Host-only editing of event title, description, and location from Event Settings.
- Validation, concurrency protection, persistence, auditing, and immediate propagation of event-detail changes.
- A voting-information block on eligible main event pages below description and location.
- Viewer-local display of configured opening and closing times with timezone clarity.
- Audience-specific access-policy sentences for code, account, and anyone-with-link voting.
- Audience-specific event-wide voting-method sentences for choose-one, choose-multiple, and rank-all voting.
- One active voting method and, where applicable, one selection range for the whole event.
- Removal of category-specific voting-method controls and effects while retaining prior category-rule history.
- An accessible, visually polished completed-account toggle for code-based voting.

### Out of Scope

- Editing an event's stable link, host, registration policy, visibility behavior, photo, categories, or entries through the new detail form.
- Per-category voting-method configuration or mixed methods within one event.
- Restoring or editing dormant category-specific rules in the current interface.
- Redesigning ballot submission, vote counting, winners, results, code inventory, or repeat-voting policy.
- Adding reminders, calendar integration, countdown timers, or host-selectable display wording.
- Displaying protected voting details in a private-event summary.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Event Settings MUST show the current title, description, and location to the event host in editable fields for active events.
- **FR-002**: Only the event host MUST be allowed to save event-detail changes; all other attempts MUST be denied at the authoritative boundary.
- **FR-003**: Title MUST be required after trimming, while description and location MUST be optional and removable.
- **FR-004**: Event-detail fields MUST use the same length and content rules as event creation so a value accepted at creation remains valid during editing.
- **FR-005**: A successful detail save MUST update all subsequent authorized event-detail, host-dashboard, and search views without changing the event's stable identifier or link.
- **FR-006**: Detail saves MUST reject stale updates without overwriting newer changes and MUST provide an actionable recovery message.
- **FR-007**: Archived events MUST remain read-only, including their title, description, and location.
- **FR-008**: Successful event-detail changes and denied unauthorized attempts MUST produce auditable records containing actor, event, changed field names, outcome, and time without duplicating sensitive field contents in logs.
- **FR-009**: Eligible main event views MUST place one voting-information block after the event description and location and before category or ballot content.
- **FR-010**: When both voting opening and closing instants are configured, the block MUST show both in viewer-local date/time form and identify the applicable timezone; it MUST not show a misleading partial window when either instant is unavailable.
- **FR-011**: The voting-information block MUST derive its access statement from the authoritative active access policy and use the exact audience-specific wording defined in User Story 2.
- **FR-012**: The block MUST derive its method statement from the authoritative active event-wide method and use the audience-specific wording defined in User Story 2, including the configured minimum and maximum for multiple-choice voting.
- **FR-013**: Host wording MUST be used only for the event host; public wording MUST be used for anonymous and signed-in non-host viewers.
- **FR-014**: A private-summary viewer MUST NOT receive the voting schedule, access policy, voting method, selection bounds, or completed-account setting.
- **FR-015**: Every event MUST resolve future ballots through exactly one active event-wide method: choose one, choose multiple, or rank all.
- **FR-016**: The host MUST have exactly one voting-method control for the event and MUST NOT have an active category-specific method control.
- **FR-017**: When choose-multiple is selected, one event-wide minimum and maximum MUST apply consistently to every active category, and the host MUST be prevented from opening voting while any category cannot satisfy those bounds.
- **FR-018**: A category created after event-wide method configuration MUST inherit the active event-wide behavior without additional host setup.
- **FR-019**: Existing category-specific voting rules MUST become dormant: they MUST NOT affect new ballots or be exposed for editing, but MUST be retained without destructive rewriting so a future feature may restore category-level configuration.
- **FR-020**: Changing the event-wide method MUST apply prospectively to future ballot validation and MUST NOT rewrite previously accepted ballot records.
- **FR-021**: For code-based access, the completed-account setting MUST be presented as a toggle with a persistent text label, clear on/off state, explanatory text, visible keyboard focus, and operability by keyboard, pointer, and touch.
- **FR-022**: The completed-account toggle MUST preserve the current eligibility meaning, saved value, and relationship to ballots-per-account configuration.
- **FR-023**: All new settings and summary content MUST remain usable without horizontal scrolling at 320 CSS pixels, at 200% text zoom, and with reduced-motion preferences.
- **FR-024**: Event-detail and voting-rule reads and saves MUST provide clear loading, success, validation, conflict, and service-failure states.
- **FR-025**: Existing event visibility, archival, photo, category, entry, participant, access-code, and ballot-integrity behavior MUST remain compatible except for the explicitly replaced category-method behavior.

### Key Entities

- **Event Details**: Host-owned title, optional description, optional location, stable event identity, lifecycle state, and last-update state.
- **Event Voting Rules**: Event-owned opening and closing instants, voter access policy, completed-account requirement, repeat/submission limits, one active event-wide method, optional multiple-choice bounds, version, and effective time.
- **Dormant Category Voting Rule**: Preserved historical category-specific method and bounds that are inactive for current ballots and unavailable for current editing.
- **Voting Information Summary**: Viewer-specific presentation derived from event details and active voting rules; contains schedule, access statement, and method statement but is not independently editable data.

### Ownership and Access

- The event host owns event details and voting rules and may edit them only while the event is active.
- Anonymous and signed-in non-host viewers may read only the event details and voting summary allowed by the event's visibility and detail-access rules.
- Private-summary viewers cannot read the voting information protected by this feature.
- Dormant category voting rules remain event-owned and unavailable for public viewing or current host editing.
- The authoritative service decides edit permission, lifecycle restrictions, active voting rules, and viewer-specific disclosure regardless of interface visibility.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of hosts in usability validation can change title, description, and location and verify the result on the event page in under two minutes without assistance.
- **SC-002**: 100% of tested event views show the correct schedule, access sentence, and method sentence for the active rules and viewer role.
- **SC-003**: 100% of tested categories enforce the single event-wide method after rule changes, category creation, page reloads, and concurrent access.
- **SC-004**: 100% of unauthorized, archived, and stale event-detail save attempts leave the previously authoritative values unchanged.
- **SC-005**: At least 90% of first-time viewers in comprehension testing can correctly state when voting occurs, who may vote, and how to complete a ballot after reading the summary.
- **SC-006**: All critical settings and summary interactions are completable at 320 CSS pixels, 200% text zoom, and by keyboard alone with no loss of information or function.
- **SC-007**: Event pages display saved detail and voting-summary changes within two seconds for at least 95% of normal user loads.
- **SC-008**: Existing event-management and voting critical flows complete with no regression other than intentional removal of category-specific method selection.

### Critical User Flows *(mandatory)*

- **CUF-001**: Host edits event title, description, and location, saves, and verifies the updated event page and discovery result.
- **CUF-002**: Host configures each access policy and event-wide method, then verifies the host-facing schedule and rule summary.
- **CUF-003**: Anonymous or signed-in non-host opens an eligible event and sees the correct public schedule and rule summary without host-only data.
- **CUF-004**: Host selects one event-wide method for a multi-category event and every category enforces it in the voter ballot.
- **CUF-005**: Host changes the completed-account toggle using keyboard and touch, saves, reloads, and sees the correct dependent controls and state.
- **CUF-006**: Non-host, archived-event, and stale-client edit attempts are rejected without changing authoritative data.

## Assumptions

- Existing event-creation validation defines the accepted lengths and content for title, description, and location.
- Event title changes do not change the event's public identifier or direct link.
- Voting schedules are stored as absolute instants; viewers see them in their own locale and timezone with a timezone label.
- Both opening and closing instants are required by the current voting-rules model; the summary treats them as one complete schedule.
- “Account required” means the currently defined completed-account eligibility, including the account details already required by voting rules.
- “Registered code” uses the user's requested public wording and refers to a valid event-issued voting code, not a code registered to a specific person.
- Event-wide multiple-choice minimum and maximum values apply uniformly; voting cannot open while an active category lacks enough entries to satisfy them.
- Dormant category-rule values are retained for reversibility but have no effect on current voter eligibility, ballot shape, or summary wording.
- The existing visibility and viewer-specific detail projection remain the source of truth for whether event information may be disclosed.
