# Data Model: Find Events Search

## Event Schema Version 4

Feature extends existing `events` document. Ownership and public route identity remain unchanged.

### Added fields

| Field | Type | Rules | Purpose |
|---|---|---|---|
| `visibility` | enum | `public`, `private`, `unlisted` | Discovery/direct-view policy |
| `lifecycleStatus` | enum | `active`, `archived` | Active or permanent historical state |
| `archivedAt` | nullable date | Required null unless archived | Archive timestamp |
| `archivedByAccountId` | nullable object ID | Host when archived | Archive actor |
| `searchTitleNormalized` | string | Required; max 120 | Verification/relevance |
| `searchDescriptionNormalized` | string | Required; max 2,000 | Verification/relevance |
| `searchLocationNormalized` | string | Required; max 300 | Verification/relevance |
| `searchTitleGrams` | string array | Unique 2/3-grams; max 256 | Title relevance candidates |
| `searchDescriptionGrams` | string array | Unique 2/3-grams; max 4,096 | Description relevance candidates |
| `searchLocationGrams` | string array | Unique 2/3-grams; max 640 | Location relevance candidates |
| `searchGrams` | string array | Required unique union; max 4,992 | Indexed candidate eligibility |

### Token rules

1. Convert source text to Unicode-normalized lowercase.
2. Fold diacritics and replace punctuation with spaces.
3. Split into alphanumeric words.
4. Drop connective stop words.
5. Retain normalized field strings and generate unique overlapping 2-character and 3-character grams.
6. Enforce stated array bounds. Existing source field limits ensure valid events fit; migration tests cover
   maximum-length inputs and fail safely if projection bounds are exceeded.
7. Never expose token arrays through public API.

Example:

```text
title: "Motorcycle Show"
location: "Rogers, AR"
search terms: motorcycle, show, rogers, ar
query: "motor show in rogers ar"
normalized query terms: motor, show, rogers, ar
```

Query grams select candidates through `searchGrams`; complete normalized terms are verified as middle-word
substrings against normalized fields. Title, location, and description determine relevance score.

### Indexes

- Existing `event_public_id_unique` remains.
- Add compound/multikey `event_search_eligibility_grams` covering lifecycle, visibility, and `searchGrams`.
- Retain `updatedAt` and `_id` in stable pagination sort. Query plan and production-equivalent integration
  tests must confirm intended index use at target fixture scale.

## Event Search Query

Transient validated value, not persisted.

| Field | Type | Rules |
|---|---|---|
| `raw` | string | Trimmed; maximum 120 characters |
| `terms` | string array | At least one normalized term of 2+ characters; maximum 10 terms |
| `digest` | string | One-way digest used to bind cursor; never raw query |
| `first` | integer | 1–20; default 20 |
| `after` | optional opaque cursor | Must decode, verify, match version and query digest |

Invalid query or cursor returns existing validation error contract. Empty/insufficient queries return an
empty successful page so type-ahead idle state is not presented as an error.

## Event Search Result

Read-only public projection.

| Field | Type | Rules |
|---|---|---|
| `publicId` | string | Existing public route identity |
| `title` | string | Existing public event title |
| `description` | nullable string | Existing public description |
| `location` | nullable string | Existing location for public results; null for private |
| `visibility` | enum | `PUBLIC` or `PRIVATE` |

Owner account ID, categories, entries, participants, voting codes, search tokens, and internal event ID are
excluded.

## Event Search Page

| Field | Type | Rules |
|---|---|---|
| `nodes` | result array | 0–20, unique by `publicId` |
| `nextCursor` | nullable string | Present only when another page exists |

## Search Cursor

Opaque signed payload:

| Field | Purpose |
|---|---|
| `v` | Cursor contract version |
| `q` | Query digest |
| `s` | Last result relevance score |
| `u` | Last result `updatedAt` instant |
| `i` | Last result event ID |
| `sig` | Integrity protection derived with existing server secret |

Cursor state transition:

```text
absent -> first page -> nextCursor present -> later page -> nextCursor null
```

A cursor never moves backward. Query change resets cursor and prior nodes.

## Migration

`006-event-search`:

1. Select every schema-version-3 event.
2. Default visibility/lifecycle to `public`/`active`, archive metadata to null, and derive normalized strings
   plus gram arrays.
3. Update document to schema version 4 in bounded batches.
4. Re-run safely until zero version-3 events remain.
5. Install strict version-4 validator after migration.
6. Create search index and verify it is ready before service readiness succeeds.

Migration is idempotent. Failure leaves source fields unchanged and can resume. No event is discoverable
through new query until it has version-4 projection, preventing false matches from incomplete documents.

## Access and Lifecycle

Search eligibility:

```text
lifecycleStatus = active AND visibility IN (public, private)
```

Direct read:

- Public active: full public projection.
- Unlisted active: full public projection by link, absent from search.
- Private active, host: full owner projection.
- Private active, non-host: private summary only.
- Archived, host: archived read-only projection.
- Archived, non-host: not found.

Visibility transitions among public/private/unlisted are host-only while active. Archive transition is
host-only, confirmed, and irreversible. All standard event mutations reject archived events.

The private summary is computed at read time from the same Event record. It is an API response projection,
not a second stored event document. Viewer identity is evaluated for every event-detail request, so a host
always receives the full host projection regardless of whether navigation came from search or elsewhere.

## Visibility Audit Event

Every successful or denied visibility/archive attempt appends one immutable audit/domain event with:
`actorAccountId` when known, `eventId`, `action`, `outcome`, `priorVisibility`, `requestedVisibility`,
`priorLifecycleStatus`, `requestedLifecycleStatus`, `reasonCode`, `correlationId`, and `occurredAt`.
Event title, description, location, search text, and other protected content are excluded.

## Event Detail Access

| Value | Meaning |
|---|---|
| `FULL` | Normal active public/unlisted or host-owned private view |
| `PRIVATE_SUMMARY` | Non-host private title/description/counts only |
| `ARCHIVED_READ_ONLY` | Host historical view with mutations disabled |
