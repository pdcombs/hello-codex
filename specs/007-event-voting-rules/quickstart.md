# Quickstart: Validate Event Voting Rules

## Prerequisites

- Node.js 24.x and repository pnpm version.
- Local MongoDB replica set and Mailpit per root README.
- `VOTING_CODE_ENCRYPTION_KEY` configured with valid 32-byte secret for local/test environment.
- Host account, public visitor, completed account with email/phone, provisional email fixture, and non-host account.

## Automated gates

```sh
corepack pnpm format:check
corepack pnpm --dir votiy-api test:coverage
corepack pnpm --dir votiy-web lint
corepack pnpm --dir votiy-web test:coverage
corepack pnpm build
corepack pnpm test:e2e
```

Expected: all suites pass; line and branch coverage at least 80%; every authorization, time, method, access, limit, and code-race branch exercised.

## Migration and compatibility

1. Run migration 005 against legacy, version-2, partial, version-3, malformed, and rerun fixtures.
2. Verify safe closed draft defaults, stable IDs/categories/timestamps, and strict validator after migration.
3. Validate [schema extension](./contracts/schema-extension.graphql) with active schema.
4. Re-run event/category/entry/participant/account contracts and critical UI flows.

## CUF-001: Host rules

1. Open host event rules; verify safe defaults and voting closed.
2. Configure future opening/closing, every category method, selection bounds, and each access policy.
3. Save once; reload and verify version increment and exact state.
4. Submit stale update and non-host mutation; verify conflict/denial and identifier-only audit.

## CUF-002: Unrestricted ballot

1. Open window and unrestricted/unlimited mode; submit anonymous valid ballot.
2. Submit again; verify success.
3. Switch to browser-limited; submit once, then verify same browser denied and a fresh browser can submit.
4. Verify before-open and at/after-close rejection.

## CUF-003: Account restriction

1. Configure account policy and maximum ballots.
2. Verify anonymous, email-only, or phone-missing accounts fail.
3. Verify completed email/phone account succeeds up to limit and next ballot fails.
4. Verify participant status has no effect on voter access.

## CUF-004/CUF-005: Codes

1. Generate 1,000 codes; verify exact unique lowercase six-character inventory and no plaintext in logs/audits.
2. Submit valid ballot with one code and completed account; verify used status and persistent event access.
3. Submit in no-completed-account mode with new email; verify provisional account, separate voter access, no participant/entry relationship.
4. Race same code from two clients; exactly one ballot/claim succeeds.
5. Force validation, audit, idempotency, and persistence failures; verify code remains unused and all writes roll back.

## Category method enforcement

- Single: exactly one active entry.
- Multiple: unique count within effective min/max.
- Ranking: all active entries exactly once in order.
- Reject stale/archived category or entry IDs and rule-version changes.

## Accessibility and responsive

- Keyboard-only host editor, conditional fields, code inventory, and ballot controls.
- Announced errors/status, focus retention after conflicts, reduced motion, narrow/short viewport without overflow.
- UI controls strictly follow server capability but direct mutation tests prove server denial.

## Privacy and observability

- Verify rule/eligibility/ballot p95 under two seconds and error alerts above 5%.
- Inspect migration/invariant/code-conflict alerts and correlation traces.
- Search logs/audits for synthetic raw codes, email, phone, ballot entry IDs/ranks; expect none outside protected persistence.

## Production smoke and rollback

1. Deploy exact CI-tested `main` commit.
2. Dedicated synthetic host/event configures short future window and code policy.
3. Generate code, submit synthetic ballot, verify code used, access/ballot/audits present, and direct reuse denied.
4. Verify existing public event and host setup flows.
5. On failure roll back application commit; do not reverse migration, delete codes/access/ballots, or rewrite audits.
