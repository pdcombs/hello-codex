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

Grouped-view logs contain counts, duration, outcome, and error codes only. They must never include
category titles, entry titles, display names, email addresses, or phone numbers.

## Setup diagnostics and privacy checks

- Mutation error rate: count `OperationError` results for `addEventParticipant`, `registerForEvent`,
  `addEventCategory`, and `renameEventCategory`, divided by total matching operations.
- Setup read latency: query `event:"event.setup_view.completed" outcome:"success"` and graph p50/p95
  `durationMs`.
- Migration outcome: require successful `accounts`, `events`, and `registrations` stage logs before
  readiness; alert on missing stages or startup failure.
- Privacy audit: periodically search logs for `@`, E.164-like phone values, and known synthetic titles
  or display names. Any match outside explicitly redacted fields is an incident.

## Correlation ID diagnostics

1. Copy `X-Correlation-ID` from failing browser response or smoke output.
2. Search Render logs for that correlation ID.
3. Match request completion event with nearby audit or service log lines.
4. If DB issue, inspect Atlas metrics at same UTC minute.
5. If deploy issue, compare `X-App-Commit` header with expected Git SHA.

## Rollback

1. Open Render deploy history.
2. Roll back to last known-good deploy.
3. Re-run `/health`, `/ready`, home page, and synthetic public event smoke.
4. Revert or patch bad `main` commit.
5. Push fix, watch CI, then confirm post-deploy smoke green.

For event-setup rollback, do not reverse migration 002: version-2 documents remain readable by
transitional code. Roll back application commit, confirm `/ready`, verify grouped public reads and
host participant summaries, then forward-fix. Never delete categories or entries during rollback.

For entry-derived participant rollback, never delete `eventEntries` or reverse migration 003. Archived
entries are retained indefinitely without a TTL. Roll back the application commit, verify legacy embedded
registration reads during the compatibility window, then forward-fix. Diagnose by correlation ID and
operation name before inspecting database records. Logs and audit metadata must not contain entry titles,
display names, email addresses, or phone numbers.

Production smoke may exercise safe archival only against the dedicated synthetic event. Configure
`PRODUCTION_SYNTHETIC_HOST_EMAIL`, `PRODUCTION_SYNTHETIC_HOST_PASSWORD`, `PRODUCTION_SYNTHETIC_EVENT_ID`,
and `PRODUCTION_SYNTHETIC_CATEGORY_ID` together. The smoke creates one synthetic entry, archives it, and
verifies the owner leaves active participant views; it never targets real user fixtures.
