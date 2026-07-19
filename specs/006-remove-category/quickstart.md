# Quickstart: Validate Remove Category

## Prerequisites

- Node.js 24.x and repository pnpm version.
- Local MongoDB replica set and Mailpit running per root README.
- Host-owned event with at least three categories: populated default, populated non-default, and empty category.
- Non-host account and pre-archived entry fixture.

## Automated gates

```sh
corepack pnpm format:check
corepack pnpm --dir votiy-api test:coverage
corepack pnpm --dir votiy-web lint
corepack pnpm --dir votiy-web test:coverage
corepack pnpm build
corepack pnpm test:e2e
```

Expected: all suites pass with at least 80% repository line and branch coverage.

## Migration and contract validation

1. Run migration 004 on legacy, active, archived, partially migrated, and rerun fixtures.
2. Verify lifecycle fields and validator enforcement without identity/title/default/timestamp corruption.
3. Compose [schema-extension.graphql](./contracts/schema-extension.graphql) with active schema.
4. Verify all existing operations remain valid and archived categories are absent from active reads/choices.
5. Validate transaction behavior against [persistence.md](./contracts/persistence.md).

## Critical flow 1: Populated non-default category

1. Sign in as host and edit a populated non-final category.
2. Select Remove category; verify warning states every entry will be removed and shows count.
3. Cancel; verify no changes.
4. Reopen and confirm once.
5. Verify category and entries disappear from event/category/participant views.
6. Verify archived database records and identifier-only audits remain.

## Critical flow 2: Default promotion

1. Record remaining active categories ordered by creation time and identity.
2. Remove populated default category.
3. Verify oldest remaining category becomes default atomically.
4. Retry same request; verify stable result and no duplicate audits.

## Final-category and concurrency protection

- Edit only active category; verify disabled/unavailable removal with explanation.
- Submit direct removal anyway; verify rejection and zero writes.
- Attempt concurrent removal of two remaining categories; verify at most one succeeds and one active default remains.
- Add/archive/edit an entry or rename category after confirmation opens; verify stale rejection and zero partial archival.
- Force audit/idempotency failure after writes; verify full rollback.

## Title reuse and compatibility

- Archive category, then create same-title category; verify new ID, active empty state, and untouched archived history.
- Verify Add Entry rejects archived category ID and accepts new same-title category ID.
- Re-run category title editing, individual entry archival, participant cards, Add Entry, and public-event flows.

## Accessibility and responsive checks

- Complete remove/cancel keyboard-only; verify initial focus, focus trap, Escape, pending disable, announced warning/error, and return focus.
- Verify one-category explanation is associated with disabled control.
- Validate narrow/short mobile and desktop layouts without overflow or unreachable actions.

## Privacy and observability

- Confirm logs include operation, outcome, duration, correlation ID, affected entry count, and default-promoted boolean only.
- Confirm audits/logs contain no category/entry title, display name, email, or phone.
- Exercise p95, error/conflict/denial, invariant, and migration queries plus alerts.

## Production smoke and rollback

1. Deploy exact CI-tested `main` commit.
2. Create a uniquely named category and synthetic entry in a dedicated event.
3. Archive category and verify active category/participant projections and database-level audits.
4. Confirm another active default always remains.
5. On failure, roll back application commit; do not reverse migration or delete archived records.
