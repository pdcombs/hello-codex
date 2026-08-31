# Data Model: Previous Vote History

## Ballot History Page

- `nodes`: authorized immutable ballots, newest first
- `nextCursor`: opaque continuation token or null
- `hasMore`: whether another page exists
- Event header/status needed for review actions

## History Cursor

- Submission timestamp
- Ballot identity tie-breaker
- Encoded opaquely and validated

Continuation selects earlier timestamps, or same timestamp with lower identity.

## History Identity

- Signed in: event plus account identity only
- Signed out: event plus browser marker digest only
- Missing identity: empty/private-safe result
- Host ownership adds no access

## History Item

Existing immutable ballot projection:

- Ballot identity and submission time
- Rules/voting state versions
- Ordered category snapshots
- Ordered entry snapshots/ranks
- No code identity, account identity, or browser marker returned

Legacy ballots use compatible label fallback without mutation.

## Indexes

- Event, account, submission time descending, ballot identity descending
- Event, browser digest, submission time descending, ballot identity descending

Both additive, identity-scoped, and aligned with page sort.

## State

```text
code prompt -> View previous votes -> history loading -> history page
history page -> Load more -> append stable page
history page open + voting open -> Cast another vote -> new-code gate
history page + voting closed -> review only
```
