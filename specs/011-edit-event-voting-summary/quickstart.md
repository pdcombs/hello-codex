# Quickstart: Event Details and Voting Summary Validation

## Prerequisites

- Local MongoDB replica set and Mailpit are healthy.
- API and web dependencies are installed.
- API is available at `http://127.0.0.1:4000`.
- Web is available at `http://127.0.0.1:5173`.
- Fixtures include a verified host, public/private events, multiple active categories, and legacy category
  overrides that differ from the event default.

```bash
docker compose up -d --wait
corepack pnpm dev
```

## Automated Validation

```bash
corepack pnpm --dir votiy-api test:coverage
corepack pnpm --dir votiy-web test:coverage
corepack pnpm --dir votiy-web lint
corepack pnpm --dir votiy-web build
corepack pnpm test:e2e tests/e2e/event-details-voting-summary.spec.js --project=chromium
corepack pnpm test:e2e --project=mobile-chromium --grep "event details|voting summary|switch|responsive"
node tests/smoke/production-smoke.js
```

Expected: API and web line/branch coverage remain at least 80%; unit, contract, real-Mongo integration,
component, desktop/mobile E2E, accessibility, privacy, and smoke checks pass.

## CUF-001: Edit Event Details

1. Sign in as the host and open an active event's settings.
2. Confirm current title, description, and location are prefilled.
3. Change all fields and save.
4. Reload settings and the main event page; confirm all changes persist and the public link is unchanged.
5. Search using new title/description/location terms and confirm the event matches.
6. Search using terms unique to removed values and confirm the event no longer matches.
7. Clear description/location, save, and confirm their rows disappear.
8. Attempt equivalent mutation as anonymous/non-host and against an archived event; confirm denial and no data change.
9. Submit two saves with the same expected timestamp; confirm exactly one wins and the other reports conflict.

## CUF-002: Voting Summary Wording and Schedule

For each access policy (`CODE`, `ACCOUNT`, `UNRESTRICTED`) and method (`SINGLE`, `MULTIPLE`, `RANKING`):

1. Configure valid opening/closing instants and the rule combination.
2. Open the main page as host and verify the exact host sentence in the [UI contract](contracts/settings-summary-ui.md).
3. Open as anonymous and signed-in non-host and verify the exact public sentence.
4. Confirm both times use the viewer's local format and show a timezone.
5. Confirm semantic time values equal the stored instants.
6. For multiple choice, confirm both sentences include the saved minimum and maximum.
7. Remove or invalidate either test fixture instant and confirm no partial schedule is rendered.

## CUF-003: Private Summary Minimization

1. Configure a private event with a schedule, code access, completed-account requirement, method, and bounds.
2. Open as a non-host.
3. Confirm the private notice/allowed summary still works.
4. Inspect the response and normalized client event; confirm no schedule, access, repeat policy, method, bounds,
   completed-account value, voting status, capability, or code data exists.
5. Confirm no follow-up voting-capability request occurs.
6. Open as host and confirm full host voting information remains available.

## CUF-004: One Event-Wide Method

1. Use an event whose stored category overrides conflict with its default rule.
2. Open voting settings and confirm exactly one voting-method control and no category rule fieldsets.
3. Save each method and reload; confirm active `categoryRules` output is empty.
4. Open the ballot and verify every active category uses the event method, ignoring dormant overrides.
5. Add a category and verify it uses the same method without rule setup.
6. Configure multiple-choice bounds that one category cannot satisfy; confirm the event cannot report voting
   open or accept a ballot and settings identify the blocking category.
7. Add enough entries and confirm voting becomes eligible without changing the event-wide rule.
8. Confirm stored legacy override values remain unchanged through rule updates and application restart.

## CUF-005: Completed-Account Switch

1. Choose code-required voting.
2. Confirm one switch named `Require completed account`, visible On/Off text, and associated help.
3. Toggle with Space, pointer, and touch; confirm visible focus and state.
4. Confirm ballots-per-account appears only while on.
5. Save each state and reload to verify persistence.
6. Test at 320px width and 200% zoom; confirm 44px target, no horizontal scrolling, and no clipped text.
7. Enable reduced motion and confirm state remains understandable.

## Contract and Integration Checks

- GraphQL composes [schema-extension.graphql](contracts/schema-extension.graphql) and accepts/returns `EventResult`.
- Detail input rejects blank/overlong title and overlong optional values with field errors.
- Repository compare-and-set changes source and every derived search field atomically.
- Legacy `categoryRules` input is accepted but cannot mutate stored dormant overrides.
- Effective-rule resolution and ballot normalization use the event default for all categories.
- Existing ballot receipts retain their prior rule version/method history.
- Schema-version-4 validator and search index require no migration or rebuild.

## Operational Checks

- Successful detail save emits `event.details_updated` once with field names/count and correlation ID.
- Anonymous/non-host denial emits `event.details_change_denied` with a safe reason.
- Logs/audits contain no title, description, location, normalized search content, voting rules, code, or ballot data.
- Dashboard queries expose update success/error counts and p95 duration; alert on sustained error rate above 5%
  or p95 above two seconds.
- `/health` and `/ready` remain healthy; no new secret or environment variable is required.

## Regression and Rollback Checks

- Visibility, archival, photo, category, entry, participant, registration, search, voting-code, and ballot flows remain green.
- CI blocks deployment on feature contract, integration, E2E, accessibility, privacy, coverage, or smoke failure.
- Roll back application code to the prior tested commit without changing event documents.
- Confirm prior code can read preserved category overrides and current event detail/search fields.
- Do not delete or rewrite dormant overrides, accepted ballots, voting codes, voter access, or audits during rollback.

### Rollback verification record — 2026-08-26

Static compatibility and full regression verification passed. Feature 011 adds no required stored field or
data rewrite: schema-version-4 documents remain valid, `categoryRules` input remains accepted, active output
is empty, and dormant `categoryOverrides` survive event-wide rule saves in real MongoDB. Reverting the
application to the prior tested commit therefore requires no database action. A destructive checkout was not
performed in the working tree; API regression (including real MongoDB), web regression, contract tests,
coverage floors, lint, and production build were used to validate the rollback boundary.
