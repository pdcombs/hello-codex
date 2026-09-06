# Data Model: Clickable Voting Banner

No persisted entities change.

## Voting Access Interaction State

- `pending`: access request active; disables both triggers
- `error`: current user-visible access failure
- `code`: voting-code modal visible
- `hasHistory`: previous ballot history action available

One state instance serves banner and Vote button.
