# Implementation Plan: Event Categories and Entries

**Branch**: `main` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-event-categories-entries/spec.md`

## Summary

Extend accounts with required display names and event setup so every event owns at least one category and every registration—host-managed or self-service—collects one or more titled, categorized entries. Store categories inside their event document and entries inside their event-registration document, migrate every existing account/event/registration idempotently, coordinate the breaking GraphQL contract activation with complete resolvers and UI, and reorganize event details around category-grouped entries with participant administration on a secondary tab.

## Technical Context

**Language/Version**: JavaScript on Node.js 24.x; React 19 client

**Primary Dependencies**: GraphQL 16, MongoDB driver 7, Zod 4, React Router 7, Vite 8

**Storage**: MongoDB 8; embedded category arrays on events and embedded entry arrays on event registrations

**Testing**: Vitest unit/component/contract suites, production-equivalent MongoDB integration tests, Playwright critical-flow E2E tests

**Target Platform**: Current mobile and desktop browsers; Node service on Render; MongoDB Atlas production cluster

**Project Type**: Web application with React frontend and Node GraphQL backend

**Performance Goals**: Event setup and grouped detail views usable within two seconds for 100 categories, 1,000 participants, and 5,000 entries; category/entry changes visible immediately after success

**Constraints**: Host-only setup authority; required account display name, participant email, and entry title; every host and self registration collects entries referencing same-event categories; participant/account/entry creation is atomic; contact data must not enter public owner labels or logs; 80% line and branch coverage repository-wide

**Scale/Scope**: One default category per event, up to 100 categories, 1,000 registrations, and 5,000 embedded entries per event for this feature target

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **User value and scope**: PASS — the host setup job, prioritized journeys, measurable outcomes, and explicit exclusions are defined.
- **Identity and ownership**: PASS — the existing event owner is the sole setup administrator; services verify ownership before every mutation; public projections exclude contact details.
- **Contracts and boundaries**: PASS — GraphQL account/setup changes, domain validation, embedded persistence ownership, coordinated activation, and failure shapes are documented.
- **Layered quality**: PASS — domain/service unit tests, GraphQL and persistence contract tests, replica-set integration tests, and host setup E2E flows are required.
- **Continuous delivery**: PASS — existing `main` pipeline remains authoritative; migration, build, tests, deploy, and post-deploy read smoke are included as release gates.
- **Observability**: PASS — category and entry audit events, structured operation logs, correlation IDs, latency/error signals, and first diagnostic queries are planned without personal data.
- **Operational simplicity**: PASS — no new service or application dependency is introduced; a single-node local replica set aligns transaction support with Atlas.

## Phase 0: Research Decisions

Research outcomes are recorded in [research.md](./research.md). All technical unknowns are resolved.

## Phase 1: Design and Contracts

- [data-model.md](./data-model.md) defines embedded category and entry ownership, invariants, indexes, lifecycle, and migration.
- [contracts/schema.graphql](./contracts/schema.graphql) defines the combined account/setup GraphQL contract and coordinated breaking-change rollout.
- [quickstart.md](./quickstart.md) defines executable validation flows and expected outcomes.
- The Spec Kit installation contains no agent-context update script, so no generated agent context file is modified.

## Project Structure

### Documentation (this feature)

```text
specs/002-event-categories-entries/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── schema.graphql
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
votiy-api/
├── src/
│   ├── api/graphql/
│   ├── domain/
│   ├── migrations/
│   ├── observability/
│   ├── repositories/
│   └── services/
└── tests/
    ├── contract/
    ├── integration/
    └── unit/

votiy-web/
├── src/
│   ├── components/
│   └── features/events/
└── tests/
    ├── component/
    └── e2e/

compose.yaml
render.yaml
```

**Structure Decision**: Extend the existing React/GraphQL/MongoDB web application in its current feature, service, domain, and repository layers. Add only focused category/entry domain modules, migration support, event setup components, and corresponding layered tests.

## Design Details

### Persistence and atomicity

- Embed `categories` in each event because categories are event-owned, bounded, always loaded with event setup, and changed independently through atomic event updates.
- Embed `entries` in each event registration because entries are participant-owned, bounded per participant, and must be created atomically with the registration record.
- Use a MongoDB transaction for provisional-account creation, registration-with-entries creation/revival, and idempotency persistence. Configure local MongoDB as a single-node replica set so integration behavior matches Atlas.
- Use conditional atomic updates for category title uniqueness and host ownership. Repositories remain persistence-only; services enforce authorization and cross-entity invariants.

### Migration and compatibility

- Run an idempotent versioned migration before strict validators are updated and before the HTTP server begins accepting traffic.
- Backfill every account display name from the stored email prefix; assign stable `Participant {n}` labels to legacy phone-only accounts without exposing phone numbers.
- Add a default category to every existing event using the event title.
- Sort all active and removed registrations by `createdAt`, then immutable ID, and add one default-category entry titled `Entry 1`, `Entry 2`, and so forth while preserving status.
- Treat entry details and display names as a coordinated contract change. Keep the runtime on the previous schema until migrations, resolvers, and both web flows are ready, then activate the combined schema and web bundle in the same tested commit. Cached clients receive an actionable reload error instead of compatibility-generated entries.
- Every intermediate implementation commit on `main` remains deployable: new domain/repository code stays unused until its activation task, validators temporarily accept version 1 and 2 documents, migration runs idempotently, and final activation reruns catch-up migration before enforcing version 2.
- New account/setup UI remains behind a source-controlled disabled-by-default feature gate while intermediate web tasks deploy; the activation commit flips that gate together with the runtime schema so old inputs remain in use until the API is ready.
- Test-first tasks are developed locally and intentionally fail before implementation, but are not pushed as red commits; they are committed and pushed with the first paired implementation task after the relevant validation passes.

### UI flow

- Event details defaults to a Setup tab showing categories and entries grouped beneath each category.
- A Participants tab shows participant identity using the existing private admin representation and an aggregate entry count.
- Account signup includes required display name. The add-participant form includes required display name and email, optional phone, and a required first entry row preselected to the default category. Hosts can change the category or append more entry rows before one atomic submission.
- OPEN-event self-registration replaces the one-click action with an entry-details form containing one initial row preselected to the default category; the signed-in account supplies ownership through its display name.
- Reuse shared form surfaces and field error rendering. Preserve unsaved entry rows on validation or service failure.

### Observability and delivery

- Audit `category.created`, `category.renamed`, `entry.created`, and denied setup mutations with event/category/entry IDs only.
- Emit structured operation, outcome, duration, entry count, and correlation ID. Never log titles together with contact identifiers, email, or phone.
- Track setup mutation error rate, p95 user-visible setup latency, account/event/registration migration outcome, stale-client reload errors, and critical-flow success.
- Alert when migration fails, setup mutation errors exceed 5% for 10 minutes, or post-deploy setup reads fail; first diagnostic step is correlation-ID and operation-name log lookup.

## Post-Design Constitution Re-check

PASS. The design keeps existing boundaries, adds no service, supplies explicit authorization and all-record migration rules, coordinates the breaking contract with an exact tested deployment, covers all required test layers, and defines privacy-safe observability. No constitution exception requires complexity tracking.

## Complexity Tracking

No constitution violations.
