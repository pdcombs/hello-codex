# Implementation Plan: Account and Event Creation

**Branch**: `001-account-event-creation` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-account-event-creation/spec.md`

## Summary

Replace the demonstration word generator with Votiy's first useful product slice: email/password accounts,
email verification, secure sessions, multiple creator-owned events, public direct-link viewing, and
private attendee access. Preserve the existing single Render service, React client, GraphQL boundary, and
MongoDB datastore. Add explicit service and repository boundaries, server-side authorization, layered
tests, production delivery gates, and structured operational signals.

## Technical Context

**Language/Version**: JavaScript (ECMAScript modules) on Node.js 24; React 19 in current evergreen browsers

**Primary Dependencies**: React, React Router, GraphQL, MongoDB driver, Zod validation, Argon2 password
hashing, a secure cookie parser, Pino structured logging, and a transactional-email adapter

**Storage**: MongoDB Atlas in production; MongoDB Docker container locally and in integration CI

**Testing**: Vitest, React Testing Library, GraphQL contract tests, real-MongoDB integration tests, and
Playwright browser E2E tests

**Target Platform**: Render Linux web service serving the built React application and same-origin GraphQL
API; current mobile and desktop browsers

**Project Type**: Single-repository web application with separate frontend and backend packages deployed
as one web service

**Performance Goals**: 95% of valid account, sign-in, and event submissions show a result within two
seconds; public/private event reads target p95 under 500 ms at the service boundary under normal load

**Constraints**: Same-origin browser/API deployment; HTTP-only secure session cookies; no browser secrets
or direct database access; 80% repository-wide line and branch coverage; exact tested commit deploys from
`main`; local development works without production credentials

**Scale/Scope**: Initial small-team MVP; thousands of accounts and events, tens of concurrent requests per
instance, one Render web instance initially, multiple events per account, no voting or participant
registration

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **User value and scope — PASS**: The host account/event journey and attendee access are measurable;
  voting, participation, discovery, and event-management extensions are excluded.
- **Identity and ownership — PASS**: Opaque server-side sessions, immutable event ownership, verified-host
  creation, private access records, and server-side authorization are designed explicitly.
- **Contracts and boundaries — PASS**: React calls documented GraphQL operations; services own business
  rules; repositories alone access MongoDB; all inputs and persistence documents are validated.
- **Layered quality — PASS**: Unit, UI, GraphQL/persistence contract, real-MongoDB integration, Playwright
  E2E, and post-deployment smoke coverage are defined with an 80% line/branch gate.
- **Continuous delivery — PASS**: Pull requests validate all pre-deployment gates. Passing `main` commits
  auto-deploy through Render, followed by safe production smoke checks and rollback/alert procedures.
- **Observability — PASS**: Correlated JSON logs, health/readiness separation, audit events, defined SLIs,
  Render/Atlas views, and actionable alerts are included.
- **Operational simplicity — PASS**: The existing React/Node/Mongo/Render shape remains. Transactional
  email is the only required external capability; local email uses Mailpit.

### Post-Design Re-check

The data model, GraphQL contract, validation guide, and environment boundaries satisfy every gate. No
constitutional exception or additional deployable service is required.

## Architecture and Boundaries

1. The React application renders public, authentication, dashboard, event-creation, and event-view flows.
2. The browser sends same-origin GraphQL requests and receives an opaque session cookie; it never handles
   password hashes, session tokens, verification tokens, or database credentials.
3. GraphQL resolvers translate the transport contract and delegate to application services.
4. Application services enforce verification, ownership, visibility, invitation, idempotency, and audit
   rules independent of transport or storage.
5. Repository modules validate and persist MongoDB documents and create required indexes.
6. An email adapter sends verification/invitation links through Mailpit locally and the configured
   transactional provider in production.

### Authentication and Authorization

- Normalize email by trimming and lowercasing before uniqueness checks.
- Hash passwords with Argon2id and never log or return credentials.
- Store only SHA-256 digests of single-use verification and invitation secrets.
- Store opaque session records in MongoDB; send the random session secret only in a `Secure`, `HttpOnly`,
  `SameSite=Lax` cookie (omit `Secure` only on local HTTP).
- Rotate the session on sign-in and verification, expire inactive sessions, and invalidate on sign-out.
- Require a verified session for event creation and host management.
- Permit public event queries without a session. Require a matching signed-in account access record for
  private event queries. Check authorization on every request.
- Validate same-origin mutation requests, bound request size/complexity, disable production introspection,
  and apply stricter throttles to registration, sign-in, verification, and invitation operations.

## Data and Contract Strategy

- Collections and indexes are defined in [data-model.md](./data-model.md).
- GraphQL operations and stable error codes are defined in
  [contracts/schema.graphql](./contracts/schema.graphql).
- GraphQL responses use typed result unions for expected validation/authentication failures. Unexpected
  failures return a correlation ID and generic message while details remain in server logs.
- Mutation inputs that can be retried include an idempotency key scoped to the authenticated account or
  normalized registration email.
- All persisted documents carry schema version and timestamps to support compatible migrations.

## Test Strategy

### Unit and Component

- Unit-test normalization, validation, password/session/token handling, visibility decisions,
  authorization matrices, duplicate suppression, and state transitions.
- Exercise every decision path for authentication, verification, ownership, public/private visibility,
  and invitation status regardless of aggregate coverage.
- Test React forms and pages for loading, empty, success, validation, expired-session, and failure states.
- Enforce at least 80% line and branch coverage across frontend and backend.

### Contract and Integration

- Parse and snapshot the GraphQL schema; validate checked-in client operations against it.
- Verify GraphQL result/error shapes and MongoDB document validators/indexes.
- Run API integration tests against a real MongoDB service, including duplicate email, idempotent event
  creation, session expiry, private denial, invitation acceptance/removal, and dependency outage behavior.
- Test the email adapter contract with a deterministic fake and one local Mailpit integration path.

### End-to-End

- CUF-001: register, capture verification link in Mailpit, verify, create private and public events, and
  see both after returning.
- CUF-002: sign in, list owned events, open an event, and sign out.
- CUF-003: anonymously open a public event; deny anonymous/uninvited private access; invite a second
  account, allow it, remove it, and deny it again.
- Run deterministic Playwright journeys before deployment. Run safe read-only health/public-page smoke
  checks after deployment; use a dedicated synthetic account for any authenticated production smoke.

## Delivery and Environments

| Concern | Local | Production |
|---|---|---|
| Web/API | Node watch process + Vite proxy | One Render Node web service |
| Database | Docker MongoDB | MongoDB Atlas |
| Email | Docker Mailpit | Transactional email provider |
| Secrets | ignored `.env.local` files | Render secret environment variables |
| Browser URL | `http://localhost:5173` | Render HTTPS URL |

