# Persistence Contract: Category Archival

## Migration 004

- Select event categories missing lifecycle status.
- Set `status: "active"`, `archiveReason: null`, `archivedAt: null`, and `archivedByAccountId: null` without changing IDs, titles, defaults, or timestamps.
- Advance event schema version while preserving event business update time.
- Safe to rerun; already active/archived categories are unchanged.
- Enforce validator only after migration completes.

## Transaction read boundary

1. Load event by ID in session and require actor ownership.
2. Require event/category timestamps equal expected values.
3. Locate active category and require at least one other active category.
4. Read active entries by event/category in session.
5. Require exact submitted/persisted entry ID sets and matching update timestamps.
6. If removing default, choose oldest remaining active category by `createdAt`, then `_id`.

## Conditional event write

Filter includes:

- Event ID and owner ID.
- Expected event and category timestamps.
- Target category active status.
- Existence of a different active category.

Update:

- Set target category lifecycle to archived with reason, actor, and shared timestamp.
- Preserve archived category identity/title/default history.
- If needed, set deterministic replacement category as active default.
- Advance event update timestamp once.

No match returns conflict and aborts the transaction.

## Conditional entry cascade

- Filter by event ID, category ID, active status, and validated IDs/timestamps.
- Set archived status, `category_removed` reason, actor/time, and shared update time.
- Matched and modified counts must equal validated active snapshot size.
- Empty category performs no entry write.

## Transaction contents

- Conditional event/category archive and default promotion.
- Conditional entry cascade.
- One category audit and one audit per newly archived entry.
- Idempotency record.

Any error aborts every write.

## Idempotency

```text
scope = actorAccountId:eventId
operation = archiveEventCategory
key = input.idempotencyKey
```

- Same digest: return current hydrated active event without replaying archival/audits.
- Changed digest: conflict.
- Failed transaction: no idempotency record.

## Active read compatibility

- Event/category projections, title uniqueness, category choices, and entry creation include active categories only.
- Participant projections already derive from active entries; category cascade therefore removes affected participants only when no other active entries remain.
- Archived category title does not participate in active-title uniqueness.
