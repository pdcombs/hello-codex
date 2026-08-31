# Votiy Operations

## Local MongoDB replica set

Event setup writes span multiple collections and require MongoDB transactions. Local MongoDB runs
as the single-node `rs0` replica set; a standalone `mongod` is unsupported.

Start or resume it from the repository root:

```bash
docker compose up -d --wait votiy-database votiy-database-init
docker compose ps
```

`votiy-mongodb-init` is idempotent. It initializes `rs0` only when needed, then exits successfully.
The persistent `mongodb_data` volume retains both application data and replica-set configuration.
Use this API connection string:

```dotenv
MONGODB_URI=mongodb://root:localpassword@127.0.0.1:27017/votiy?authSource=admin&replicaSet=rs0
```

Confirm transaction readiness:

```bash
docker compose exec votiy-database mongosh \
  "mongodb://root:localpassword@127.0.0.1:27017/admin?replicaSet=rs0&directConnection=true" \
  --eval "db.adminCommand('hello').isWritablePrimary"
```

The result must be `true` before starting the API or running integration tests.

### Recovery

1. Run `docker compose logs --tail=100 votiy-database votiy-database-init`.
2. Restart safely with `docker compose up -d --wait --force-recreate votiy-database votiy-database-init`.
3. Re-run the primary-readiness command above.
4. Restart the API after MongoDB becomes primary.

Do not delete `mongodb_data` as a routine recovery step: doing so destroys local data. If the replica
configuration is corrupted, capture `rs.status()` and the container logs before considering a clean
volume reset.

## Core SLIs

- Availability: `/health` and `/ready` success rate
- API latency: GraphQL `POST /graphql` p50 and p95 duration
- Error rate: GraphQL `OperationError` plus HTTP 5xx rate
- Authentication failures: sign-in denied and session expiry events
- Email delivery failures: `email.failed` events
- Deployment health: post-deploy smoke pass/fail rate
- Grouped setup reads: `event.setup_view.completed` latency, category/entry counts, and failure rate
- Entry-derived participant reads: `operation:"event.participants_read"` latency, participant count, and failure rate
- Entry archival: `entry.archived` and `participant.entries_archived` success/error rate
- Add-entry owner lookup: `operation:"entry.owner_choices_read"` p50/p95, errors, denials, and result count
- Add-entry creation: `operation:"event.entry_create"` p50/p95, success, conflict, denial, and rollback rate
- Category batch title update: `operation:"event.category_batch_update"` p50/p95, errors, conflicts,
  denials, changed-entry count, and category-title-changed rate
- Event workspace availability: successful `event.setup_view.completed` divided by successful plus
  unexpected failures over 15 minutes; exclude intentional authorization and not-found responses.
- Event photo: `event.photo_upload` processing p95/error rate and `GET /event-media/:publicId/photo`
  request p95/404 rate. Never query or log image bytes, filenames, metadata, or checksums.
- Event search: `event.search.completed` availability, first-page p95, result count, and failure rate.
- Visibility lifecycle: `event.visibility_changed`, `event.archived`, and
  `event.visibility_change_denied` audit cardinality and denial rate.
- Manual voting: `voting.state_change` and `voting.access_request` latency, failures, denials, and conflicts.
- Code access: `voting.code_claimed` success/conflict rate. Raw codes and browser markers must never be logged.

Manual `events.votingState.status` is authoritative; configured dates are display-only. Alert when unexpected
errors exceed 5%, p95 exceeds two seconds, state transitions fail repeatedly, or code-claim conflicts spike.
For rollback, deploy prior code only. Preserve schema-version-5 state, access grants, codes, ballots, and audits;
never restore consumed codes or reset limits/history.

## Render / Atlas query ideas

- Render logs:
  - `event:"request.completed" operation:"POST /graphql"`
  - `event:"request.completed" status:503`
  - `operation:"authentication.sign_in" outcome:"denied"`
  - `operation:"event.create" outcome:"success"`
  - `operation:"event.category_add" outcome:"success"`
  - `operation:"event.category_rename" outcome:"success"`
  - `operation:"event.setup_view" outcome:"failure"`
  - `event:"migration.stage.completed" migration:"002-event-categories-entries"`
  - `event:"migration.completed" migration:"003-entry-derived-participants"`
  - `operation:"event.participants_read" outcome:"failure"`
  - `operation:"entry.owner_choices_read" outcome:"failure"`
  - `operation:"event.entry_create" outcome:"failure"`
  - `operation:"event.category_batch_update" outcome:"failure"`
  - `event:"event.photo_upload" outcome:"failure"`
  - `operation:"GET /event-media/:publicId/photo"`
