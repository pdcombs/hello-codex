# Implementation Plan: Secure Password Reset

**Branch**: `012-password-reset` | **Date**: 2026-08-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-password-reset/spec.md`

## Summary

Add signed-out password recovery through request, token-inspection, and reset contracts. Persist one-way token digests and retained lifecycle audit in dedicated reset records; expire authorization after 15 minutes without deleting history. Exact `VERIFICATION_BYPASS_DOMAINS` matches return same-browser authorization and skip email. Normal accounts receive canonical `APP_ORIGIN/reset-password?token=...` email. Successful reset atomically consumes token, replaces Argon2id password hash, increments credential version, and revokes sessions. React adds forgot/reset routes with shared password rules and accessible states.

## Technical Context

**Language/Version**: JavaScript ES modules on Node.js 24; React 19 browser client

**Primary Dependencies**: GraphQL 16, MongoDB driver 7, Zod 4, Argon2id, Nodemailer, React Router 7

**Storage**: MongoDB `accounts`, `sessions`, `auditEvents`, and new retained `passwordResetRequests` collection

**Testing**: Vitest unit/contract/real-Mongo integration/component coverage; Playwright desktop/mobile E2E; production synthetic smoke

**Target Platform**: Linux-hosted API and static web app; current mobile/desktop browsers; local Mailpit and configured production provider

**Project Type**: Web application with separate API and browser packages

**Performance Goals**: 95% of request/reset UI responses within two seconds excluding email transit; indexed token lookup bounded to one record

**Constraints**: Exactly 15-minute authorization; single-use CAS; no reset-record TTL; no plaintext token/password in storage or telemetry; neutral non-bypass response; exact bypass-domain matching; 80% line/branch floors

**Scale/Scope**: Existing account volume; one active reset per account; three GraphQL operations; two public pages; no new service or dependency

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **User value and scope**: Locked-out account holder, recovery job, measurable completion targets, and exclusions defined.
- **Identity and ownership**: Valid reset authorization is sole signed-out authority; enumeration, inactive accounts, token secrecy, session invalidation, and least privilege specified.
- **Contracts and boundaries**: UI, GraphQL, service, email, persistence, validation, lifecycle, and failure contracts documented.
- **Layered quality**: Unit paths, schema/persistence/email contracts, real Mongo concurrency/delivery tests, component tests, desktop/mobile flows, and 80% floors required.
- **Continuous delivery**: CI gate, production build/E2E, safe synthetic smoke, and code-only rollback included.
- **Observability**: Privacy-safe audits, correlation, latency/error/success signals, alerts, readiness, and first diagnostics included.
- **Operational simplicity**: Existing email transport, token pepper, Argon2id, transactions, bypass policy, and app origin reused; one collection added; no dependency or new environment key.

## Project Structure

### Documentation (this feature)

```text
specs/012-password-reset/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/{schema-extension.graphql,password-reset-email.md,password-reset-ui.md}
└── tasks.md
```

### Source Code (repository root)

```text
votiy-api/
├── src/
│   ├── api/graphql/{schema.js,account-resolvers.js}
│   ├── domain/{password-reset.js,validation.js}
│   ├── email/email-sender.js
│   ├── repositories/{account-repository.js,password-reset-repository.js,indexes.js,audit-event-repository.js}
│   ├── services/password-reset-service.js
│   └── server.js
└── tests/{unit,contract,integration,support}/
votiy-web/
├── src/{app,features/auth}/
└── tests/component/
tests/{e2e,smoke}/
```

**Structure Decision**: Extend existing API/web boundary and authentication feature. Dedicated reset domain/repository/service keeps verification behavior unchanged while reusing security, email, and session primitives.

## Phase 0: Research Conclusions

- Store only peppered token digest; raw token exists only in outbound email or direct bypass response.
- Keep reset documents indefinitely; `expiresAt` gates authorization and has no TTL index.
- Use atomic consume-and-password-update transaction plus credential-version increment and session revocation.
- Supersede active requests before newest token; failed email marks record delivery-failed and unusable.
- Reuse exact normalized domain matcher but never reusable verification-bypass token behavior.
- Use neutral request success for normal/unknown accounts; only configured bypass accounts receive direct token.

See [research.md](research.md).

## Phase 1: Design

- [data-model.md](data-model.md)
- [contracts/schema-extension.graphql](contracts/schema-extension.graphql)
- [contracts/password-reset-email.md](contracts/password-reset-email.md)
- [contracts/password-reset-ui.md](contracts/password-reset-ui.md)
- [quickstart.md](quickstart.md)

## Post-Design Constitution Re-check

Passed. No dependency or secret added. Design preserves audit history, fails closed for bypass, defines transaction/concurrency behavior, and includes required quality, CI, observability, and rollback gates.

## Complexity Tracking

No violations.
