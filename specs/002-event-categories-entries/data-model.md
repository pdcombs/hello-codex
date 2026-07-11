# Data Model: Event Categories and Entries

## Account schema version 2

| Field | Type | Rules |
|-------|------|-------|
| Existing account fields | unchanged | Preserve feature 001 identity and credential contracts |
| `displayName` | string | Required; trimmed; 1–100 characters; voter-facing and not unique |
| `schemaVersion` | integer | `2` after migration |

### Account display-name rules

- New account signup requires an explicit display name.
- Host-created provisional accounts require a display name.
- Existing accounts with email derive display name from all characters before the first `@` in the stored email string.
- Legacy phone-only accounts receive stable privacy-safe names `Participant 1`, `Participant 2`, and so on in immutable account order.
- Display names may be duplicated and never replace immutable account IDs for ownership.

## Event schema version 2

| Field | Type | Rules |
|-------|------|-------|
| Existing event fields | unchanged | Preserve feature 001 contracts |
| `categories` | array of Category | Required; 1–100 items |
| `schemaVersion` | integer | `2` after migration |

## Category embedded document

| Field | Type | Rules |
|-------|------|-------|
| `_id` | immutable identifier | Unique within event; generated server-side |
| `title` | string | Trimmed; 1–120 characters |
| `titleNormalized` | string | Trimmed, case-folded title used for uniqueness |
| `isDefault` | boolean | Exactly one category per event is `true` |
| `createdAt` | date | Immutable |
| `updatedAt` | date | Changes when title changes |

### Category invariants

- Every event has between 1 and 100 categories.
- Exactly one category is default; renaming does not change that designation.
- `titleNormalized` is unique within an event.
- Categories cannot be deleted, reordered, or moved in this feature.

## EventRegistration schema version 2

| Field | Type | Rules |
|-------|------|-------|
| Existing registration fields | unchanged | Preserve status and ownership lifecycle |
| `entries` | array of Entry | Required; 1–100 items for every active or removed registration after migration |
| `schemaVersion` | integer | `2` after migration |

## Entry embedded document

| Field | Type | Rules |
|-------|------|-------|
| `_id` | immutable identifier | Unique within registration; generated server-side |
| `categoryId` | identifier | References one category on the same event |
| `title` | string | Trimmed; 1–160 characters |
| `createdByAccountId` | account identifier | Event host for host registration; participant account for self-registration |
| `createdAt` | date | Immutable |
| `schemaVersion` | integer | Starts at 1 |

### Entry invariants

- Entry ownership is inherited from the containing event registration.
- Every entry category exists on the registration's event.
- Entry titles need not be unique.
- Every host-managed and self-service registration contains 1–100 entries.
- Entries are created with registration and cannot be edited, deleted, transferred, or reordered in this feature.

## Relationships

```text
Account (host) 1 ── * Event
Event 1 ── 1..100 Category (embedded)
Event 1 ── * EventRegistration
Account (participant) 1 ── * EventRegistration
EventRegistration 1 ── 1..100 Entry (embedded for active new registrations)
Entry * ── 1 Category (same Event)
```

## State transitions

### Event creation

1. Validate event title.
2. Generate event and default category identifiers.
3. Set default category title to `{trimmed event title} participants`.
4. Insert one schema-version-2 event document.

### Category creation

1. Verify viewer owns event.
2. Normalize and validate title.
3. Atomically reject duplicate normalized title or category limit.
4. Append category and update event timestamp.

### Category rename

1. Verify viewer owns event and category belongs to event.
2. Normalize and validate title.
3. Atomically reject collision with any other category.
4. Update title, normalized title, and timestamps.

### Participant registration with entries

1. Verify viewer owns event.
2. Validate required email, optional phone, and 1–100 entry inputs.
3. Verify every category identifier belongs to event.
4. Begin transaction.
5. Reuse or create provisional account.
6. Create or revive registration with all entries; ownership display resolves from the participant account's display name.
7. Persist idempotency result and commit.
8. On any failure, abort transaction and preserve submitted UI values.

### Registration removal/revival

- Removing a registration retains embedded entries with the removed record for audit and possible revival.
- Revival through the new flow replaces entries with the newly submitted complete entry set.

## Indexes and query patterns

- Preserve event unique `publicId` and owner/recent indexes.
- Preserve registration unique `(eventId, accountId)` and event/status indexes.
- Add multikey event index on `(ownerAccountId, categories._id)` only if explain-plan evidence shows category mutation lookup requires it; `_id` event targeting remains primary.
- Category-grouped detail loads one event and active registrations, projects embedded entries, then groups by the event's stable category order.
- Participant summary loads active registrations and derives `entryCount` from each embedded array; public entry ownership resolves only account display names.

## Migration 002

1. Process every account in immutable-ID order; derive display name from email prefix or assign a stable phone-only fallback, then mark version 2.
2. Process events in immutable-ID order using checkpoints.
3. For each schema-version-1 event, generate one default category and update to version 2.
4. Load all active and removed registrations ordered by `createdAt`, then `_id`.
5. Add one entry titled `Entry {position}` in the default category, preserve registration status, and mark version 2.
6. Re-running skips completed documents and deterministically resumes incomplete accounts, events, and registrations.
7. Use transitional validators that accept version 1 and 2 documents while implementation tasks deploy independently.
8. At contract activation, rerun catch-up migration, verify no version-1 documents remain, then apply strict version-2 validators before serving the new schema.
9. Emit counts and failures without display names, titles, email addresses, or phone numbers.
