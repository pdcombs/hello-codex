# Data Model: Add Entries

## Storage impact

No new collection or document migration. Feature reuses account schema version 2, event schema version 2 categories, standalone `eventEntries`, idempotency records, and audit events.

## Entry owner choice projection

Read-only host-facing projection; never stored.

| Field | Type | Rules |
|-------|------|-------|
| `accountId` | identifier | Existing account; stable selection key |
| `displayName` | string | Required account display name |
| `email` | string or null | Normalized account email; manager-only |
| `phone` | string or null | Normalized account phone; manager-only |
| `isEventParticipant` | boolean | True when account owns at least one active entry in event |
| `latestEntryCreatedAt` | date or null | Maximum active event-entry creation time for owner |

### Projection invariants

- Choice returned only after event-manager authorization.
- Each account appears once.
- Recent mode includes active participants only and orders newest timestamp first, then account ID.
- Search mode may include nonparticipants; event recency enriches matching accounts when present.
- At most ten choices returned.
- Archived entries never establish participation or recency.

## Existing account owner path

| Input | Rules |
|-------|-------|
| `accountId` | Required when provisional owner absent; must resolve at save time |

Selected account becomes owner of new entry. Account lifecycle and contact fields do not change.

## Provisional owner path

| Input | Rules |
|-------|-------|
| `displayName` | Trimmed; 1–100 characters |
| `email` | Valid normalized email or null |
| `phone` | Valid normalized E.164 phone or null |

### Provisional invariants

- At least one contact required.
- Existing exact normalized contact is reused during transaction.
- If supplied email and phone resolve to different accounts, creation conflicts; identities are not merged.
- New account uses `lifecycleStatus=provisional`, pending verification, no credential, and manager as referrer.
- Provisional account and entry commit together or both roll back.

## Event entry

Existing `eventEntries` schema remains unchanged.

| Field | Add Entries rule |
|-------|------------------|
| `_id` | Generated immutable identifier |
| `eventId` | Originating event |
| `categoryId` | Locked category from initiating card; must belong to event |
| `ownerAccountId` | Selected/reused/provisionally created account |
| `title` | Trimmed; 1–160 characters |
| `createdByAccountId` | Authorized event manager |
| `status` | `active` |
| archival fields | Null at creation |
| timestamps | One transaction timestamp |
| `schemaVersion` | 1 |

## Entry creation attempt

Existing idempotency record stores:

| Field | Rules |
|-------|-------|
| `scope` | Actor account plus event |
| `operation` | `createEventEntry` |
| `key` | Client-generated UUID |
| `requestDigest` | Digest covers event, category, title, and complete owner source |
| `resultReference.entryIds` | Exactly one created entry ID |
| `resultReference.accountId` | Resolved owner account ID |
| expiry/created time | Existing 24-hour policy |

Same key and digest returns original result; same key and different digest conflicts.

## Indexes and query patterns

### Existing account indexes

- `account_email_unique` bounds normalized email prefix ranges.
- `account_phone_unique` bounds normalized phone prefix ranges.
- Search includes matching contact type predicate, deterministic account-ID tie-break, and limit 10.

### New entry recency index

Add nonunique index:

```text
{ eventId: 1, status: 1, createdAt: -1, ownerAccountId: 1, _id: 1 }
name: entry_event_recent_owners
```

Supports scanning newest active entries for recent distinct owners. Existing category and owner indexes remain.

## Relationships

```text
Account (manager) 1 ── * Event
Event 1 ── * Category (embedded)
Event 1 ── * EventEntry
Category 1 ── * EventEntry
Account (owner) 1 ── * EventEntry
distinct active EventEntry.ownerAccountId = derived Event participants
```

## State transitions

### Load recent owners

1. Authenticate viewer and authorize event management.
2. Read newest active event entries.
3. Deduplicate owner IDs while preserving newest-entry order; cap at ten.
4. Hydrate accounts and return choices in preserved order.

### Search owners

1. Authenticate viewer and authorize event management.
2. Normalize input; reject fewer than three searchable characters.
3. Run bounded email or phone prefix query; cap at ten.
4. Join matching accounts to active event-entry recency.
5. Return choices without logging input/contact values.

### Create entry for existing account

1. Validate input and idempotency identity.
2. Begin transaction; reauthorize manager.
3. Verify active event/category relationship and account existence.
4. Create one entry and idempotency record.
5. Commit; hydrate entry and participant projections.

### Create entry for provisional account

1. Validate display name/contact and idempotency identity.
2. Begin transaction; reauthorize manager and category.
3. Resolve exact normalized contacts again.
4. Reuse one matching account, conflict on two identities, or create provisional account.
5. Create one entry and idempotency record.
6. Commit all changes; hydrate projections.

### Failure

- Validation/auth failure writes no state.
- Transaction abort retains no provisional account, entry, or idempotency result.
- UI preserves modal inputs and last confirmed event projection.
