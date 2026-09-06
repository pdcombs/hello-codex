# Feature Specification: Event Short Links

**Feature Branch**: `023-event-short-links`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Give every event a host-editable, unique root-level short URL with protected route names and redirect it to the canonical event page."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Event Through Short Link (Priority: P1)

Every event has a short link at website root. Visiting that link routes viewer to canonical event home page.

**Why this priority**: Short, memorable links make events easier to share and access.

**Independent Test**: Create event, visit root path matching default event identifier, and verify browser reaches canonical event home page with query behavior preserved.

**Acceptance Scenarios**:

1. **Given** event identifier is `12345`, **When** visitor opens `votiy.com/12345`, **Then** visitor reaches canonical `/events/12345` event page.
2. **Given** event visibility or access rules restrict details, **When** visitor uses short link, **Then** canonical event page applies existing rules unchanged.
3. **Given** unknown or unavailable short link, **When** visitor opens it, **Then** normal not-found experience appears without revealing private event data.

---

### User Story 2 - Customize Short Link (Priority: P1)

Event host edits short-link ending from settings using website prefix plus left-aligned editable field.

**Why this priority**: Memorable event names are easier to communicate than generated identifiers.

**Independent Test**: Host changes default value from `12345` to `myevent`, saves, and successfully visits `votiy.com/myevent`.

**Acceptance Scenarios**:

1. **Given** host opens settings, **When** short-link field loads, **Then** label shows `Event Short Url: Votiy.com/` and field contains current ending.
2. **Given** host enters valid available `myevent`, **When** host saves, **Then** settings show saved value and `votiy.com/myevent` routes to event.
3. **Given** non-host attempts change, **When** request reaches system, **Then** change is denied and current short link remains unchanged.
4. **Given** concurrent hosts attempt same available ending, **When** saves race, **Then** exactly one succeeds and other receives taken message.

---

### User Story 3 - Reject Unsafe or Conflicting Links (Priority: P1)

Host receives clear validation when desired ending is used, reserved, or malformed.

**Why this priority**: Root aliases must never shadow product routes or create ambiguous links.

**Independent Test**: Attempt saved event alias, protected route, mixed-case duplicate, invalid characters, and boundary lengths; verify each is handled consistently.

**Acceptance Scenarios**:

1. **Given** another event owns `myevent`, **When** host saves `MyEvent`, **Then** save fails with “This short URL is already taken.”
2. **Given** host enters `events`, `settings`, `user`, or another protected route, **When** host saves, **Then** save fails with protected-name guidance.
3. **Given** host enters uppercase letters or surrounding spaces, **When** value is accepted, **Then** stored/displayed alias is canonical lowercase form.
4. **Given** host enters unsupported punctuation, slashes, encoded separators, or path traversal text, **When** host saves, **Then** save fails without changing alias.

### Edge Cases

- Aliases are case-insensitive; `MyEvent`, `myevent`, and `MYEVENT` conflict.
- Accepted custom aliases contain 3–50 lowercase letters, digits, or single hyphens; cannot start/end with hyphen or contain consecutive hyphens.
- Generated existing event identifiers may remain valid default aliases even when they fall outside custom alias format.
- Root query string and fragment behavior must survive routing where applicable.
- Reserved list includes existing top-level routes and common future/system names: `events`, `event`, `settings`, `user`, `users`, `account`, `accounts`, `admin`, `api`, `graphql`, `health`, `ready`, `register`, `sign-in`, `signout`, `verify-email`, `forgot-password`, `reset-password`, `login`, `logout`, `new`, `search`, `help`, `support`, `about`, `terms`, `privacy`, `assets`, `static`, `favicon`, and `robots`.
- Newly introduced top-level application/system routes must be reserved before deployment.
- Unique conflict may occur after client validation but before save; authoritative save still returns taken message.
- After rename, previous root-level alias stops resolving immediately and becomes available for another event; canonical `/events/{eventIdentifier}` remains valid.

## Scope Boundaries *(mandatory)*

### In Scope

- Default root short link for every existing and new event using existing public event identifier.
- Host-only settings field showing current site origin prefix and editable alias ending.
- Canonical lowercase custom aliases with format, uniqueness, and reserved-name validation.
- Root-level alias resolution to canonical event route.
- Database-enforced uniqueness under concurrent writes.
- Migration/backfill for existing events.
- Clear loading, success, validation, conflict, and failure states.