CI on pull requests and `main` installs frozen dependencies, lints, checks formatting, runs unit/component
coverage, starts MongoDB and Mailpit, runs contract/integration/E2E tests, and builds production assets.
Render deploys only a passing `main` commit. A post-deploy workflow checks `/health`, `/ready`, the public
shell, and a dedicated public synthetic event. Failure alerts the repository/service owner; rollback uses
Render's last known-good deploy while the failed commit is corrected or reverted.

Required production secrets/configuration: `MONGODB_URI`, `SESSION_COOKIE_NAME`, `APP_ORIGIN`,
`EMAIL_FROM`, provider API key/endpoint, token pepper, session lifetime, and log level. Secrets are never
committed or exposed through Vite variables.

## Observability

- Emit one structured JSON request completion event with timestamp, severity, environment, operation,
  status, duration, correlation ID, and authenticated account ID when safe. Never log email addresses,
  passwords, cookies, or raw tokens.
- Emit audit events for registration, verification, sign-in success/failure (without account disclosure),
  sign-out, event creation/visibility change, invitation issue/accept/revoke, and authorization denial.
- `/health` reports process liveness only. `/ready` verifies MongoDB and required configuration and returns
  non-success when the instance should not receive traffic.
- Track availability, GraphQL error rate, p50/p95 latency, authentication failure rate, email-send failure,
  readiness failure, and CUF smoke success through Render logs/metrics and Atlas monitoring.
- Alert on sustained 5xx/error-rate elevation, readiness failure, deployment/smoke failure, MongoDB
  connection pressure, and transactional-email failures. Every alert includes environment, impact,
  correlation/search guidance, and first recovery action.

## Project Structure

### Documentation (this feature)

```text
specs/001-account-event-creation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── schema.graphql
└── tasks.md
```

### Source Code (repository root)

```text
hello-world/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   └── events/
│   └── lib/
└── tests/
    ├── component/
    └── contract/

hello-world-api/
├── src/
│   ├── api/graphql/
│   ├── config/
│   ├── domain/
│   ├── email/
│   ├── observability/
│   ├── repositories/
│   └── services/
└── tests/
    ├── contract/
    ├── integration/
    └── unit/

tests/
└── e2e/

.github/workflows/
├── ci.yml
└── post-deploy.yml
```

**Structure Decision**: Keep the existing two packages and single production process. Refactor the
backend's current single file into explicit transport, application, domain, and repository modules while
organizing the React client by authentication and event features. Cross-package E2E tests remain at the
repository root.

## Complexity Tracking

No constitution violations require justification.