- Atlas:
  - connection count and wait queue
  - primary CPU and memory
  - slow query view for `events`, `eventRegistrations`, `sessions`

## Alert thresholds

- Availability below 99% over 5 minutes
- `/ready` failing for 2 consecutive checks
- GraphQL p95 above 2 seconds for 10 minutes
- HTTP 5xx above 2% for 5 minutes
- email delivery failure above 5% for 10 minutes
- Atlas connection pressure above 80% of pool capacity
- post-deploy smoke failure on latest `main` deploy
- grouped setup-view p95 above 2 seconds or failure rate above 2% for 10 minutes
- setup mutation errors above 5% for 10 minutes across participant and category operations
- any `002-event-categories-entries` migration failure or `/ready` migration dependency failure
- any `003-entry-derived-participants` migration failure
- entry archive mutation errors above 5% for 10 minutes
- owner-choice or entry-create errors above 5% for 10 minutes
- owner-choice or entry-create p95 above 1 second for 10 minutes
- category batch-update errors above 5% or p95 above 2 seconds for 10 minutes
- category archive errors above 5% or p95 above 2 seconds for 10 minutes
- any `004-category-archival` migration failure or event with zero active categories
- event workspace availability below 99%, or p95 above 2 seconds, for 15 minutes
- event photo upload failures above 5%, or processing p95 above 3 seconds, for 15 minutes
- event search first-page p95 above 1 second or error rate above 2% for 10 minutes
- any visibility/archive attempt without exactly one corresponding audit event
- ballot submission or private-review errors above 5% for 10 minutes
- ballot screen or submission p95 above 2 seconds for 10 minutes
- any accepted ballot missing its matching privacy-safe `voting.ballot_submitted` audit
- any generated code linked to more than one accepted ballot, or accepted code ballot without exact code linkage
- code-reuse denial spikes above 5% for 10 minutes; first check UI retries and shared-device handoff behavior
- ballot-history read errors above 5% or p95 above 2 seconds for 10 minutes
- any history response containing a ballot outside resolved account-only or browser-only identity scope

## Find Events diagnostics and rollback

1. Query `event:"event.search.completed"` grouped by `outcome`; graph `durationMs` p95 and `resultCount`.
2. Never log raw or normalized query text, titles, descriptions, locations, visitor IDs, email, or phone.
3. Confirm `/ready` succeeds after migration 006 and Atlas uses `event_search_eligibility_grams`.
4. Private results may include title/description but never location; private detail responses must be
   `PrivateEventSummary`, never a partially nulled `Event`.
5. Correlate visibility/archive mutations with exactly one immutable audit event.
6. On failure, roll back the application commit but retain schema-version-4 fields, migration data, search
   index, archive metadata, and audit history. Older code ignores additive fields.

## Event workspace saved queries

1. Availability: group `event.setup_view.completed` by outcome for 15 minutes; exclude expected
   `FORBIDDEN` and `NOT_FOUND`; alert when success/total is below 99%.
2. Latency: p95 `durationMs` for successful setup-view events; alert above 2,000 ms.
3. Media: p95 `durationMs` for `event.photo_upload` and photo-read request completions; alert upload
   processing above 3,000 ms.
4. Critical journey: require each post-deploy smoke to read summary analytics, visit Participants,
   Results, and Settings, and complete synthetic upload/read/replace/delete.
5. First diagnostic: use correlation ID to join request completion, workspace/photo event, audit event,
   and Atlas metrics at the same UTC minute.

Grouped-view logs contain counts, duration, outcome, and error codes only. They must never include
category titles, entry titles, display names, email addresses, or phone numbers.

Add-entry logs may contain operation, outcome, duration, result count, correlation ID, event/category/
entry/owner IDs, and provisional boolean. Never log search text, display names, email, phone, or entry title.

Category batch-update logs may contain outcome, duration, correlation ID, changed-entry count, safe error
code, and category-title-changed boolean. Never log category or entry title values. A conflict normally means
an entry was added, archived, or edited after the form opened; refresh the event and reapply the intended
changes. Repeated transaction failures require checking Atlas replica-set health and matched-write counts.

Category archival logs may contain operation, outcome, duration, correlation ID, affected entry count,
safe error code, and whether a default was promoted. They must never contain category/entry titles or
account contact fields. Query `event.category_archive` for the two-second p95 and 5% error alerts. Diagnose
conflicts by comparing event, category, and entry timestamps. Migration 004 is additive and idempotent;
rollback the application commit but never reverse the migration, restore archived records, or hard-delete
history. Confirm every event retains exactly one active default category after any incident.

## Add Entries diagnostics

