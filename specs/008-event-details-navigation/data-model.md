# Data Model: Event Details Navigation

## Event

Existing event remains schema version 3. No binary or mutable counter is embedded.

### Projected additions

| Field | Type | Rules |
|-------|------|-------|
| `photo` | EventPhotoMetadata or null | Null when no active photo exists |
| `analytics` | EventAnalytics or null | Guaranteed on event-detail reads; legacy mutation projections may omit it |

Existing title, description, location, categories, voting rules, ownership, and timestamps remain
unchanged.

## EventPhoto

One current compressed photo per event.

| Field | Type | Rules |
|-------|------|-------|
| `_id` | ObjectId | Immutable |
| `eventId` | ObjectId | Required; unique; references Event |
| `publicId` | string | Required snapshot for public media lookup; indexed |
| `data` | BinData | Required; processed WebP only; 1–358,400 bytes |
| `contentType` | string | Exactly `image/webp` |
| `width` | integer | 1–640 |
| `height` | integer | 1–640 |
| `byteLength` | integer | Must equal binary length; maximum 358,400 |
| `revision` | integer | Starts at 1; increases on replacement |
| `etag` | string | Strong digest-derived response validator; never logged |
| `createdByAccountId` | ObjectId | Owner who first uploaded |
| `updatedByAccountId` | ObjectId | Owner who last replaced |
| `createdAt` | Date | Immutable |
| `updatedAt` | Date | Replacement time |
| `schemaVersion` | integer | 1 |

### Validation and indexes

- Strict validator with no unknown fields.
- Unique `{ eventId: 1 }`.
- Unique `{ publicId: 1 }`.
- Persistence rejects unprocessed content types and output above 350 KiB.
- Binary bytes, checksum, and upload filename never enter event/audit/log documents.

### State transitions

```text
ABSENT --upload--> PRESENT revision 1
PRESENT revision N --replace--> PRESENT revision N+1
PRESENT --delete--> ABSENT
```

- Upload/replace performs processing before persistence.
- Invalid or failed processing leaves current state unchanged.
- Atomic replace swaps entire processed document.
- Delete is a hard removal of media bytes because user explicitly deletes the photo; audit history retains
  identifier-only evidence, not image content. Event/category/entry soft-delete rules are unaffected.
- Idempotent replay returns the already-produced metadata without incrementing revision again.

## EventPhotoMetadata

Safe event projection; no bytes.

| Field | Type | Rules |
|-------|------|-------|
| `url` | string | Same-origin public media path |
| `revision` | integer | Current revision |
| `width` | integer | Processed width |
| `height` | integer | Processed height |
| `updatedAt` | DateTime | Last successful upload/replace |

## EventAnalytics

Derived, never directly persisted.

| Field | Type | Derivation |
|-------|------|------------|
| `categoryCount` | non-negative integer | Active embedded categories |
| `entryCount` | non-negative integer | Active entries belonging to active categories |
| `participantCount` | non-negative integer | Distinct `ownerAccountId` among counted entries |

### Invariants

- `participantCount <= entryCount`.
- A participant with many entries counts once.
- Entries in archived categories and archived entries count zero.
- Existing events with no entries produce participant and entry counts of zero.
- Counts and category/entry projections come from the same authoritative read operation.
- Successful event mutations trigger an event-detail reload rather than treating mutation analytics as
  authoritative.

## AuditEvent additions

Names:

- `event.photo_uploaded`
- `event.photo_replaced`
- `event.photo_deleted`

Allowed metadata only:

- `photoRevision`
- `width`
- `height`
- `byteLength`

No filename, content bytes, checksum, source metadata, or URL query data.

## IdempotencyRecord

Photo upload and delete reuse the existing idempotency entity.

- Scope: `event-photo:<eventId>`
- Operations: `putEventPhoto`, `deleteEventPhoto`
- Request digest: processed input digest for PUT; current revision for DELETE
- Result reference: event ID, photo revision or deleted revision, and safe metadata
- Conflicting reuse returns conflict without changing the current photo.

## Relationships

```text
Account (owner) 1 --- * Event
Event 1 --- 0..1 EventPhoto
Event 1 --- * EventEntry
EventAnalytics = derived(Event.categories, active EventEntry owners)
AuditEvent * --- 1 EventPhoto lifecycle action
```
