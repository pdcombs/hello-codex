# Quickstart: Open / Close Voting Validation

## Prerequisites

- Local MongoDB replica set healthy.
- Host event with configured rules and at least one active entry.
- Additional account, anonymous browser, code-policy event, and unused voting code.

```bash
docker compose up -d --wait
corepack pnpm dev
```

## Automated validation

```bash
corepack pnpm --dir votiy-api test:coverage
corepack pnpm --dir votiy-web test:coverage
corepack pnpm --dir votiy-web lint
corepack pnpm --dir votiy-web build
corepack pnpm test:e2e tests/e2e/open-close-voting.spec.js --project=chromium
corepack pnpm test:e2e tests/e2e/open-close-voting.spec.js --project=mobile-chromium
node tests/smoke/production-smoke.js
```

Expected: 80% line/branch floors and all state, ownership, code concurrency, repeat-limit, return-path, accessibility, privacy, and smoke checks pass.

## CUF-001: Host state control

1. Confirm existing event starts closed after migration.
2. Open configured event; confirm banner, Vote action for host/anonymous viewer, version increment, and audit.
3. Close from another session; confirm stale action conflicts, banner/action disappear, summary states closed, and submission rejects.
4. Reopen; confirm rules, dates, ballots, code statuses, limits, and histories remain unchanged.

## CUF-002: Unrestricted access

1. Open unrestricted event and select Vote anonymously.
2. Confirm fresh allowed decision and `/events/:publicId/vote` placeholder.
3. Close between render and click; confirm denial and no navigation.
4. For browser-limited policy with prior ballot marker, confirm repeat denial.

## CUF-003: Account access and return

1. Select Vote anonymously on account-required event.
2. Confirm requirement message and sign-in action with safe relative return path.
3. Follow sign-in and registration/verification variants; confirm return to event.
4. Confirm completed account below limit proceeds; incomplete or exhausted account does not.

## CUF-004: Generated code

1. Select Vote on open code event; confirm focused modal.
2. Submit invalid and used codes; confirm safe retry.
3. Submit one unused code concurrently in two browsers; exactly one navigates.
4. Confirm used code retained, one account/browser-bound access grant, and safe audits.
5. Open code event with zero unused codes; confirm host warning and settings link while event stays open.

## Operations and rollback

- Track transition/access/claim latency, denial reasons, conflicts, and code-claim failure rate with correlation IDs.
- Alert above 5% unexpected errors, two-second p95, state transition failures, or repeated claim-conflict spike.
- Roll back code only. Do not delete `votingState`, access grants, codes, ballots, or audits; do not restore consumed codes or reset limits.

## Validation record

- API combined coverage: 111 files and 306 tests passed; 90.43% lines and 80.82% branches.
- Web component/regression: 46 files and 163 tests passed; 86.36% lines and 80.43% branches.
- Web lint and production build passed.
- Rollback review confirmed close/reopen paths do not delete or reset state/history.
