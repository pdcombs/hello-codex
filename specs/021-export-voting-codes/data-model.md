# Data Model: Export Voting Codes

## VotingCodeInventorySummary

- `usedCount`: codes attached to ballots
- `availableCount`: unused codes eligible for ballots
- `revokedCount`: revoked codes
- `totalCount`: all statuses

Derived per authorized query. Not persisted.

## VotingCodeInventoryRow

- `id`, lowercase `code`, `status`
- `createdAt`, optional `usedAt`
- optional `claimantDisplayName`, `claimantEmail`

Belongs to one event. Existing stored entity unchanged.

## VotingCodeExport

Point-in-time ordered inventory. Columns: Code, Status, Used At, Claimant Name, Claimant Email. Not persisted.

## Ordering

1. Used by newest `usedAt`, ID tie-breaker.
2. Unused by newest `createdAt`, ID tie-breaker.
3. Revoked by newest `createdAt`, ID tie-breaker.
