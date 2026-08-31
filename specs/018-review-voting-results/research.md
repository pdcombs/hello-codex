# Research: Review Voting Results

## Decision: Calculate from immutable ballots on request

**Rationale**: Current scale target supports a direct read, avoids stale derived state, and preserves one source of truth.

**Alternatives considered**: Persisted counters add synchronization and repair complexity; scheduled snapshots conflict with anytime review.

## Decision: Pure domain tally

**Rationale**: One deterministic function can cover single, multiple, ranking, ties, zero totals, snapshots, and ordering with exhaustive unit tests.

**Alternatives considered**: Database-only aggregation makes rank and historical-label rules harder to review and test.

## Decision: Borda-style rank points

**Rationale**: `N-P` exactly matches requested 5-entry scoring of 4, 3, 2, 1, 0.

**Alternatives considered**: `N-P+1` gives last place one point and conflicts with stated zero-based range.

## Decision: Highlight all top ties

**Rationale**: No tie-breaker was requested; declaring one winner would invent outcome rules.

**Alternatives considered**: Entry-order tie-break silently changes equal results.

## Decision: One host-only aggregate contract

**Rationale**: Results route needs event workspace data and tallies together, reducing mismatched loading/error states.

**Alternatives considered**: Separate event and result calls allow partial/stale render and duplicate authorization work.
