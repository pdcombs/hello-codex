# Quickstart: Defer Voting Code Consumption

## Prerequisites

- Local MongoDB test dependency available
- Workspace dependencies installed

## Validation

```bash
corepack pnpm --dir votiy-api test:unit
corepack pnpm --dir votiy-api test:contract
corepack pnpm --dir votiy-api test:integration
corepack pnpm --dir votiy-web test
corepack pnpm build
```

## Critical Scenarios

1. Request access, abandon form, reuse code. Inventory remains `UNUSED`.
2. Submit ballot. One ballot exists; inventory shows `USED` with matching relationship.
3. Validate same code from two browsers, submit concurrently. One succeeds; loser receives `ACCESS_CODE_USED`.
4. Force submission audit failure. Ballot rolls back; code stays `UNUSED`.
5. Retry accepted idempotent submission. Original receipt returns; no duplicate.
6. Reconcile used codes with and without ballots. Ballot-backed stays used; orphan becomes unused.

See [contract](contracts/voting-code-lifecycle.md) and [data model](data-model.md).