1. Filter owner-choice and entry-create logs by correlation ID and operation.
2. For lookup latency, compare `durationMs` p95 with Atlas slow-query records for `accounts` and
   `eventEntries`; confirm `entry_event_recent_owners` and normalized contact indexes are used.
3. For error rates, group safe error codes. A 5% rate or one-second p95 for 10 minutes pages operator.
4. For conflicts, confirm contact unique indexes and idempotency digest behavior before inspecting records.
5. Run dedicated synthetic fixture only: host account, owned event, category, and reusable host owner.
6. Smoke performs owner lookup, one idempotent entry create, category/participant projection reads, then archive cleanup.
7. Roll back application commit on repeated failure; additive schema/indexes and entry history remain intact.

## Unified Add diagnostics

1. Browser sheet state is transient and must never be logged. Diagnose persistence only through existing
   `event.category_add` and `event.entry_create` operation/correlation records.
2. Group safe error codes by operation. Never log owner search text, category/entry titles, display names,
   emails, phone numbers, or provisional account payloads.
3. If Add succeeds but workspace stays stale, correlate mutation completion with the following
   `event.setup_view.completed` read and compare event revision/counts.
4. If Entry cannot resolve a default category, verify exactly one active event category has
   `isDefault:true`; use category archival/migration diagnostics before changing data.
5. Replayed category/entry saves must return the idempotent result. Duplicate records require checking
   idempotency digest and normalized account identity indexes.
6. Alert when unified Add category/entry failure rate exceeds 5% or successful event refresh p95 exceeds
   two seconds for 10 minutes.
7. Production smoke may mutate only the dedicated synthetic event and must archive created entries or
   categories according to existing audit-retention rules.

## Setup diagnostics and privacy checks

- Mutation error rate: count `OperationError` results for `addEventParticipant`, `registerForEvent`,
  `addEventCategory`, and `renameEventCategory`, divided by total matching operations.
- Setup read latency: query `event:"event.setup_view.completed" outcome:"success"` and graph p50/p95
  `durationMs`.
- Migration outcome: require successful `accounts`, `events`, and `registrations` stage logs before
  readiness; alert on missing stages or startup failure.
- Privacy audit: periodically search logs for `@`, E.164-like phone values, and known synthetic titles
  or display names. Any match outside explicitly redacted fields is an incident.

## Password-reset operations

- Track `password_reset.request`, `password_reset.email`, and `password_reset.complete` by outcome,
  correlation ID, safe reason, and duration. Never log email, token, password, or digest.
- Alert when errors exceed 5%, p95 exceeds two seconds, email delivery fails, or invalid-token denials spike.
- `passwordResetRequests` has no TTL: expiry blocks authorization but records remain for audit.
- Diagnose provider, `APP_ORIGIN`, exact bypass allowlist, and Mongo readiness using correlation ID.
- Roll back code only. Retain reset records, credential versions, password hashes, and revoked sessions.

## Correlation ID diagnostics

1. Copy `X-Correlation-ID` from failing browser response or smoke output.
2. Search Render logs for that correlation ID.
3. Match request completion event with nearby audit or service log lines.
4. If DB issue, inspect Atlas metrics at same UTC minute.
5. If deploy issue, compare `X-App-Commit` header with expected Git SHA.

## Ballot submission and private review

1. Query `operation:"voting.ballot_submit"` by `outcome`, safe `reasonCode`, and `correlationId`; graph p95
   and error rate. Retry with the same idempotency key must return the original ballot, never create a row.
2. Query `operation:"voting.ballot_review"` by outcome and safe reason. A host, public visitor, or different
   voter must never receive another voter's submitted choices.
3. For `RULES_CHANGED`, `VOTING_CLOSED`, or invalid-entry spikes, compare event voting-state/rules versions
   and active entry counts. Do not inspect individual choices to diagnose aggregate failures.
4. Audit metadata may include ballot ID, rules version, voting-state version, category count, outcome, and
   correlation ID. Logs and audits must never include entry IDs, choice order, code, browser marker, email,
   phone, or other voter contact.
5. Production smoke uses only dedicated synthetic fixtures. It proves idempotent replay and host isolation;
   it does not expose or compare synthetic vote choices.
6. For shared-device incidents, correlate `voting.code_reuse_denied`, `voting.code_claimed`,
   `voting.code_consumed`, and `voting.ballot_submitted`. Confirm code A remains attached to ballot A and
   code B to ballot B. Review identity may retrieve latest ballot but must not authorize another submission.
7. A consumed-code retry with a new attempt must return the safe code-required decision. Same-attempt replay
   must return original success. Distinguish these using idempotency outcome and correlation ID, never code text.

