# Implementation Plan: Defer Voting Code Consumption

**Branch**: `017-defer-code-consumption` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/017-defer-code-consumption/spec.md`

## Summary

Stop consuming codes during access checks. Store validated code as pending voter access, then atomically create ballot, consume code with ballot ID, update grant, audit, and idempotency record during submission. Reconcile legacy rows while preserving ballot-backed uses and restoring orphaned claims.

## Technical Context

**Language/Version**: JavaScript ESM on Node.js 24; React 19

**Primary Dependencies**: GraphQL 16, MongoDB 7 driver, Zod 4, Vite 8

**Storage**: MongoDB collections `votingAccessCodes`, `eventVoterAccess`, `ballotSubmissions`, `auditEvents`

**Testing**: Vitest unit, contract, MongoDB integration; Playwright E2E

**Target Platform**: Render-hosted Linux API and current mobile/desktop browsers

**Project Type**: Web application with separate API and client packages

**Performance Goals**: 95% of code validations and ballot submissions complete within 2 seconds under normal load

**Constraints**: One ballot per code; transactional ballot/code/audit integrity; no plaintext code logs; retry compatibility

**Scale/Scope**: Existing event voting traffic and code batches; no new service or dependency

## Constitution Check

*GATE: Passed before research and after design.*

- **User value and scope**: Voter avoids wasted code; host retains one-code-one-ballot integrity. Reservations and drafts excluded.
- **Identity and ownership**: Existing host inventory authorization stays server-enforced. Voter sees no inventory or foreign ballots.
- **Contracts and boundaries**: Access contract stays compatible. Repository semantics become pending grant plus submission consumption. Failures explicit.
- **Layered quality**: Unit covers access decisions; contract covers repositories; MongoDB integration covers abandon, concurrency, rollback, retry, reconciliation; existing E2E stays critical.
- **Continuous delivery**: Existing main pipeline remains gate. Build and applicable tests run before push.
- **Observability**: Validation, consumption, conflict, and reconciliation emit privacy-safe structured audit/log events with correlation IDs.
- **Operational simplicity**: Reuses current services, repositories, transactions, collections, and migration path. No dependency or environment change.

## Project Structure

### Documentation (this feature)

```text
specs/017-defer-code-consumption/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/voting-code-lifecycle.md
└── tasks.md
```

### Source Code (repository root)

```text
votiy-api/
├── src/
│   ├── repositories/voting-access-code-repository.js
│   ├── services/event-voting-service.js
│   └── migrations/008-reconcile-voting-code-ballots.js
└── tests/
    ├── unit/voting-access-decision.test.js
    ├── contract/event-voting-repositories.contract.test.js
    └── integration/voting-code-claim.test.js
```

**Structure Decision**: Backend-only lifecycle fix within existing API boundaries. Current UI retains pending access and displays server code errors; no new client contract needed.

## Complexity Tracking

No constitution violations.
