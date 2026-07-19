# Implementation Plan: Event Voting Rules

**Branch**: `main` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-event-voting-rules/spec.md`

## Summary

Add one versioned voting-rules object to every event, host-only rules editing, public rule/eligibility reads, three category ballot methods, unrestricted/account/code access policies, encrypted one-time-code inventory, event voter-access relationships, and immutable ballot submissions. UI renders server-returned capabilities; API independently re-reads and enforces active rules for every mutation. Code claim, provisional account linking, voter access, ballot persistence, audit, and idempotency commit in one MongoDB transaction.

## Technical Context

**Language/Version**: JavaScript ESM on Node.js 24.x; React 19 client

**Primary Dependencies**: GraphQL 16, MongoDB driver 7, Zod 4, React Router 7; Node `crypto` for HMAC and AES-256-GCM; no new runtime package

**Storage**: MongoDB replica set; embedded versioned rules on `events`; new `votingAccessCodes`, `eventVoterAccess`, and `ballotSubmissions` collections; existing `accounts`, `idempotencyRecords`, `auditEvents`

**Testing**: Vitest unit/contract/real-Mongo integration and coverage; Playwright desktop/mobile E2E; production synthetic smoke

**Target Platform**: Render Linux service and current desktop/mobile browsers; local Docker MongoDB replica set

**Project Type**: React web application plus GraphQL API

**Performance Goals**: 95% of event-rule and eligibility views visible within 2 seconds; code batches up to 1,000 generated within 5 seconds; ballot submission p95 under 2 seconds at expected launch traffic

**Constraints**: 80% repository line/branch coverage; every rule decision path covered; host-only management; no client-authoritative eligibility; no raw code/contact/ballot data in logs or audit metadata; no hard delete; additive GraphQL; migration before strict validators/readiness; transaction-required code claims

**Scale/Scope**: Existing small-team monorepo; up to 100 categories/event, 5,000 active entries/category, 1,000 codes/batch, 100,000 codes/event, and launch target of 10,000 ballot submissions/event

## Constitution Check

*GATE: Passed before research and after design.*

- **User value and scope**: Host safely configures voting behavior; voter receives clear eligibility/ballot behavior. Counting, winners, delivery, and contact verification excluded.
- **Identity and ownership**: Event owns rules/codes/access/ballots. Host alone mutates rules and lists codes. Voter reads only public rules and own eligibility. API revalidates every action.
- **Contracts and boundaries**: Additive GraphQL contract, strict input/result unions, versioned migration, server capability projection, repository validators, and safe conflicts documented.
- **Layered quality**: Unit every rule branch; additive schema/persistence contracts; replica-set integration for migration, claim, ballot atomicity, race/rollback; E2E all CUFs; 80% coverage gates.
- **Continuous delivery**: CI runs migration/contract/integration/E2E/build/smoke syntax; Render deploys tested `main`; post-deploy dedicated synthetic event exercises rules, code claim, ballot, projection, audit verification.
- **Observability**: Privacy-safe operation/outcome/duration/correlation/rule-version counters; availability, rule-read latency, ballot errors, claim conflicts, migration and invariant alerts; auditable state changes.
- **Operational simplicity**: Existing service, database, GraphQL, idempotency, audit, and transaction patterns reused. Built-in crypto avoids new service/package. One new encryption secret added to shared environment contract.

## Project Structure

### Documentation

```text
specs/007-event-voting-rules/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── schema-extension.graphql
│   └── persistence.md
└── tasks.md
```

### Source Code

```text
votiy-api/
├── src/
│   ├── api/graphql/event-resolvers.js
│   ├── config/env.js
│   ├── domain/
│   │   ├── event-voting-rules.js
│   │   ├── ballot-submission.js
│   │   ├── voting-access-code.js
│   │   ├── security.js
│   │   └── validation.js
│   ├── migrations/005-event-voting-rules.js
│   ├── repositories/
│   │   ├── event-repository.js
│   │   ├── voting-access-code-repository.js
│   │   ├── event-voter-access-repository.js
│   │   ├── ballot-submission-repository.js
│   │   └── indexes.js
│   ├── services/
│   │   ├── event-voting-rules-service.js
│   │   └── event-voting-service.js
│   └── server.js
└── tests/{unit,contract,integration,support}/

