# Quickstart: Validate Add Entries

## Prerequisites

- Node.js 24.x and pnpm version declared by repository.
- Local MongoDB replica set and Mailpit running per root README.
- Current feature spec selected in `.specify/feature.json`.
- Test host account, event with empty and populated categories, existing participant, nonparticipant account, and unused test contact.

## Static and automated gates

```sh
corepack pnpm format:check
corepack pnpm --dir votiy-api test:coverage
corepack pnpm --dir votiy-web lint
corepack pnpm --dir votiy-web test:coverage
corepack pnpm build
corepack pnpm test:e2e
```

Expected: all suites pass; API and web each retain at least 80% line and branch coverage.

## Contract validation

1. Compose [schema-extension.graphql](./contracts/schema-extension.graphql) with active feature 003 schema.
2. Verify current queries/mutations remain valid.
3. Verify owner choice rejects anonymous/nonmanager requests without choice data.
4. Verify search under three characters fails validation; `first > 10` is rejected or clamped to 10 per finalized resolver contract.
5. Verify creation rejects zero or two owner sources and returns field-addressable errors.
6. Verify persistence validators and all existing indexes remain, plus `entry_event_recent_owners`.

## Critical flow 1: Recent participant

1. Sign in as host; open event with active participants.
2. Select Add entry on empty category.
3. Confirm dialog asks “Who is this entry for?” and recent owners appear newest first, once each.
4. Select recent owner, advance, enter title, save.
5. Confirm modal closes, focus returns, entry appears in originating category, participant count increases without duplicate card.

## Critical flow 2: Global contact search

1. Open Add entry on populated category.
2. Enter fewer than three contact characters; confirm no global result disclosure.
3. Continue typing known email prefix or normalized phone digits; confirm current bounded matches appear within one second.
4. Change text before response; confirm stale results never replace current choices.
5. Select nonparticipant account and save title.
6. Confirm new owner appears once on participant page.

## Critical flow 3: Provisional owner

1. Search complete unused valid test contact and reach no-results state.
2. Choose provisional creation, enter display name, confirm contact.
3. Save entry.
4. Confirm provisional account and entry commit together, entry owner is correct, and participant appears once.
5. Repeat same idempotency key; confirm no duplicate account or entry.

## Failure and concurrency

- Remove/rename category after modal opens; save rejects and preserves input.
- Revoke manager access before lookup/save; no contacts or writes returned.
- Force transaction failure after provisional insert; confirm neither account nor entry persists.
- Concurrently create same provisional contact; confirm one account identity and intended entries only.
- Submit same key with changed title/owner; confirm conflict.
- Simulate transient response loss; retry returns original result.

## Accessibility and responsive validation

- Complete all flows keyboard-only: focus trap, step headings, listbox selection, Back, Cancel, Escape, Save, error announcement, and focus return.
- Validate current mobile and desktop Playwright projects.
- Confirm modal scrolls internally at narrow/short viewports and actions remain visible.
- Confirm reduced-motion setting does not block step changes.

## Privacy and observability

- Inspect logs/audit fixtures: no search text, display name, email, phone, or entry title.
- Confirm structured logs include operation, outcome, duration, count, correlation ID.
- Confirm audit includes actor/event/category/entry/owner IDs and provisional-created boolean.
- Exercise dashboard queries for owner-choice p95/error/denial and entry-create success/error/conflict.
- Trigger test alert thresholds and verify user impact plus first diagnostic step.

## Production smoke and rollback

1. Deploy exact CI-tested `main` commit.
2. Use dedicated synthetic event/category/account to run bounded lookup, idempotent entry creation, category/participant verification, and entry archive cleanup.
3. Confirm readiness and smoke success.
4. On failure, roll back application commit. Additive schema/indexes and created entry documents need no reversal.
