# Quickstart Validation: Account and Event Creation

This guide defines the runnable proof that the implemented feature satisfies the specification. Commands
become available as the tasks are implemented; this document intentionally contains no application code.

## Prerequisites

- Node.js 24 and pnpm
- Docker Desktop
- A current browser supported by Playwright
- Local ports 5173 (Vite), 4000 (API), 27017 (MongoDB), and 8025/1025 (Mailpit) available

## Local Configuration

1. Copy the checked-in frontend and backend example environment files to ignored local variants.
2. Use the Docker MongoDB URI and Mailpit SMTP endpoint; do not use Atlas or production email credentials.
3. Set `APP_ORIGIN=http://localhost:5173`, a local-only token pepper, and the documented session lifetime.
4. Start MongoDB and Mailpit with the repository's Docker Compose configuration.
5. Install frozen frontend, backend, and root E2E dependencies.

## Run the Application

1. Start the API in watch mode.
2. Start Vite with same-origin `/graphql` and health proxies to the API.
3. Open `http://localhost:5173`.
4. Open Mailpit at `http://localhost:8025` only to retrieve local verification and invitation links.

Expected readiness:

- `GET http://localhost:4000/health` returns liveness success without checking dependencies.
- `GET http://localhost:4000/ready` returns success only after MongoDB and required configuration are ready.
- No production credential is required or loaded.

## Automated Validation

Run the same ordered gates as CI:

1. Static analysis and formatting checks for frontend, backend, and test workspace.
2. Unit and React component suites with at least 80% line and branch coverage.
3. GraphQL client/schema and persistence contract suites.
4. API integration tests against the running Docker MongoDB and Mailpit services.
5. Production frontend build and backend startup check.
6. Playwright critical-flow suite against the assembled application.

A failure in any gate must return a non-zero exit and prevent deployment.

## Manual Acceptance Journeys

### CUF-001 — New Host Creates Events

1. Register with an unused email and valid password.
2. Confirm event creation is unavailable before verification.
3. Open the verification email in Mailpit and follow its single-use link.
4. Create a private event using only a title.
5. Create a public event with title, description, and location.
6. Confirm both appear in the host dashboard and remain after sign-out/sign-in.
7. Repeat a creation request with the same idempotency key and confirm only one event exists.

### CUF-002 — Returning Host

1. Sign in with the verified account.
2. Confirm all owned events appear and another account's private events do not.
3. Sign out and confirm protected host pages reject the ended session.
4. Try an invalid password and confirm the response does not disclose whether an email is registered.

### CUF-003 — Visibility and Private Access

1. Open the public event link in a signed-out browser; confirm event details render.
2. Open the private event link while signed out; confirm no private details render.
3. As host, invite a second email to the private event.
4. Register/verify or sign in as that email, accept the invitation, and confirm private access.
5. Remove that attendee as host and confirm their next read is denied.
6. Change the public event to private and confirm an anonymous open tab loses access on its next request.

## Failure and Security Checks

- Expired, malformed, replayed, and superseded verification/invitation links fail safely.
- Duplicate normalized emails cannot create multiple accounts under concurrent requests.
- Missing, expired, revoked, or mismatched sessions cannot perform protected operations.
- Non-owners cannot change visibility or manage access.
- Unicode and markup-like event text is preserved as text and never executed.
- MongoDB unavailability makes `/ready` fail and produces a generic correlated client failure.
- Logs contain correlation IDs and audit outcomes but no passwords, cookies, raw tokens, or email addresses.

## Production Smoke Validation

After a passing `main` deployment:

1. Verify `/health` and `/ready` over HTTPS.
2. Load the public application shell and a dedicated synthetic public event.
3. Perform the smallest safe authenticated read using a dedicated synthetic account if configured.
4. Confirm the deployed commit matches the commit that passed CI.

Smoke failure must alert the owner and trigger rollback to the last known-good Render deploy before the
release is considered complete.
