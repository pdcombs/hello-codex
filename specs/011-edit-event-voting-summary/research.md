# Research: Event Details and Voting Summary

## Host Event-Detail Update Boundary

**Decision**: Add a dedicated `updateEventDetails` mutation handled by the existing event service. Validate
with the same normalized field rules as creation, authorize the host, reject archived events, and use the
event `updatedAt` value for atomic optimistic concurrency.

**Rationale**: Detail editing is independent from visibility and voting-rule changes. A dedicated mutation
keeps errors and stale-write recovery precise and follows established compare-and-set behavior.

**Alternatives considered**: Merging details into visibility couples unrelated saves; reusing creation has
the wrong identity semantics; mapping every failure to forbidden prevents actionable conflict recovery.

## Atomic Search Projection Refresh

**Decision**: The repository update writes title, description, location, all normalized/gram search fields,
and `updatedAt` in one compare-and-set operation.

**Rationale**: Search uses persisted derived fields. Separate or delayed updates could expose stale or partial results.

**Alternatives considered**: Read-time recomputation defeats indexing; background refresh adds infrastructure;
a schema bump is unnecessary because version 4 already owns these fields.

## Event-Wide Voting Method

**Decision**: Treat existing default method and bounds as the sole active event-wide rule. Every category
resolves through it; existing category overrides remain stored unchanged but inactive.

**Rationale**: The current data already separates default and overrides. Changing the resolution seam is
small, applies to new categories, preserves ballots, and is reversible.

**Alternatives considered**: Deleting/overwriting overrides destroys reversibility; moving them requires an
unnecessary migration; adding a scope field is speculative configuration.

## Category Rule Compatibility

**Decision**: Temporarily accept legacy `categoryRules` input but ignore it and preserve stored overrides.
Return an empty `categoryRules` active projection; current clients use `defaultCategoryRule` only.

**Rationale**: Old clients remain contract-compatible but cannot mutate or reactivate dormant history.

**Alternatives considered**: Immediate removal breaks deployed clients; echoing overrides invites misuse;
rewriting overrides destroys history.

## Multiple-Selection Bounds and Readiness

**Decision**: One bounds pair applies to every active category. Save-time validation checks current categories,
and voting capability/submission rechecks live entry counts. An event cannot be reported open or accept
ballots while any active category has fewer entries than the maximum. Setup may temporarily be unsatisfied
while hosts add entries, and settings identify blocking categories.

**Rationale**: Shared displayed rules must match ballot behavior. Runtime validation handles category/entry
changes after rule save without destructive rewriting.

**Alternatives considered**: Per-category clamping contradicts displayed rules; rejecting all temporarily
invalid category changes blocks normal setup; retaining category bounds preserves current confusion.

## Voting Summary Ownership and Privacy

**Decision**: Derive summary text in a pure client mapping from the full event's authoritative rule projection
and `isOwner`. Do not add voting fields to `PrivateEventSummary`; render no summary when data is absent.

**Rationale**: Wording is deterministic and testable, while server minimization prevents UI-only privacy leaks.

**Alternatives considered**: Persisted sentences drift from rules; fetching capability for private summaries
leaks data; inline page conditions duplicate sensitive logic.

## Viewer-Local Schedule Formatting

**Decision**: Format valid instants with runtime locale and explicit short timezone label using semantic time
elements. Omit schedule if either instant is absent/invalid. Correct settings conversion so `datetime-local`
shows local wall time rather than sliced UTC.

**Rationale**: Locale-aware formatting handles daylight-saving transitions and avoids misleading partial windows.

**Alternatives considered**: Raw UTC burdens voters; default locale strings may omit timezone; host timezone
is unavailable as a preference.

## Completed-Account Switch

**Decision**: Keep native checkbox behavior and add switch semantics, persistent label, visible state text,
descriptive help, focus-visible/disabled styling, and a 44-pixel touch target.

**Rationale**: Native behavior supplies robust keyboard/form semantics while CSS supplies expected presentation.

**Alternatives considered**: A custom button duplicates native behavior; visual-only restyling leaves state unclear.

## Auditing and Observability

**Decision**: Record successful and denied detail-change audits and structured logs with actor/event references,
outcome, duration, changed field names/count, reason, and correlation ID. Exclude detail values and voting data.

**Rationale**: Updates remain diagnosable without duplicating user-authored content.

**Alternatives considered**: Before/after values expose unnecessary content; a new monitoring service is unnecessary.

## Migration and Rollback

**Decision**: Add no document migration or version bump. Rollback restores prior rule resolution/UI; preserved
event documents, dormant overrides, and accepted ballots remain valid.

**Rationale**: Existing records already contain every required active and dormant field.

**Alternatives considered**: Stripping overrides is destructive; storing derived summaries adds needless state.