### Ballot rollback

Roll back application code to last tested commit. Retain `ballotSubmissions`, `eventVoterAccess`,
`votingAccessCodes`, `idempotencyRecords`, and `auditEvents`; accepted ballots are immutable evidence.
Keep voting-code encryption key and manual event voting state unchanged. Never delete a ballot, unconsume
a code, or reopen voting to repair a deploy. Confirm `/ready`, run production smoke, verify deployed commit
header, then forward-fix schema or UI compatibility.

If grant rotation fails during shared-device voting, disable or roll back only affected application code.
Do not rewrite the browser/account review identity, latest grant, used-code record, or prior ballot. Query
for duplicate `accessCodeId` linkage and missing `usedByBallotId`; any mismatch is an integrity incident and
must be preserved for audit before repair.

## Previous-vote history

1. Query `operation:"voting.ballot_history_read"` by outcome, duration, returned count, `hasMore`, and
   correlation ID. Never log ballot IDs, category/entry labels, choices, ranks, raw cursor, code, browser
   marker, email, phone, or other voter identity data.
2. Signed-in reads must use only account identity. Signed-out reads may use only retained browser-marker
   digest. If both exist, account wins; histories must never merge. Host ownership adds no read permission.
3. Diagnose missing/duplicate pages by checking stable `{submittedAt:-1,_id:-1}` ordering and both cursor
   values. Do not repair pagination by rewriting ballot submission times or IDs.
4. Closed voting must still permit authorized read-only history. A missing **Cast another vote** action is
   expected while closed; history failure is not.
5. Production smoke creates two ballots with distinct codes on dedicated synthetic event, reads one-item
   pages newest first, and confirms host identity receives zero voter ballots. Any foreign node is a privacy
   incident and must fail deployment.
6. History reads must not consume/rotate a voting code, update access grants, create idempotency records, or
   modify ballot snapshots. Compare collection write metrics around read-only requests if mutation is suspected.

### History rollback

Roll back application code only. Preserve `ballotSubmissions`, immutable snapshot fields, account/browser
history indexes, voting codes, voter-access grants, idempotency records, and audits. Additive indexes may
remain. Verify `/ready`, synthetic paginated history, host isolation, closed-history integration, and
one-code-per-ballot before restoring traffic. Forward-fix cursor or authorization defects; never delete,
reorder, relabel, or reassign accepted ballots.

## Rollback

### Feature 011 signals and rollback

- Track `event.details_updated` and `event.details_change_denied` by safe reason and correlation ID;
  alert when update errors exceed 5% or p95 duration exceeds two seconds.
- Audit/log payloads may contain changed field names, never event text, normalized search content,
  voting rules, codes, or ballots.
- Roll back application code without rewriting event documents. Preserve dormant `categoryOverrides`,
  current detail/search fields, accepted ballots, voting codes, voter access, and audits. The prior
  schema-version-4 reader ignores the additive mutation and continues reading these documents.

1. Open Render deploy history.
2. Roll back to last known-good deploy.
3. Re-run `/health`, `/ready`, home page, and synthetic public event smoke.
4. Revert or patch bad `main` commit.
5. Push fix, watch CI, then confirm post-deploy smoke green.

For event-setup rollback, do not reverse migration 002: version-2 documents remain readable by
transitional code. Roll back application commit, confirm `/ready`, verify grouped public reads and
host participant summaries, then forward-fix. Never delete categories or entries during rollback.

For event-photo rollback, revert the application commit but retain `eventPhotos`. Old code ignores the
additive collection. Each accepted image is a metadata-stripped WebP no larger than 640×640 or 350 KiB;
input is JPEG/PNG/WebP, at most 10 MiB and 40 megapixels, encoded at quality 80, 70, then 60.

For entry-derived participant rollback, never delete `eventEntries` or reverse migration 003. Archived
entries are retained indefinitely without a TTL. Roll back the application commit, verify legacy embedded
registration reads during the compatibility window, then forward-fix. Diagnose by correlation ID and
operation name before inspecting database records. Logs and audit metadata must not contain entry titles,
display names, email addresses, or phone numbers.

Production smoke may exercise safe archival only against the dedicated synthetic event. Configure
`PRODUCTION_SYNTHETIC_HOST_EMAIL`, `PRODUCTION_SYNTHETIC_HOST_PASSWORD`, `PRODUCTION_SYNTHETIC_EVENT_ID`,
and `PRODUCTION_SYNTHETIC_CATEGORY_ID` together. The smoke creates one synthetic entry, archives it, and
verifies the owner leaves active participant views; it never targets real user fixtures.
