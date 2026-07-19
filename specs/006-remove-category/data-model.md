# Data Model: Remove Category

## Event

Existing host-owned voting event.

Relevant fields:

- `_id`, `ownerAccountId`: identity and authorization boundary.
- `categories[]`: active and archived embedded categories.
- `updatedAt`: optimistic concurrency token; advances on category archival.
- `schemaVersion`: advances for explicit category lifecycle migration.

Invariants:

- At least one category has active status.
- Exactly one active category has `isDefault: true`.
- Archived categories are excluded from active projections and category choices.

## Category

Existing embedded category extended with lifecycle.

- `_id`, `title`, `titleNormalized`, `createdAt`: immutable historical identity/title-at-removal context.
- `isDefault`: active default designation; archived record retains its former value as history.
- `updatedAt`: concurrency token and last lifecycle update time.
- `status`: `active` or `archived`.
- `archiveReason`: null while active; `category_removed` when archived.
- `archivedAt`: null while active; removal time when archived.
- `archivedByAccountId`: null while active; host identity when archived.

Validation:

- Active: all archive fields null.
- Archived: reason, time, and actor required.
- Active titles unique among active categories only; archived titles may be reused by new IDs.

## Event Entry

Existing standalone participant-owned entry.

Category removal changes active assigned entries:

- `status`: `active` → `archived`.
- `archiveReason`: `category_removed`.
- `archivedAt`, `archivedByAccountId`, `updatedAt`: removal metadata.

Identity, event, category, owner, creator, title, and creation time remain unchanged. Already archived entries are not rewritten.

## Category Removal Intent

Transient validated request:

- Event/category identity.
- Expected event and category update timestamps.
- Full expected active-entry snapshot of entry IDs and update timestamps, maximum 5,000.
- Idempotency key.

## Idempotency Record

Existing collection record:

- Scope: actor + event.
- Operation: `archiveEventCategory`.
- Key and request digest.
- Result reference: event/category IDs, archived entry IDs, promoted category ID or null.
- Creation and expiration timestamps.

## Audit Events

- `event.category_archived`: event subject, actor, category ID, archived entry count, promoted category ID when applicable.
- Existing `entry.archived`: one per newly archived entry, reason and category ID.

Titles, display names, email addresses, and phone numbers are prohibited from audit metadata and operational logs.

## State Transitions

### Non-default removal

1. Active category and its active entries validate against expected snapshot.
2. Category becomes archived.
3. Assigned active entries become archived.
4. Existing default remains unchanged.
5. Audits and idempotency commit atomically.

### Default removal

1. Require at least one other active category.
2. Choose oldest remaining active category deterministically.
3. Archive old default and assigned active entries.
4. Promote chosen category in the same event update.
5. Audits and idempotency commit atomically.

### Rejected removal

- Last active category, stale snapshot, unauthorized actor, missing/archived category, write-count mismatch, or transaction failure changes nothing.

### Same-title creation later

- Archived category remains untouched.
- New active category receives new identity and empty entry collection.
