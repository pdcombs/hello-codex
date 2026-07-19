# Research: Remove Category

## Decision 1: Archive embedded category in place

**Decision**: Add explicit lifecycle fields to embedded category records and retain archived categories in the event document.

**Rationale**: Preserves stable category identity and historical relationship to entries while active projections can filter them cleanly.

**Alternatives considered**:

- Physically pull category from event and copy to audit: rejected because audit is not authoritative domain storage and category history would fragment.
- Move archived categories to a new collection: rejected as unnecessary service/data complexity.

## Decision 2: Versioned migration for explicit lifecycle

**Decision**: Idempotently migrate every existing category to explicit active lifecycle fields before enforcing the updated validator.

**Rationale**: Removes ambiguous missing-field semantics and makes archival queries, validators, and future maintenance predictable.

**Alternatives considered**:

- Treat missing status as active indefinitely: rejected because persistent dual semantics increase every future query's complexity.
- Add lifecycle only when a category is removed: rejected because mixed document shapes weaken validation.

## Decision 3: Full snapshot plus conditional final-category guard

**Decision**: Validate expected event/category timestamps and full active-entry snapshot, then conditionally archive only if another active category still exists.

**Rationale**: Detects stale confirmation and prevents two concurrent removals from both believing another category remains.

**Alternatives considered**:

- Count categories only before transaction: rejected due race to zero.
- Last-write-wins: rejected because it can archive newly changed entries unexpectedly.

## Decision 4: Deterministic default promotion

**Decision**: When default is removed, promote the oldest remaining active category by creation time then identity.

**Rationale**: Implements the chosen product rule without another user step and is deterministic across retries.

**Alternatives considered**:

- Block default removal: rejected by clarified product decision.
- Require replacement selection: rejected by clarified product decision and added interaction cost.

## Decision 5: Reuse archived title through new identity

**Decision**: Active-title uniqueness excludes archived categories; same-title creation produces a fresh category record.

**Rationale**: Implements clarified title reuse while keeping permanent archived identity/history distinct.

**Alternatives considered**:

- Reserve title forever: rejected by clarified product decision.
- Restore archived category: explicitly out of scope and contradicts permanent removal.

## Decision 6: Audit inside the removal transaction

**Decision**: Persist category/entry audits in the same transaction as lifecycle and idempotency changes.

**Rationale**: A successful important state change must never exist without its required audit history.

**Alternatives considered**:

- Append audit after commit: rejected because audit failure would leave unaccounted successful removal.

## Decision 7: No new index or runtime dependency

**Decision**: Use event identity/category array filtering and existing active-entry category index.

**Rationale**: Current limits and access paths satisfy expected scale; new infrastructure would add no verified value.

**Alternatives considered**:

- Separate archival queue: rejected because synchronous transaction is required for user-visible atomicity.
