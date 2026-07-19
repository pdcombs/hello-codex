# Quickstart: Validate Edit Entry Titles

## Prerequisites

- Node.js 24.x and repository pnpm version.
- Local MongoDB replica set and Mailpit running per root README.
- Host account with owned event containing one category and at least three active entries.
- Non-host account for authorization checks.

## Automated gates

```sh
corepack pnpm format:check
corepack pnpm --dir votiy-api test:coverage
corepack pnpm --dir votiy-web lint
corepack pnpm --dir votiy-web test:coverage
corepack pnpm build
corepack pnpm test:e2e
```

Expected: all suites pass; API and web retain at least 80% line and branch coverage.

## Contract validation

1. Compose [schema-extension.graphql](./contracts/schema-extension.graphql) with active schema.
2. Verify all current queries and mutations remain valid.
3. Reject duplicate entry IDs, invalid titles/timestamps, more than 5,000 entries, and malformed UUIDs with field-addressable errors.
4. Verify old `renameEventCategory`, entry archive, Add Entry, and participant contracts remain unchanged.
5. Verify persistence behavior against [persistence.md](./contracts/persistence.md).

## Critical flow 1: Three entry titles, one save

1. Sign in as event host and open category edit mode.
2. Confirm each active entry title field is prefilled.
3. Change three entry titles.
4. Select Save once.
5. Confirm edit mode closes and all titles appear in category view.
6. Open participant view and confirm same titles and unchanged owners/counts.

## Critical flow 2: Mixed category and entry titles

1. Edit category title and two entry titles.
2. Save once.
3. Confirm all values update together with unchanged entry IDs, owners, category assignment, status, and creation time.

## Validation and recovery

- Submit one blank/overlong title among valid edits. Confirm exact field highlights, typed values remain, and no title persists.
- Correct field and retry. Confirm one completed batch.
- Reuse idempotency key with same payload; confirm replay. Change payload with same key; confirm conflict.
- Cancel edit; confirm no changes.
- Save no-op; confirm no false title-change audit.

## Concurrency and authorization

- Archive an entry after edit form opens, then save; confirm full batch conflict and no partial update.
- Add or rename an entry after form opens; confirm stale snapshot rejection.
- Rename category concurrently; confirm expected-category timestamp conflict.
- Submit as non-host/anonymous user; confirm denial and zero writes/data leakage.
- Force failure after entry updates before idempotency insert; confirm transaction rolls back all titles.

## Accessibility and responsive checks

- Complete edit keyboard-only: enter edit, traverse category/entry fields, correct associated errors, Cancel, Save, and focus return.
- Verify labels include entry owner/context without using placeholder as label.
- Verify errors announced and Save disabled while pending.
- Validate narrow/short mobile and desktop layouts; all fields and actions remain reachable.

## Privacy and observability

- Confirm logs include operation, outcome, duration, correlation ID, changed-entry count, and category-change boolean.
- Confirm logs/audits contain no old/new title text, display names, email, or phone.
- Confirm one `entry.title_changed` audit per effective changed entry and none for unchanged entries/replays/no-op.
- Exercise p95, error/conflict/denial, and critical-flow queries; verify 5%/two-second alerts.

## Production smoke and rollback

1. Deploy exact CI-tested `main` commit.
2. On dedicated synthetic event, rename one synthetic entry and confirm category + participant projections.
3. Restore original synthetic title through same operation.
4. Confirm health/readiness, safe logs, audits, and smoke success.
5. On failure, roll back application commit; additive schema needs no data reversal.
