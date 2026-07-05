# Quickstart Validation: Account, Event, and Participant Registration

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
4. Open Mailpit at `http://localhost:8025` only to retrieve visitor account-verification links.

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

1. Open the public home page and confirm it explains what Votiy is.
2. Register with an unused email and valid password.
3. Confirm event creation is unavailable before verification.
4. Open the verification email in Mailpit and follow its single-use link.
5. Confirm the home page switches to the hosted-events dashboard after sign-in.
6. Create an ADMIN_MANAGED event using only a title.
7. Create an OPEN event with title, description, and location.
8. Confirm both appear in the hosted-events dashboard and remain after sign-out/sign-in.
9. Repeat a creation request with the same idempotency key and confirm only one event exists.

### CUF-002 — Returning Host

1. Sign in with the verified account.
2. Confirm the hosted-events dashboard appears and all owned events are listed there.
3. Open one event and confirm you land on that event's detail page with only that event's actions.
4. Sign out and confirm protected host pages reject the ended session.
5. Try an invalid password and confirm the response does not disclose whether an email is registered.

### CUF-003 — Viewing and Participant Registration Policy

1. Open both OPEN and ADMIN_MANAGED event links in a signed-out browser; confirm the event detail page
   renders for each.
2. Sign in with a verified account and self-register for the OPEN event from its detail page.
3. Attempt self-registration for the ADMIN_MANAGED event and confirm no registration is created.
4. As host, open an event detail page and add one participant by unused email and one by unused phone
   number.
5. Confirm each addition creates an unverified provisional account and an EventRegistration referencing its
   account ID, without sending email or SMS.
6. Add either identifier to another event and confirm the existing provisional account is reused.
7. Remove one participant and confirm its registration is marked removed without deleting the account.
8. Change the registration policy and confirm the next registration request uses the current policy.

## Failure and Security Checks

- Expired, malformed, replayed, and superseded visitor verification links fail safely.
- Duplicate normalized emails cannot create multiple accounts under concurrent requests.
- Missing, expired, revoked, or mismatched sessions cannot perform protected operations.
- Non-owners cannot change registration policy or manage participant registrations.
- Unicode and markup-like event text is preserved as text and never executed.
- MongoDB unavailability makes `/ready` fail and produces a generic correlated client failure.
- Logs contain correlation IDs and audit outcomes but no passwords, cookies, raw tokens, email addresses,
  or phone numbers.

## Production Smoke Validation

After a passing `main` deployment:

1. Verify `/health` and `/ready` over HTTPS.
2. Load the public application shell and a dedicated synthetic direct-link event.
3. Perform the smallest safe authenticated read using a dedicated synthetic account if configured.
4. Confirm the deployed commit matches the commit that passed CI.

Smoke failure must alert the owner and trigger rollback to the last known-good Render deploy before the
release is considered complete.
