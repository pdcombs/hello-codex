# Quickstart: Entry-Derived Participants

## Prerequisites

- Node.js 24 and pnpm 11
- Docker Desktop running
- Local ports 5173, 4000, 27017, 8025, and 1025 available
- Feature specification, [data model](./data-model.md), and [GraphQL contract](./contracts/schema.graphql) reviewed

## Start production-equivalent dependencies

```bash
docker compose up -d --wait
docker compose ps
```

MongoDB must be healthy and running as the configured single-node replica set before migration or transactional integration tests.

## Install and run

```bash
pnpm --dir votiy-api install --frozen-lockfile
pnpm --dir votiy-web install --frozen-lockfile
pnpm dev
```

Open <http://127.0.0.1:5173> and Mailpit at <http://127.0.0.1:8025>.

## Critical validation flow

1. Sign in as an event host and open an event with at least two categories.
2. Add participant Peyton with three entries across the categories.
3. Open Participants and confirm one Peyton card shows display name, email subtitle, all three entry titles, and right-aligned count `3`.
4. Remove one Peyton entry and confirm the action requires confirmation.
5. Confirm that entry disappears from its category and card, the count becomes `2`, Peyton remains a participant, and an archive audit event exists.
6. Remove Peyton's second entry and confirm the card count becomes `1`.
7. Remove the final entry and confirm Peyton disappears from Participants while the account and all archived entry history remain.
8. Add entries for another account, choose Remove participant, confirm the dialog states the affected entry count, and approve.
9. Confirm all that account's active entries disappear together from categories and Participants and remain archived.
10. Confirm entries belonging to the same account in another event remain active.
11. Confirm duplicate entry titles appear separately and contribute separately to the count.
12. Open an event with no active entries and confirm the participant empty state.

## Authorization and privacy validation

1. As a non-owner, attempt the participant query and both archive mutations; confirm every operation is denied without changes.
2. As an anonymous viewer, load public event details; confirm entry owner display names may appear under existing policy but email addresses never appear.
3. Inspect application and audit logs after successful, denied, and failed removals; confirm they contain operation, IDs/count, outcome, duration, and correlation ID but no email, phone, display name, or entry title.

## Migration 003 validation

1. Seed active and removed version-2 registrations with embedded entries, including multiple entries for one owner and entries across events/categories.
2. Start the API and wait for readiness.
3. Confirm each embedded entry has one standalone record with the same ID, event, category, owner, creator, title, and creation time.
4. Confirm active registration entries migrated as active and removed registration entries migrated as archived with legacy reason/time.
5. Confirm the participant set equals distinct owners of active standalone entries and removed legacy registrations do not create active cards.
6. Restart the API and confirm no duplicate entries or changed archival timestamps.
7. Seed an invalid category/account reference and confirm readiness fails with privacy-safe diagnostics until repaired.

## Quality gates

```bash
pnpm --dir votiy-api test:unit
pnpm --dir votiy-api test:contract
pnpm --dir votiy-api test:integration
pnpm --dir votiy-api test:coverage
pnpm --dir votiy-web test:coverage
pnpm --dir votiy-web lint
pnpm --dir votiy-web build
pnpm test:e2e --project=chromium
pnpm test:e2e --project=mobile-chromium
```

Expected: all tests pass; line and branch coverage remain at least 80%; every authorization/archive decision path is covered; no personal contact or entry-title data appears in logs; build succeeds.

## Post-deploy smoke and rollback

- `/health` confirms process availability.
- `/ready` confirms MongoDB and migration 003 readiness.
- Public event detail returns only active category entries and no contact data.
- A synthetic host reads participant cards and sees counts matching active category entries.
- Smoke creates an isolated synthetic event entry, archives it, confirms it leaves active views, and verifies its archived database record remains; no real user fixture is mutated.
- Smoke verifies the deployed commit header matches the tested commit.
- Migration failure, participant-read failure, or archive error spike blocks/rolls back deployment.
- Rollback deploys the previous commit without deleting `eventEntries`; embedded registration history remains available throughout the compatibility window.

## Usability validation

1. Ask at least ten first-time host testers to locate a participant's name, email, entry titles, and count from one card; record whether each completes the task within 10 seconds.
2. Ask each tester to explain what makes an account an event participant without prompting; record whether they identify active entry ownership.
3. The feature passes when at least 90% complete both checks; record anonymized aggregate results in the feature checklist.
