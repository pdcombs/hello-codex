# Implementation Plan: Cast Event Ballot

**Branch**: `main` | **Date**: 2026-08-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-event-ballot/spec.md`

## Summary

Replace placeholder vote route with server-authorized one-page ballot. Reuse transactional submission core, but permit skipped categories while requiring one participating category; preserve complete ranking semantics. Persist immutable category/entry title snapshots, bind idempotency to canonical payload, return accepted ballot, and add identity-scoped latest-ballot retrieval for account and retained browser/code grants. UI renders accessible category controls, sticky **Submit vote**, confirmation bottom sheet, and durable read-only completion state.

## Technical Context

**Language/Version**: JavaScript ES modules on Node.js 26; React 19

**Primary Dependencies**: GraphQL 16, MongoDB driver 7, Zod 4, React Router 7; no new dependencies

**Storage**: Existing MongoDB replica set; evolve immutable `ballotSubmissions` documents to schema version 2

**Testing**: Vitest 4, Testing Library, Playwright 1.61, real MongoDB integration, production smoke

**Target Platform**: Current desktop/mobile browsers; Linux-hosted Node service

**Project Type**: React web application plus GraphQL API

**Performance Goals**: Ballot view and visible submission result within two seconds for 95% of normal requests; smooth controls through 10 categories/100 entries

**Constraints**: 80% repository line/branch coverage; immutable ballots; private choices; manual open state authoritative; 320 CSS pixels/200% zoom; keyboard/touch ranking; no choice data in logs/audits

**Scale/Scope**: One scrolling ballot, up to existing event/category/entry limits; latest private ballot review; result calculation deferred

## Constitution Check

*GATE: PASS before research and after design.*

- **User value and scope**: Eligible voter can select, confirm, submit, and verify ballot; results and draft persistence excluded.
- **Identity and ownership**: Submission and review authorize at server boundary through account or digested retained browser/code grant. Host has no individual-choice read privilege.
- **Contracts and boundaries**: Feature GraphQL extension, strict input validation, version-2 persistence shape, UI states, and safe failures documented.
- **Layered quality**: Domain/service unit tests, GraphQL/persistence contracts, real-Mongo identity/concurrency tests, component tests, and desktop/mobile E2E cover every integrity decision; 80% floors retained.
- **Continuous delivery**: Existing `main` pipeline remains; Feature 014 targeted gates and safe synthetic production smoke extend it.
- **Observability**: Submit/review latency, outcomes, safe reason codes, correlation IDs, rule/state versions, and counts only; choices/IDs/codes/markers excluded.
- **Operational simplicity**: Existing API, Mongo collection, session/browser marker, access grant, and UI primitives reused. No new service or dependency.

## Project Structure

### Documentation

```text
specs/014-event-ballot/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── schema-extension.graphql
│   └── ui-contract.md
└── tasks.md
```

### Source Code

```text
votiy-api/
├── src/
│   ├── api/graphql/{schema.js,event-resolvers.js}
│   ├── domain/{ballot-submission.js,validation.js}
│   ├── repositories/{ballot-submission-repository.js,indexes.js}
│   └── services/event-voting-service.js
└── tests/{unit,contract,integration,support}/

votiy-web/
├── src/
│   ├── app/AppRouter.jsx
│   └── features/voting/{VotingPage.jsx,EventBallot.jsx,BallotCategorySection.jsx,BallotConfirmationSheet.jsx,voting.graphql.js}
└── tests/component/

tests/
├── e2e/{event-ballot.spec.js,fixtures/event-ballot.js,responsive-accessibility.spec.js}
└── smoke/production-smoke.js
```

**Structure Decision**: Extend established two-project API/web layout and root system tests. Ballot domain stays inside existing voting service boundary.

## Design Decisions

- Missing or empty category choice means skipped. Participating single has one entry; multiple meets min/max; ranking includes every active entry exactly once. Whole ballot requires one participating category.
- Submission input includes expected rules and voting-state versions. Transaction reloads event and rejects stale/closed state.
- Version-2 ballot stores normalized IDs plus immutable category and entry title snapshots for exact later review/results.
- Canonical payload digest is stored with idempotency record. Same key/different payload conflicts; lost-response retry returns same ballot.
- Submission success returns saved ballot. `eventBallotView` returns latest ballot authorized only by current account or retained browser marker/access grant.
- Anonymous unrestricted access receives retained browser marker even when repeat mode is unlimited, enabling private latest-ballot review without changing repeat policy.
- Anonymous code submission reuses browser-bound access grant and code association; consumed code is never requested or consumed twice.
- Repeat-eligible voter sees latest read-only ballot on revisit plus explicit **Cast another vote** action. New attempt never edits existing ballot.

## Observability and Rollback

- Operations: `voting.ballot_view`, `voting.ballot_submit`, `voting.ballot_review`; fields limited to outcome, reason code, latency, correlation, rules/state version, category count.
- Alert at unexpected error rate above 5%, p95 above two seconds, duplicate-key/idempotency conflict spike, or review authorization failures.
- Roll back application code only. Preserve version-2 ballots and snapshots. Prior readers tolerate additive fields; do not delete or rewrite accepted ballots.

## Post-Design Constitution Check

PASS. Design adds no dependency/service, keeps choices private, preserves immutable history, documents compatible schema evolution, and includes all mandated quality/deployment/observability layers.

## Complexity Tracking

No constitution violations.
