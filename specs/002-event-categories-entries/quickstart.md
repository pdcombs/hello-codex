# Quickstart: Event Categories and Entries

## Prerequisites

- Node.js 24 and pnpm 11
- Docker Desktop running
- Local ports 5173, 4000, 27017, 8025, and 1025 available
- Feature specification and contract reviewed

## Start production-equivalent local dependencies

```bash
docker compose up -d --wait
docker compose ps
```

MongoDB must report healthy and operate as the configured single-node replica set before integration tests or the API begin.

## Install and run

```bash
pnpm --dir votiy-api install --frozen-lockfile
pnpm --dir votiy-web install --frozen-lockfile
pnpm dev
```

Open <http://127.0.0.1:5173> and Mailpit at <http://127.0.0.1:8025>.

## Critical validation flow

1. Register with a display name, verify, and sign in as a host.
2. Create `Peyton's event`.
3. Confirm the Setup tab contains one default category named `Peyton's event participants`.
4. Rename the default category and add a second category.
5. Register a participant with required display name and email, no phone, and one titled entry; confirm the first category defaults correctly.
6. Register another participant with optional phone and three entries split across both categories.
7. Confirm every entry appears under its chosen category with title and account display-name owner.
8. Open Participants and confirm each participant appears once with the correct entry count.
9. Open an OPEN event as another verified account, confirm one entry row is prepopulated to the default category, enter its title, and self-register.
10. Confirm the self-registered entry uses the account display name and selected category.
11. Confirm the second account cannot mutate event categories.
12. Submit invalid entry title/category values and confirm field errors preserve all unsaved rows.

## Existing-data migration validation

1. Seed schema-version-1 email accounts, a phone-only account, an event, and both active and removed registrations.
2. Start the API and wait for readiness.
3. Verify email accounts use the prefix before `@` as display name and the phone-only account uses a stable `Participant {n}` fallback.
4. Verify one default category was created.
5. Verify every active and removed registration ordered by creation time and ID received `Entry 1`, `Entry 2`, and so on without changing status.
6. Restart the API and verify no duplicate names, categories, or entries are created.

## Quality gates

```bash
pnpm --dir votiy-api test:unit
pnpm --dir votiy-api test:contract
pnpm --dir votiy-api test:integration
pnpm --dir votiy-api test:coverage
pnpm --dir votiy-web test:coverage
pnpm --dir votiy-web build
pnpm test:e2e --project=chromium
pnpm test:e2e --project=mobile-chromium
```

Expected: all tests pass, repository line and branch coverage remains at least 80%, no personal contact data appears in logs, and the production build succeeds.

## Post-deploy smoke

- `/health` confirms process availability.
- `/ready` confirms migration and MongoDB readiness.
- Anonymous event detail returns category-grouped entries without contact data.
- A synthetic host can read setup and participant summary without performing destructive mutations.
- Migration failures, setup error spikes, or smoke failures block or roll back the release.