### Out of Scope

- Custom domains, nested aliases, QR codes, link analytics, expiration, or scheduled aliases.
- Multiple active aliases or historical alias redirects.
- Changing canonical `/events/:eventId` routes or public event identifiers.
- Public alias discovery or unauthenticated alias management.
- Automatic alias generation from event title.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every new and existing event MUST have one current short-link alias defaulting to its existing public event identifier.
- **FR-002**: Visiting `/{alias}` MUST resolve alias case-insensitively and route to canonical `/events/{eventIdentifier}` page.
- **FR-003**: Alias routing MUST preserve existing event visibility, access, voting, and not-found behavior.
- **FR-004**: Event settings MUST show `Event Short Url: {current website host}/` immediately followed by left-aligned editable alias field.
- **FR-005**: Settings field MUST display current saved alias and permit host to replace it.
- **FR-006**: Only authenticated event host MUST be authorized to change event alias.
- **FR-007**: Custom alias MUST canonicalize surrounding whitespace and letters to lowercase before validation and uniqueness comparison.
- **FR-008**: Custom alias MUST be 3–50 characters using lowercase ASCII letters, digits, and single internal hyphens only.
- **FR-009**: System MUST reject leading/trailing hyphens, consecutive hyphens, slashes, encoded separators, dots, whitespace, query/fragment characters, and path traversal forms.
- **FR-010**: Alias MUST be globally unique across events using case-insensitive comparison.
- **FR-011**: Authoritative persistence MUST guarantee uniqueness during concurrent saves.
- **FR-012**: Taken alias failure MUST tell host “This short URL is already taken.” without changing saved alias.
- **FR-013**: System MUST reject all current top-level application/API/static routes plus documented reserved common names.
- **FR-014**: Reserved-name failure MUST clearly say alias is unavailable because name is protected.
- **FR-015**: Default generated alias MUST be reserved atomically during event creation.
- **FR-016**: Existing events MUST receive default aliases without changing canonical URLs or event identifiers.
- **FR-017**: Successful alias update MUST appear immediately in settings and resolve without application restart.
- **FR-018**: Failed validation, authorization, or conflict MUST leave prior alias unchanged.
- **FR-019**: Alias changes MUST produce auditable event recording actor, event, outcome, and timestamps without logging sensitive session data.
- **FR-020**: After successful rename, previous root alias MUST stop resolving immediately and become available for another event while canonical `/events/{eventIdentifier}` remains permanently valid.

### Key Entities

- **Event Short Link**: Globally unique canonical alias tied to one event; includes current value and audit timestamps.
- **Reserved Alias**: Protected root name unavailable for event assignment.
- **Event**: Existing host-owned event identified permanently by current public identifier and optionally reached through root alias.

### Ownership and Access

- Event owns current alias; event host alone may change it.
- Any visitor may resolve alias, but resulting event visibility and access remain governed by existing rules.
- Reserved aliases belong to platform and cannot be claimed by events.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new and migrated events resolve through default root short link to correct canonical event page.
- **SC-002**: Host can change valid available alias and verify new link in under 30 seconds.
- **SC-003**: Duplicate, case-equivalent, reserved, and malformed aliases are rejected in 100% of acceptance tests without altering saved alias.
- **SC-004**: Under concurrent claim test, no two events ever retain same canonical alias.
- **SC-005**: Root short-link resolution completes without perceptible extra navigation delay for 95% of normal visits.
- **SC-006**: Unauthorized alias update tests expose no event-management data and make zero changes.

### Critical User Flows *(mandatory)*

- **CUF-001**: Host opens settings, edits alias, saves available value, shares short link, and visitor reaches canonical event home page.
- **CUF-002**: Host attempts taken or protected alias, sees clear message, and existing short link continues working.
- **CUF-003**: Existing event receives default alias and remains reachable through both short and canonical routes after deployment.

## Assumptions

- “Event id” means existing public event identifier used in `/events/:publicId`, not internal database identifier.
- Website prefix uses deployed application host dynamically; example capitalization `Votiy.com/` is presentation text, not hard-coded environment value.
- Custom aliases are lowercase and case-insensitive to minimize sharing mistakes.
- Canonical `/events/:publicId` URLs remain permanent regardless of short-link edits.
- Each event has one active root alias; successful rename releases previous alias immediately.
- Reserved aliases are maintained as platform-owned policy and expanded whenever new top-level routes are introduced.
