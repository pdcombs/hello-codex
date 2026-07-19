# Persistence Contract: Add Entries

## Account contact prefix lookup

Input: authorized event ID, normalized search text, limit `1..10`.

- Fewer than three searchable characters: validation failure; no account read.
- Email-like text: prefix range on non-null `emailNormalized`.
- Phone-like text: strip presentation characters, retain normalized international prefix, then prefix range on non-null `phoneNormalized`.
- Output: at most limit account documents, deterministic `_id` tie-break.
- Query plans MUST use corresponding normalized contact index; collection scan fails integration acceptance.
- Search string and returned contact values MUST NOT appear in logs, metrics labels, or audit metadata.

## Recent event-owner lookup

Input: authorized event ID, limit `1..10`.

- Filter `eventId` and `status=active`.
- Order entry documents by `createdAt DESC`, `_id DESC`.
- Return first distinct owner IDs until limit reached.
- Hydrate accounts without changing preserved owner order.
- Archived-only owners excluded.
- Query plan MUST use `entry_event_recent_owners` index.

## Owner recency enrichment

For global account matches, read active entries in target event for matched owner IDs and project each owner's maximum `createdAt`. No match yields `isEventParticipant=false`, `latestEntryCreatedAt=null`.

## Transactional single-entry creation

Transaction inputs: actor, event, category, title, idempotency key, one owner source.

Required outcome:

1. Reauthorize actor against event.
2. Verify category belongs to event.
3. Resolve account ID or exact normalized provisional contacts.
4. Reuse one account, reject conflicting identities, or create one provisional account.
5. Insert exactly one active `eventEntries` document.
6. Insert idempotency record referencing entry and resolved owner.
7. Commit all or none.

Unique account contact indexes arbitrate concurrent provisional creation. Duplicate-key conflict triggers exact re-read inside retryable transaction path; it never creates duplicate accounts or entries.

## Audit contract

Successful creation records actor account ID, event ID, category ID, entry ID, owner account ID, provisional-created boolean, outcome, correlation ID, and time. Denied/failure records exclude entry/contact/title data not committed or needed. No email, phone, display name, search text, or entry title stored in audit metadata.
