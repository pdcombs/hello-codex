# Data Model: Edit Entry Titles

## Event

Existing host-owned voting event.

Relevant fields:

- `_id`: immutable event identity.
- `ownerAccountId`: sole current event-management authority.
- `categories[]`: embedded category records.
- `updatedAt`: advances when effective category or entry title changes commit.

Invariant: batch edit never changes event owner, policy, public identity, or unrelated categories.

## Category

Existing embedded event category.

Relevant fields:

- `_id`: immutable category identity.
- `title`: trimmed display title, 1–120 characters.
- `titleNormalized`: normalized uniqueness value.
- `isDefault`: immutable designation.
- `createdAt`: immutable creation time.
- `updatedAt`: concurrency token; advances only when category title changes.

Invariant: category belongs to input event and title remains unique within event.

## Event Entry

Existing standalone participant-owned voting choice.

Relevant fields:

- `_id`: immutable entry identity.
- `eventId`, `categoryId`, `ownerAccountId`: immutable for title edit.
- `title`: trimmed display title, 1–160 characters.
- `status`: must be `active` to edit.
- `createdByAccountId`, `createdAt`: immutable history.
- `updatedAt`: concurrency token; advances on effective title change.
- archive fields: unchanged by title edit.

Invariant: title edit changes only `title` and `updatedAt`.

## Category Edit Intent

Transient host request, not a new persistent collection.

Fields:

- `eventId`, `categoryId`.
- `title`: desired category title.
- `expectedCategoryUpdatedAt`.
- `entryTitles[]`: full active category snapshot.
  - `entryId`.
  - `title`: desired trimmed title.
  - `expectedUpdatedAt`.
- `idempotencyKey`.

Validation:

- 0–5,000 entry items; entry IDs unique.
- Every title valid after trimming.
- All timestamps valid.
- Full submitted entry-ID set exactly matches current active category entry set.
- Every expected timestamp matches persisted value.

## Idempotency Record

Existing collection record.

- Scope: actor + event.
- Operation: `updateEventCategory`.
- Key and request digest.
- Result reference: event/category IDs, changed entry IDs, category-title-changed boolean.
- Expiration and creation timestamp.

Same key + same digest returns current hydrated event. Same key + changed digest returns conflict.

## Entry Title Change Audit

Existing audit collection with new accepted name `entry.title_changed`.

- Actor account ID.
- Event subject and correlation ID.
- Outcome and timestamp.
- Metadata: category ID and entry ID only.

Old/new title text is prohibited from audit metadata and operational logs.

## State Transitions

### Successful effective edit

1. Draft form holds category plus full active-entry snapshot.
2. Transaction validates owner, category timestamp, exact active entry set, and entry timestamps.
3. Changed category/entry titles update with one timestamp.
4. Idempotency record commits.
5. Hydrated event returned; UI exits edit mode.
6. One audit appended per changed entry.

### No-op edit

1. Snapshot validates.
2. No category/entry title field changes.
3. Idempotent completion recorded.
4. No title-change audits emitted.

### Rejected edit

- Validation, authorization, missing entity, stale snapshot, uniqueness, or write-count mismatch aborts transaction.
- No category/entry title or idempotency change persists.
- UI retains staged values and maps field errors.

### Concurrent entry archive

- Existing archive commits independently.
- Batch full-snapshot comparison detects active set mismatch and rejects batch.
- Host refreshes and reapplies desired edits against current category.
