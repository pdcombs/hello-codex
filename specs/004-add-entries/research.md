# Research: Add Entries

## Decision 1: Contact typeahead uses indexed normalized prefixes

**Decision**: After three normalized characters, search email or phone by prefix, cap results at ten, and use existing normalized contact indexes.

**Rationale**: Matches progressive typing, remains deterministic locally and in Atlas, avoids global collection scans, and adds no search service. Normalized prefix supports common flows: beginning of email address or phone digits.

**Alternatives considered**:

- Arbitrary substring search: rejected because current indexes cannot bound it and contact exposure grows.
- Atlas Search: rejected because it adds production-only infrastructure and local parity burden.
- Exact match only: rejected by clarified typeahead requirement.

## Decision 2: One owner-choice query serves recent and search modes

**Decision**: Empty search returns recent event participants; valid search returns global matches enriched with event participation recency.

**Rationale**: One authorization path, one projection, less client branching, consistent display fields, and bounded payloads.

**Alternatives considered**:

- Separate recent/search queries: valid but duplicates authorization and UI state.
- Load full participant list client-side: rejected for privacy, scale, and stale ordering.

## Decision 3: Recent participants derive from active entry timestamps

**Decision**: Group active entries by owner, use maximum `createdAt`, order descending, tie-break by immutable account ID, then hydrate account choices.

**Rationale**: Matches entry-derived participation and “last used first” without separate mutable recency state.

**Alternatives considered**:

- Store `lastUsedAt` on account/event: rejected as duplicate state that can drift.
- Participant display-name order: rejected because it does not optimize repeated creation.

## Decision 4: Existing and provisional owners share one atomic mutation

**Decision**: Single mutation accepts exactly one owner source. Existing owner is referenced by ID; provisional owner provides display name and valid email or phone. Owner resolution, optional provisional creation, entry creation, and idempotency record occur in one transaction.

**Rationale**: Prevents provisional accounts without intended entries, ownerless entries, race duplicates, and multi-request recovery complexity.

**Alternatives considered**:

- Create account before entry: rejected because entry failure leaves unintended standalone provisional accounts.
- Separate mutations chained by client: rejected because partial failure and retry become client responsibility.
- Always create provisional account: rejected because existing identity must be reused.

## Decision 5: Current owner is event manager; permission boundary stays extensible

**Decision**: Reuse current owner check behind event-manager naming. No administrator membership schema added in this feature.

**Rationale**: Product currently has one event owner and no delegated administrator lifecycle. Inventing assignment/revocation UI and storage exceeds Add Entries. Central permission function allows later administrator feature without changing lookup/creation contracts.

**Alternatives considered**:

- Add administrator IDs to events now: rejected as unrequested role-management scope.
- Client-only ownership check: rejected because contact access and mutation need server enforcement.

## Decision 6: Additive GraphQL contract and existing entry persistence

**Decision**: Add owner-choice query and single-entry mutation; keep existing multi-entry operations and `eventEntries` documents unchanged.

**Rationale**: Backward compatible, smallest surface, reuses current source of truth, and avoids migration.

**Alternatives considered**:

- Replace participant-entry mutation: rejected because current participant page and compatibility clients depend on it.
- New entry collection/version: rejected because existing schema already represents required ownership and category.

## Decision 7: Privacy-safe observability

**Decision**: Metrics/logs use operation, outcome, counts, duration, correlation, IDs only where audit requires them. Search text and human-readable identity/title values never enter logs.

**Rationale**: Contact lookup is sensitive. Operational diagnosis needs timing/outcome, not PII.

**Alternatives considered**:

- Log normalized prefixes: rejected; still personal data.
- No lookup telemetry: rejected; latency, error, and unauthorized-access regressions would be invisible.