votiy-web/
├── src/features/voting/
│   ├── EventRulesEditor.jsx
│   ├── CategoryVotingRuleFields.jsx
│   ├── VotingCodeManager.jsx
│   ├── EventBallot.jsx
│   └── voting.graphql.js
└── tests/component/

tests/
├── e2e/event-voting-rules.spec.js
├── e2e/fixtures/event-voting-rules.js
└── smoke/production-smoke.js
```

**Structure Decision**: Extend existing feature-oriented React and layered API. Rules embed with event for consistent reads; independently growing and security-sensitive code/access/ballot records use dedicated collections.

## Design Phases

### Phase 0 — Research

Resolve persistence boundaries, safe defaults, rule-version semantics, code secrecy, anonymous browser marker limits, transaction behavior, migration compatibility, batch bounds, and observability. Output: [research.md](./research.md).

### Phase 1 — Domain and Contracts

Define event rules, category overrides, access-code lifecycle, voter access, ballot snapshots, indexes, invariants, and additive GraphQL operations. Output: [data-model.md](./data-model.md), [contracts](./contracts/), [quickstart.md](./quickstart.md).

### Phase 2 — Task Planning

Generate dependency-ordered tasks grouped by independently testable user stories: host rules, server ballot enforcement, voter policies, code management, then production gates. `/speckit-tasks` owns this phase.

## Delivery and Compatibility

1. Add transitional validators and migration 005 before strict validator enforcement/readiness.
2. Backfill events with closed draft defaults and category overrides only where needed.
3. Add GraphQL types/fields/mutations without removing existing operations.
4. Deploy read projections and host management before enabling voter submission controls.
5. Enable ballot mutations only when server reports `canVote`; mutation still revalidates current rules.
6. Keep migration forward-only. Rollback application commit; never remove new fields/collections or ballot/code history.

## Quality Strategy

- **Unit**: Time boundaries, category methods, selection bounds, account completeness, repeat policy, code format/encryption/digest, version conflicts, eligibility matrix, privacy-safe telemetry.
- **Contract**: Additive GraphQL schema, client documents, validators, ciphertext/digest persistence, indexes, legacy operation compatibility.
- **Integration**: Migration idempotency, host authorization, stale writes, exact category snapshots, code batch collision retry, concurrent claim, provisional account reuse, ballot/code/access/audit/idempotency atomicity and rollback.
- **Component**: Rule form states, conditional fields, category methods, code inventory, voter capability rendering, mobile/accessibility, conflict retention.
- **E2E**: CUF-001 through CUF-006 on desktop/mobile; direct GraphQL bypass attempts; concurrent code claim fixture.
- **Production smoke**: Dedicated synthetic host/event; configure window/rules, generate code, submit ballot, verify used state/active invariant/audit, then retain synthetic history.

## Observability and Operations

- Operations: `event.rules_read`, `event.rules_update`, `voting.code_generate`, `voting.code_list`, `voting.eligibility_read`, `voting.ballot_submit`.
- Safe fields: outcome, duration, correlation ID, event/rule version, category/selection counts, policy/method enum, code count, conflict/denial code. Never log code, email, phone, entry choices, ranks, or browser token.
- Audits: rules updated, code batch generated, ballot accepted, code consumed, access granted, and authorization denial. Identifier-only metadata.
- Alerts: availability below 99%; p95 rules/eligibility or ballot above 2 seconds for 10 minutes; errors above 5%; any migration/invariant/partial-transaction failure; elevated code-claim conflicts.
- Readiness depends on migration 005 and all new indexes/validators. No external provider dependency.

## Post-Design Constitution Re-check

Passed. Design uses existing boundaries and one built-in-crypto secret. All private actions server-authorized, all critical rule branches tested, deployment/smoke/rollback defined, and no constitutional exception exists.

## Complexity Tracking

No violations.
