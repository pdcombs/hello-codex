# Data Model: Entry-Derived Participants

## EventEntry schema version 1

| Field | Type | Rules |
|-------|------|-------|
| `_id` | immutable identifier | Existing embedded entry ID during migration; generated for new entries |
| `eventId` | event identifier | Required; immutable; indexed |
| `categoryId` | category identifier | Required; category belongs to `eventId`; immutable after creation |
| `ownerAccountId` | account identifier | Required; immutable; establishes derived participation while active |
| `title` | string | Required; trimmed; 1–160 characters |
| `createdByAccountId` | account identifier | Required; host for managed creation or participant for self-registration |
| `status` | enum | `active` or `archived`; required |
| `archiveReason` | enum/null | `entry_removed`, `participant_removed`, or `legacy_registration_removed` |
| `archivedAt` | date/null | Required when archived; null while active |
| `archivedByAccountId` | account identifier | Host for product removal; dedicated system migration actor when no reliable legacy human actor exists |
| `createdAt` | date | Required; immutable |
| `updatedAt` | date | Required; changes on archival |
| `schemaVersion` | integer | `1` |

### Entry invariants

- Product operations never hard delete an entry.
- Active entries have null archival fields.
- Archived entries always have `archivedAt`, `archiveReason`, and an accountable human or system actor.
- Event, category, owner, creator, title, and creation time do not change on archival.
- The referenced category belongs to the referenced event.
- Only active entries appear in event categories, participant cards, and active counts.
- Duplicate titles are allowed and count as separate entries.

## Account

Existing schema remains authoritative. The participant projection reads:

| Field | Use |
|-------|-----|
| `_id` | Entry owner and grouping key |
| `displayName` | Participant-card title and public entry owner label |
| `emailNormalized` | Host-only participant-card subtitle |

Account lifecycle is independent. Entry or participant removal never deletes, archives, or downgrades an account.

## Event and Category

Existing event schema version 2 remains unchanged. Categories remain embedded on the event. Active `EventEntry.categoryId` values reference a category on the same event; archived entries retain the historical category ID even if future features later archive categories.

## ParticipantCard projection (not persisted)

| Field | Type | Rules |
|-------|------|-------|
| `accountId` | account identifier | Distinct active entry owner in the event |
| `displayName` | string | Required privacy-safe account display name |
| `email` | string/null | Host-only; unavailable label is a UI concern |
| `entries` | list of entry summaries | Active entries for this event and owner, stable creation order |
| `entryCount` | integer | Exact length of `entries`; at least 1 |

The projection has no independent state, identifier, or lifecycle. If no active entry exists, no card exists.

## Legacy EventRegistration

After migration 003, event-registration documents are read-only compatibility/audit records. They are not consulted for active participant membership and new product writes do not create or revive them. Embedded entries remain untouched during the compatibility window to support rollback, but standalone `eventEntries` are authoritative once migration completes.

## Relationships

```text
Account (host) 1 ── * Event
Event 1 ── 1..100 Category (embedded)
Event 1 ── * EventEntry
Account (owner) 1 ── * EventEntry
Category 1 ── * EventEntry (same Event)
distinct active EventEntry.ownerAccountId ──> ParticipantCard projection
```

## State transitions

### Create entries for participant

1. Verify viewer owns event (or satisfies existing OPEN self-registration rule).
2. Validate account identity and 1–100 entry inputs.
3. Verify every category belongs to event.
4. Begin transaction.
5. Reuse or create account as current flows require.
6. Insert active entry documents with the account as owner.
7. Persist idempotency result referencing entry IDs and commit.
8. The participant card exists automatically because active entries now exist.

### Archive one entry

1. Verify viewer owns event and entry belongs to it.
2. Require explicit UI confirmation.
3. Conditionally update `status=active` to archived with reason `entry_removed`, actor, and time.
4. Emit audit event after successful persistence.
5. Recompute views: the participant remains only if another active event entry exists.

### Archive participant entries

1. Verify viewer owns event and target account owns at least one active event entry.
2. Require explicit UI confirmation describing the affected count.
3. Begin transaction and update every active `(eventId, ownerAccountId)` entry to archived with reason `participant_removed`, one actor, and one timestamp.
4. Verify modified count equals the transaction's selected count; otherwise abort.
5. Commit and emit one aggregate audit event containing event/account identifiers, entry IDs, and count.
6. The participant card disappears because no active entries remain.

### Retry and concurrency

- Idempotency keys protect create and archive mutations.
- A repeated archive with the same key returns the recorded success.
- A new request targeting an already archived entry returns a conflict without changing history.
- Concurrent participant/entry archival uses conditional active-state matching; transactions prevent partial participant removal.

## Indexes and query patterns

- Unique `_id` preserves embedded entry identity and migration idempotency.
- `{ eventId: 1, status: 1, categoryId: 1, createdAt: 1, _id: 1 }` supports category-grouped active event reads.
- `{ eventId: 1, status: 1, ownerAccountId: 1, createdAt: 1, _id: 1 }` supports participant grouping and batch archive.
- `{ ownerAccountId: 1, status: 1, eventId: 1 }` supports account-related audits and future owner views.
- No TTL index applies; archives are retained indefinitely and never hard deleted.

## Migration 003

1. Create `eventEntries` with strict validator and indexes.
2. Scan every event registration in stable `_id` order with checkpoints.
3. For each embedded entry, verify event, category, and owner account references.
4. Upsert by embedded entry `_id` using `$setOnInsert`; preserve all immutable content.
5. Map `registered` registration entries to active state with null archive fields.
6. Map `removed` registration entries to archived state using `removedAt` (or stable migration time if absent), reason `legacy_registration_removed`, and the known removal actor or dedicated system migration actor.
7. Record processed/inserted/existing/active/archived/invalid counts without titles or contact data.
8. Reruns skip identical documents and fail readiness on any content mismatch or invalid reference.
9. Mark migration complete only after standalone count and per-event ownership/category checks pass.
10. Keep embedded source data and legacy indexes during the compatibility/rollback window; removal is deferred to a later separately specified cleanup.
