# Contract Map: Existing API Reuse

No new GraphQL field, mutation, persistence collection, or migration is planned.

## Category Creation

Existing operation: `addEventCategory`

Required input remains:

- `eventId`
- `title`
- `idempotencyKey`

Expected result remains authoritative Event projection. Existing owner authorization, title validation,
uniqueness, audit, and idempotency behavior are unchanged.

## Entry Owner Choices

Existing operation: `entryOwnerChoices`

Required inputs remain:

- `eventId`
- optional `search`
- bounded result count

Results retain recent event participants and matching global accounts. Personal fields remain visible
only to authorized event manager according to existing policy.

## Entry Creation

Existing operation: `createEventEntry`

Required input remains:

- `eventId`
- `categoryId`
- `title`
- either existing `accountId` or existing provisional owner payload
- `idempotencyKey`

Expected result retains created entry and affected derived participant. Server must continue validating:

- authenticated event owner
- category belongs to event and is active
- title and owner payload
- duplicate/replayed request handling

## Event Refresh

Existing event detail query reloads:

- active categories and entries
- category/participant/entry analytics
- event revision and ownership

Participant page retains existing derived participant query. No client-generated participant record is
accepted as success evidence.

## Compatibility

- Existing direct participant operation remains available only for backward compatibility unless a later
  versioned removal is planned.
- Current UI stops calling direct participant creation.
- Existing public registration behavior is outside this host-only feature and remains unchanged.
- Direct non-owner calls to all reused mutations must remain denied.
