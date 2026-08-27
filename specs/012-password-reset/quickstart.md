# Quickstart: Secure Password Reset Validation

## Prerequisites

- Local MongoDB replica set and Mailpit healthy.
- Verified normal-domain and exact bypass-domain accounts.
- `APP_ORIGIN=http://127.0.0.1:5173`; `VERIFICATION_BYPASS_DOMAINS=example.test`.

```bash
docker compose up -d --wait
corepack pnpm dev
```

## Automated validation

```bash
corepack pnpm --dir votiy-api test:coverage
corepack pnpm --dir votiy-web test:coverage
corepack pnpm --dir votiy-web lint
corepack pnpm --dir votiy-web build
corepack pnpm test:e2e tests/e2e/password-reset.spec.js --project=chromium
corepack pnpm test:e2e tests/e2e/password-reset.spec.js --project=mobile-chromium
node tests/smoke/production-smoke.js
```

Expected: 80% line/branch floors; contract, real-Mongo, component, desktop/mobile, privacy, concurrency, smoke pass.

## CUF-001: Email recovery

1. Select **Forgot password?**, enter verified non-bypass email.
2. Confirm neutral success and one Mailpit message matching [email contract](contracts/password-reset-email.md).
3. Confirm DB stores digest/timestamps, not raw token; expiry is creation plus 15 minutes.
4. Open link; confirm read-only email. Submit matching compliant password.
5. Confirm sign-in redirect, new password success, old password/reused link failure.

## CUF-002: Bypass recovery

1. Request exact `example.test` account reset.
2. Confirm no email and direct unique reset authorization.
3. Complete reset; verify same audit, expiry, single-use, session behavior.
4. Reject suffix/lookalike domains.

## CUF-003: Privacy and invalid requests

1. Compare known normal, unknown, and ineligible responses; normal behavior neutral.
2. Test malformed, expired, superseded, consumed, orphaned tokens.
3. Confirm no invalid response/log/audit leaks email, token, password, digest.
4. Force email failure; record retained failed and unusable.

## CUF-004: Concurrency and sessions

1. Submit one valid token concurrently; exactly one succeeds.
2. Confirm all prior sessions revoked and credential version increments once.
3. Generate two requests concurrently; only newest authoritative link succeeds; both records remain.

## Operations and rollback

- Track request/completion/email-failure/denied-token rates and p95 latency; alert above 5% errors, two-second p95, email failures, or denial spike.
- Logs/audits contain operation, outcome, correlation, safe reason, duration only.
- `/health` and `/ready` remain healthy; no new secret/environment variable.
- Roll back code without deleting `passwordResetRequests`; prior code ignores collection. Do not restore old hashes, credential versions, or sessions. Existing links stop functioning until forward fix.

Validation result (2026-08-26): code-only rollback confirmed. Retained reset and audit records remain intact; old credentials and revoked sessions are not restored.
