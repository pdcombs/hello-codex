# Research: Cast Event Ballot

## Optional category validation

**Decision**: Treat omitted or empty category as skipped; validate method only for participating categories; reject globally empty ballot.

**Rationale**: Matches clarified product rule without weakening active-entry, duplicate, min/max, or complete-ranking checks.

**Alternatives considered**: Require every category (existing behavior, rejected); allow partial ranking (clarification rejected).

## Durable private review

**Decision**: Return saved ballot on submission and expose latest identity-scoped ballot review for same account or retained browser marker/code grant.

**Rationale**: Supports immediate and revisit read-only review without public/host visibility or bearer receipt URLs.

**Alternatives considered**: Session-only review (clarification rejected); receipt token links (more secret lifecycle and support burden).

## Immutable display fidelity

**Decision**: Save category/entry titles and order snapshots with accepted ballot while retaining IDs and method.

**Rationale**: Renames/archive must not change what voter sees in durable review or later result interpretation.

**Alternatives considered**: Resolve current entry documents during review (historically inaccurate); IDs only (poor review UX).

## Idempotency and state freshness

**Decision**: Digest canonical submission payload and require expected rules plus voting-state versions.

**Rationale**: Lost-response retry returns original ballot, while key reuse with changed choices conflicts and close/reopen races cannot silently pass.

**Alternatives considered**: Key-only digest (can replay changed request); rules version only (misses state cycle changes).

## Ranking interaction

**Decision**: Explicitly start ranking category, initialize all entries in stable order, reorder through entry-specific move-up/move-down controls, and allow clearing entire ranking.

**Rationale**: Guarantees blank-or-complete unique ranking and works with keyboard/touch without drag-only dependency.

**Alternatives considered**: Required rank selects (duplicates/error prone); drag-only list (inaccessible); partial check/rank flow (outside scope).

## Access continuity

**Decision**: Issue retained browser marker for anonymous unrestricted access and honor browser-bound code access grant during submission/review.

**Rationale**: Enables durable private review and fixes consumed-code re-entry mismatch without changing repeat rules.

**Alternatives considered**: Ask code again (impossible after consumption); public ballot ID (privacy risk); force accounts (violates policies).

## Dependencies

**Decision**: Use existing React, GraphQL, MongoDB, Zod, dialog patterns, transaction wrapper, and test stack.

**Rationale**: Current foundation meets requirements. No new package or service justified.
