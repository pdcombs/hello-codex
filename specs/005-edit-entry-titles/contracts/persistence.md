# Persistence Contract: Category and Entry Title Batch

## Read and concurrency boundary

Within one session/transaction:

1. Read event by `_id`; require `ownerAccountId` equals actor.
2. Locate input category; require its `updatedAt` equals `expectedCategoryUpdatedAt`.
3. Read `eventEntries` filtered by `{eventId, categoryId, status: "active"}` ordered deterministically.
4. Require persisted and submitted entry ID sets are identical.
5. Require every persisted `updatedAt` equals submitted `expectedUpdatedAt`.

Any mismatch returns safe conflict/not-found/forbidden and performs no writes.

## Conditional writes

- Category rename filter includes event, owner, category ID, expected category timestamp, and existing unique-title protection.
- Each changed entry update filter includes `_id`, `eventId`, `categoryId`, `status: "active"`, and expected `updatedAt`.
- Entry update sets only trimmed `title` and shared `updatedAt`.
- Matched/modified count must equal changed-entry count or transaction aborts.
- Event `updatedAt` advances once when any effective title change commits.

## Transaction boundary

Transaction contains:

- Category conditional update when changed.
- Changed-entry bulk updates.
- Event timestamp update when needed.
- Idempotency record creation.

Audit append occurs after commit. Audit metadata must contain only allowlisted identifiers/counts/booleans.

## Idempotency

Identity:

```text
scope = actorAccountId:eventId
operation = updateEventCategory
key = input.idempotencyKey
```

- Same digest: return hydrated event without replaying writes/audits.
- Different digest: conflict.
- Aborted transaction: no idempotency record.

## Existing storage compatibility

- No document schema version changes.
- No new indexes required; existing event identity and `entry_event_category_active` support validation/read.
- Existing `renameEventCategory`, `archiveEventEntry`, Add Entry, and read operations remain unchanged.
- Existing documents need no migration.
