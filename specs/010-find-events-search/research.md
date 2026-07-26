# Research: Find Events Search

## Decision 1: Keep search inside existing MongoDB-backed API

**Decision**: Add public event search to existing GraphQL service and `events` repository.

**Rationale**: Current scale target fits existing stack. Local MongoDB and Atlas production remain
behaviorally aligned. No new credentials, deployment, monitoring surface, or failure dependency.

**Alternatives considered**:

- Atlas Search autocomplete: strong search features, but local development parity and operational
  simplicity worsen.
- External search service: unnecessary infrastructure and synchronization risk.
- Browser-side filtering: leaks event data, cannot paginate globally, and violates server authority.

## Decision 2: Normalize event text into indexed substring grams

**Decision**: Persist normalized title/description/location strings plus unique 2-character and 3-character
grams for each field and combined search text. Normalize query terms, remove connective stop words, match
all query grams through multikey index, then verify each complete normalized query term as a substring to
remove gram collisions.

**Rationale**: Supports required middle-of-word matching such as `cycle` within `motorcycle`, queries spanning
title/location, bounded safe matching, and indexed candidate selection.

**Alternatives considered**:

- Case-insensitive regular expressions across raw fields: simplest, but collection scans undermine latency
  goals.
- MongoDB text index: good full-word relevance but no prefix matching.
- Whole-word or prefix arrays: smaller, but cannot satisfy middle-of-word requirement.
- Unverified grams: indexed, but can yield false positives when grams occur out of order.

## Decision 3: Rank by matched field strength and stable recency

**Decision**: Require all normalized query terms in combined tokens. Score title matches above location,
then description; sort by score descending, `updatedAt` descending, `_id` descending.

**Rationale**: Title intent is strongest. Location remains more useful than incidental description text.
Stable tie-breakers allow cursor pagination without duplicates.

**Alternatives considered**:

- Recency only: predictable but weak relevance.
- Alphabetical order: stable but unrelated to visitor intent.
- Personalized ranking: outside scope and requires tracking.

## Decision 4: Use signed opaque cursor bound to query

**Decision**: Cursor contains version, normalized-query digest, score, `updatedAt`, and event ID; encode as
opaque base64url data protected with existing token pepper. Reject malformed or different-query cursors.

**Rationale**: Prevents clients altering pagination boundaries, avoids exposing internal IDs as an
interface, and makes stale cursor misuse explicit.

**Alternatives considered**:

- Offset pagination: duplicate/skip risk as events change and slower deep pages.
- Plain date cursor: insufficient for relevance ties.
- Server-side search sessions: extra persistence and cleanup without user value.

## Decision 5: Add schema-version-4 search projection migration

**Decision**: Migrate all existing events to schema version 4 with derived search term arrays. New event
creation writes version 4. Any future title/description/location edit must refresh projection atomically.

**Rationale**: Strict collection validator requires explicit compatible evolution. Full migration gives
deterministic search coverage and avoids mixed behavior.

**Alternatives considered**:

- Compute tokens at query time: cannot use multikey index.
- Separate search collection: duplicates event lifecycle and consistency work.
- Lazy migration on read: incomplete search results until every event is visited.

## Decision 6: Reuse viewer-aware event route

**Decision**: Results navigate to the existing `/events/:publicId` route. The API evaluates the current
viewer for every request: a host receives the full host projection, a non-host receives the public or
private-summary projection, and navigation source does not alter authorization.

**Rationale**: Access is an identity-and-ownership decision, not a routing decision. Reusing one route
prevents divergent pages while ensuring a host always gets host behavior.

**Alternatives considered**:

- Dedicated discovery route: duplicates navigation semantics and could suppress valid host access.
- Query-string view mode: lets presentation state imply authorization.
- Duplicate public page: needless UI divergence.

## Decision 7: Native accessible dialog and infinite-scroll sentinel

**Decision**: Reuse established full-screen dialog focus/dismissal patterns. Use `IntersectionObserver`
sentinel for automatic next-page loading, guarded against duplicate fetches. Preserve keyboard-reachable
fallback Load More action and status announcements.

**Rationale**: Delivers infinite scroll without making pagination inaccessible or tying behavior to scroll
events.

**Alternatives considered**:

- Scroll event listener: noisier, harder to throttle, and brittle with nested containers.
- Infinite scroll without fallback: weak keyboard/assistive-technology support.
- Manual pagination only: conflicts with requested experience.

## Decision 8: Inline search icon, no icon package

**Decision**: Render a small search SVG inside an icon button, visually aligned with supplied reference.

**Rationale**: One icon does not justify new runtime dependency. Accessible name remains text-based.

**Alternatives considered**:

- `react-ionicons`: usable, but adds package weight for one static icon.
- Unicode glyph: inconsistent rendering and weaker visual control.

## Decision 9: Debounce, cancellation, and rotating placeholder behavior

**Decision**: Debounce query 300 ms. Abort or ignore prior requests using sequence ownership. Rotate supplied
examples every 2.5 seconds only while input is empty. Reset dialog state on close.

**Rationale**: Limits request volume, prevents stale flashes, and matches requested 2–3 second imitation
without touching user input.

**Alternatives considered**:

- Search every keystroke: unnecessary load and race risk.
- Submit-only search: slower discovery than requested type-ahead behavior.
- Animated typed placeholder: distracting and more complex; rotating placeholder communicates same intent.

## Decision 10: Privacy-safe observability

**Decision**: Log `event.search.completed` with correlation ID, outcome, duration, normalized term count,
page size, result count, has-more, and error code. Never log raw/normalized query or returned event fields.
Alert on elevated failures and first-page p95 latency.

**Rationale**: Diagnoses reliability and performance without storing visitor intent or public event text in
logs.

**Alternatives considered**:

- Log query for debugging: privacy cost exceeds need.
- No search logs: violates operational observability and hides latency regressions.

## Decision 11: Visibility and lifecycle states

**Decision**: Add host-controlled `public`, `private`, and `unlisted` visibility plus `active`/`archived`
lifecycle. Existing/new events default public and active. Active public/private events are searchable;
unlisted and archived events are excluded. Archive is irreversible.

**Rationale**: Matches product rules while separating discovery policy from voting and participant access.

**Alternatives considered**:

- One combined status enum: mixes visibility with lifecycle and complicates transitions.
- Private excluded from search: rejected by product requirement.
- Reversible archival: conflicts with permanent history requirement.

## Decision 12: Private and archived projections

**Decision**: Non-host private reads use a dedicated `PrivateEventSummary` GraphQL projection containing
title, description, analytics counts, visibility/lifecycle, and `PRIVATE_SUMMARY` access only. The service
derives this projection at read time from the existing Event record; no event data is duplicated in
persistence. The viewer-aware result union avoids weakening or violating existing non-null Event fields.
An authenticated host always receives the full host Event projection regardless of navigation source.
Unlisted direct links use normal full public details. Archived events return host-only `ARCHIVED_READ_ONLY`;
non-host reads return not found. All existing mutations reject archived events.

**Rationale**: UI cannot bypass disclosure rules by direct API access. Host retains management before
archival and historical visibility afterward.

**Alternatives considered**:

- UI-only hiding: violates server authority and leaks protected fields.
- Return protected fields with flags: still leaks data.
- Delete archived events: destroys audit history.

## Decision 13: Audit visibility and archival attempts

**Decision**: Append one immutable, privacy-safe audit/domain event for each successful or denied visibility
change and archival attempt.

**Rationale**: These are security-relevant event state changes and require operational and historical
traceability without exposing event content.
