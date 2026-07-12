# Research: Entry-Derived Participants

## Decision 1: Store entries as first-class documents

**Decision**: Move embedded entries into a dedicated `eventEntries` collection and derive participants from active entry owners.

**Rationale**: Entry lifecycle is now independent: a host can archive one entry, archive all entries for one participant, retain history, query by event/account/status, and avoid a separate membership source of truth. A standalone collection supports bounded atomic updates and event-wide grouping without rewriting an entire registration document.

**Alternatives considered**:

- Keep entries embedded in registrations: rejected because the containing registration remains a direct participant-event relationship and makes entry-level lifecycle/history awkward.
- Embed entries on events: rejected because event documents could approach size limits and participant-level atomic operations would rewrite large arrays.
- Keep registrations as authoritative participant state: rejected because it recreates the inconsistency reported by the user.

## Decision 2: Use soft archival, never deletion

**Decision**: Entries transition from `active` to `archived` with `archivedAt`, `archivedByAccountId`, and `archiveReason`; no product path hard deletes them.

**Rationale**: This directly satisfies history/audit requirements, makes retries safe through conditional updates, and preserves ownership/category evidence.

**Alternatives considered**:

- Hard delete plus audit event: rejected because an audit record alone cannot reconstruct the entry state reliably.
- Move archived entries to another collection: rejected because it adds synchronization and operational complexity without current value.

## Decision 3: Batch participant removal transactionally

**Decision**: Participant removal archives all active entries matching event and owner in one transaction, with one aggregate audit event plus affected entry IDs.

**Rationale**: A transaction prevents partial removal, while matching both event and owner guarantees other-event isolation. Conditional active-state updates make repeated requests deterministic.

**Alternatives considered**:

- Sequential entry updates: rejected because a mid-operation failure could leave a partially removed participant.
- Store an account-event archive flag: rejected because it would reintroduce independent participation state and conflict with future entries.

## Decision 4: Derive participant cards at read time

**Decision**: Query active entries by event, group by owner account, join accounts once, and build one card per owner.

**Rationale**: Read-time projection guarantees membership/count consistency with category entries and avoids a materialized participant record requiring synchronization.

**Alternatives considered**:

- Maintain participant summary documents: rejected because current scale does not justify eventual-consistency risk.
- Group only in the browser: rejected because it would expose email/contact joins broadly and duplicate authorization logic.

## Decision 5: Coordinated v3 contract with compatibility adapter

**Decision**: Add explicit participant-projection and archival operations, activate API/UI together, and temporarily adapt deprecated registration operations to the entry service.

**Rationale**: Clear new names reflect the domain while the adapter keeps intermediate and cached clients deployable. New writes never create registration membership.

**Alternatives considered**:

- Mutate existing registration semantics without new operations: rejected because IDs and response concepts become misleading.
- Immediate breaking removal: rejected because cached clients and independently deployed assets could fail.

## Decision 6: Idempotent all-record migration

**Decision**: Copy embedded entries using their existing immutable IDs, map legacy registration status to active/archive state, checkpoint migration, and block readiness on invalid references.

**Rationale**: Reusing entry IDs makes upserts naturally idempotent, preserves audit identity, and supports safe reruns or rollback. Migrating removed registrations retains complete history.

**Alternatives considered**:

- Migrate active registrations only: rejected because it loses requested history.
- Generate new IDs: rejected because retries and audit correlation become harder.

## Decision 7: Privacy-safe observability

**Decision**: Log/audit identifiers, action, outcome, count, reason, duration, and correlation ID only; never contact details or entry titles.

**Rationale**: Operators can diagnose migration and archive failures without unnecessary personal or voter-facing content.

**Alternatives considered**:

- Log full mutation payloads: rejected for privacy and token/contact exposure risk.
