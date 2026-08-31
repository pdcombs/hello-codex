# Research: Defer Voting Code Consumption

## Decision: Validation creates pending access, not code use

**Rationale**: Existing voter-access grant stores code identity and lets submission recover it. Removing early consumption preserves navigation while abandonment leaves code unused.

**Alternatives considered**: Exclusive reservation adds expiry and lockout risk; resending plaintext code changes client contracts.

## Decision: Submission owns atomic consumption

**Rationale**: Existing transaction surrounds eligibility, ballot, code, audit, and idempotency. `status: unused` precondition ensures one concurrent winner and rollback on failure.

**Alternatives considered**: Consumption before transaction repeats defect; consumption after commit risks disagreement.

## Decision: Keep unique ballot access-code index

**Rationale**: Existing unique partial index provides defense in depth against duplicate code association.

**Alternatives considered**: Transaction timing alone weakens integrity.

## Decision: Reconcile against ballot ownership

**Rationale**: Ballot `accessCodeId` is authoritative. Attach matching ballots; restore only rows with no matching ballot. Audit corrections.

**Alternatives considered**: Restore every missing backlink risks reusing legitimate codes; leaving all used strands codes.

## Decision: Preserve API shape

**Rationale**: Existing access and submission contracts contain required fields. Behavioral correction needs no breaking GraphQL change.

**Alternatives considered**: New reservation token duplicates pending access and expands public surface.
