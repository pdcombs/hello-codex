# Quickstart: Review Voting Results

## Validate

```bash
pnpm --dir votiy-api test:unit
pnpm --dir votiy-api test:contract
pnpm --dir votiy-api test:integration
pnpm --dir votiy-web test
pnpm --dir votiy-web build
pnpm exec playwright test tests/e2e/event-results.spec.js
```

## Scenarios

1. Host opens zero-ballot event: zero votes, all entries zero, no winners.
2. Single and multiple ballots: exact counts, descending order, co-winner highlights.
3. Five-entry ranking: positions score 4, 3, 2, 1, 0; totals aggregate across ballots.
4. Archived selected entry remains visible with ballot-time title.
5. Non-host direct query and route expose no results.
6. Submit new ballot, refresh results, and observe updated totals.

See [GraphQL contract](contracts/schema-extension.graphql) and [data model](data-model.md).
