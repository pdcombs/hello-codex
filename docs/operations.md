# Votiy Operations

## Core SLIs

- Availability: `/health` and `/ready` success rate
- API latency: GraphQL `POST /graphql` p50 and p95 duration
- Error rate: GraphQL `OperationError` plus HTTP 5xx rate
- Authentication failures: sign-in denied and session expiry events
- Email delivery failures: `email.failed` events
- Deployment health: post-deploy smoke pass/fail rate

## Render / Atlas query ideas

- Render logs:
  - `event:"request.completed" operation:"POST /graphql"`
  - `event:"request.completed" status:503`
  - `operation:"authentication.sign_in" outcome:"denied"`
  - `operation:"event.create" outcome:"success"`
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
