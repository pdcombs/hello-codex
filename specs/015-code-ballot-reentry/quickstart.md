# Quickstart: Validate Code Ballot Re-entry

## Prerequisites

- Local MongoDB replica set and app running.
- Open code-protected event with entries and two unused codes.

## Automated validation

```bash
npm --prefix votiy-api run test:coverage
npm --prefix votiy-api run test:integration
npm --prefix votiy-web run test:coverage
npm --prefix votiy-web run lint
npm --prefix votiy-web run build
npx playwright test tests/e2e/event-ballot.spec.js --project=chromium --project=mobile-chromium
node --check tests/smoke/production-smoke.js
git diff --check
```

Expected: 80% line/branch floors and all code-integrity paths pass.

Validated 2026-08-31:

- API: 111 files and 312 tests passed; 90.04% lines and 80.64% branches.
- Web: 47 files and 169 tests passed; 86.34% lines and 80.57% branches.
- Lint, production build, formatting, JavaScript syntax, and diff checks passed.
- Desktop/mobile E2E projects started; 12 scenarios skipped because seeded event/code environment values were not supplied.

## CUF-001: Shared-device second vote

Submit with code A, review it, select **Cast another vote**, supply code B, verify blank ballot, submit, then review B.

## CUF-002: Revisit

Reopen voting on the same browser, verify latest ballot plus **Cast another vote**, then continue with a new code.

## CUF-003: Reuse denial

Retry code A; verify used-code feedback, unchanged review, and no new ballot.

## CUF-004: Race and idempotency

Race two attempts on one code; exactly one persists. Replay winner with same key/payload; original success returns. Verify code backlink.

## CUF-005: Accessibility

Keyboard-open prompt, validate, cancel with Escape, confirm trigger focus restoration, and repeat at 320 CSS pixels/200% zoom.

## Rollback

Roll back application code only. Preserve ballots, codes, grants, idempotency records, audits, and encryption key.
