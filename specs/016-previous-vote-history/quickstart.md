# Quickstart: Validate Previous Vote History

## Prerequisites

- Local MongoDB replica set and app.
- Code event with two ballots on one browser; account event with ballots across devices; closed event with prior ballot.

## Commands

```bash
npm --prefix votiy-api run test:coverage
npm --prefix votiy-web run test:coverage
npm --prefix votiy-web run lint
npm --prefix votiy-web run build
npx playwright test tests/e2e/event-ballot.spec.js --project=chromium --project=mobile-chromium
node --check tests/smoke/production-smoke.js
git diff --check
```

Validated 2026-08-31:

- API: 114 files, 319 tests; 89.97% lines, 80.78% branches.
- Web: 48 files, 175 tests; 86.28% lines, 80.52% branches.
- Lint, build, formatting, syntax, and diff checks passed.
- Desktop/mobile E2E projects started; 14 scenarios skipped without seeded event/code/account environment values.

## CUF-001

Return to event, select **Vote**, choose **View previous votes**, verify history without code.

## CUF-002

Review code A and B ballots newest first. Page with size one; load more returns other exactly once.

## CUF-003

Try another account/browser and host-only identity; verify no foreign ballot/action.

## CUF-004

Close event, open direct history, review ballots, verify no repeat-vote action.

## CUF-005

From open history start another vote; verify new unused code remains required.

## Rollback

Roll back code only. Keep ballots and additive indexes. Verify Feature 015 code uniqueness remains active.
