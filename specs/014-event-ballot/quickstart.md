# Quickstart: Cast Event Ballot Validation

## Prerequisites

- Local MongoDB replica set and app running.
- Open events for single, multiple, ranking, account, unrestricted, and code policies.
- Multi-category event with enough entries for scrolling.

## Automated validation

```bash
npm --prefix votiy-api run test:coverage
npm --prefix votiy-api run test:integration
npm --prefix votiy-web run test:coverage
npm --prefix votiy-web run lint
npm --prefix votiy-web run build
npx playwright test tests/e2e/event-ballot.spec.js --project=chromium
npx playwright test tests/e2e/event-ballot.spec.js --project=mobile-chromium
node --check tests/smoke/production-smoke.js
```

Expected: 80% line/branch floors and all ballot integrity paths pass.

Validated 2026-08-31:

- API: 308 tests; 90.37% lines and 80.70% branches. Real-Mongo integration: 51 passed.
- Web: 163 tests; 85.18% lines and 80.07% branches. Lint and production build passed.
- Feature E2E: desktop/mobile projects load successfully; 8 scenarios skip until `E2E_OPEN_VOTING_EVENT_PUBLIC_ID` identifies a seeded open event.

## CUF-001: Complete and review

1. Enter open ballot through **Vote**.
2. Select single/multiple choices; start and reorder complete ranking; leave category blank.
3. Verify sticky action never covers last entry.
4. Cancel confirmation, verify choices stay, then submit.
5. Confirm completion and exact server-saved read-only choices.

## CUF-002: Validation and stale state

1. Submit empty ballot; sheet stays closed and error appears.
2. Violate multiple bounds; category guidance appears.
3. Close voting or change rules before confirm; submission fails and choices remain.

## CUF-003: Durable private review

1. Reload completed ballot as same account, unrestricted browser, and code-derived browser.
2. Confirm latest ballot appears without code re-entry.
3. Try host, another account, and browser; choices never appear.
4. When repeat rules allow, use **Cast another vote**; prior ballot remains immutable.

## CUF-004: Idempotency

1. Lose response and retry same submission attempt; same ballot returns and count stays one.
2. Reuse attempt key with changed choices; conflict occurs and no second ballot appears.

## Operations and rollback

- Logs/audits contain no category IDs, entry IDs, titles, codes, markers, or contact data.
- Roll back code only; preserve version-2 ballots and snapshots.
