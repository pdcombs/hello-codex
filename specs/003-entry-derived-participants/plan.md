# Implementation Plan: Entry-Derived Participants

**Branch**: `main` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-entry-derived-participants/spec.md`

## Summary

Replace event-registration membership as the active source of truth with standalone, archiveable event entries. A participant becomes the projection of an account owning at least one active entry in an event. Migrate embedded entries without changing ownership or category, expose host-only participant cards grouped from active entries, add entry-level and participant-level archival mutations, retain audit history, and activate the API and UI together with compatibility protection for the current production client.

## Technical Context

**Language/Version**: JavaScript on Node.js 24.x; React 19 client

**Primary Dependencies**: GraphQL 16, MongoDB driver 7, Zod 4, React Router 7, Vite 8

**Storage**: MongoDB 8; categories remain embedded on events, entries move from registration arrays to a dedicated `eventEntries` collection with active/archived lifecycle

**Testing**: Vitest unit/component/contract suites, MongoDB replica-set integration tests, Playwright critical-flow E2E tests

**Target Platform**: Current mobile and desktop browsers; Node service on Render; MongoDB Atlas production cluster

**Project Type**: Web application with React frontend and Node GraphQL backend

**Performance Goals**: Participant cards usable within two seconds for 1,000 participants and 5,000 entries; entry archival reflected in active event views immediately after success

**Constraints**: Host-only email and removal access; no hard deletion; participant removal archives all active event entries atomically; one-entry removal may preserve participation; other-event entries are isolated; operational logs exclude contact details and entry titles; repository-wide 80% line and branch coverage

**Scale/Scope**: Up to 5,000 entries and 1,000 derived participants per event; one migration of all embedded entries; no new runtime service or dependency

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **User value and scope**: PASS — the host consistency problem, participant-card job, measurable outcomes, archival behavior, and exclusions are explicit.
- **Identity and ownership**: PASS — event ownership gates private contact data and every mutation; entry ownership remains explicit; account deletion is prohibited.
- **Contracts and boundaries**: PASS — GraphQL v3 projections/mutations, service invariants, persistence migration, compatibility activation, and safe failure behavior are documented.
- **Layered quality**: PASS — domain/service unit paths, schema/persistence contracts, real replica-set transactions, migration integration, component accessibility, and critical E2E flows are planned.
- **Continuous delivery**: PASS — intermediate commits remain compatible, the activation commit changes API/UI together, CI blocks failure, and post-deploy smoke verifies exact tested behavior.
- **Observability**: PASS — privacy-safe archive audit events, structured aggregate signals, readiness migration state, dashboards, alerts, and correlation-first diagnostics are planned.
- **Operational simplicity**: PASS — the existing application and database are reused with one collection and no new dependency or service.

## Phase 0: Research Decisions

Research outcomes are recorded in [research.md](./research.md). No unresolved technical clarification remains.

## Phase 1: Design and Contracts

- [data-model.md](./data-model.md) defines standalone entry ownership, lifecycle, indexes, projections, and migration 003.
- [contracts/schema.graphql](./contracts/schema.graphql) defines entry-derived participant reads and archive mutations.
- [quickstart.md](./quickstart.md) defines executable validation, migration, privacy, and deployment checks.
- This Spec Kit installation has no agent-context update script, so no generated agent context file is changed.

## Project Structure

### Documentation (this feature)

```text
specs/003-entry-derived-participants/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── schema.graphql
└── checklists/
    └── requirements.md
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
    └── component/

tests/e2e/
tests/smoke/
```

**Structure Decision**: Extend the existing layered React/GraphQL/MongoDB application. Add an entry domain/repository/service lifecycle, migration 003, participant-card projection and UI, then retire registration-backed active reads only after compatibility validation.

## Design Details

### Persistence and domain source of truth

- Add `eventEntries`, one document per entry, containing event, category, owner account, creator, title, lifecycle, archival actor/reason/time, timestamps, and schema version.
- `status=active` entries alone populate categories, participant cards, and counts. Archived documents retain original ownership and category association.
- A participant has no stored record or independent lifecycle. It is a host-only projection grouping active entries by `ownerAccountId`, joined to accounts for display name and email.
- Creating entries for a new identifier may create a provisional account and all requested entries in one transaction. Existing account reuse and idempotency behavior remain.
- Archiving one entry is a conditional update. Archiving a participant is one transaction updating all matching active `(eventId, ownerAccountId)` entries; zero matches returns a conflict/not-found outcome without mutation.

### Migration and compatibility

- Migration 003 copies every embedded entry from every active or removed registration into `eventEntries` using the embedded entry ID as the new document ID, making reruns idempotent.
- Registration status maps to entry state: entries on `registered` registrations become active; entries on `removed` registrations become archived using the legacy removal timestamp and a migration reason.
- Preserve event, category, owner account, creator, title, and creation time. Validate category and account references before completing a batch; readiness remains false on unresolved invalid references.
- During migration and rollout, reads prefer standalone entries only after the migration completion marker is present. Existing schema and UI remain functional until the coordinated activation commit.
- Activate GraphQL v3, resolvers, participant cards, and entry archival controls in one tested commit. Retain deprecated registration queries/mutations for one compatibility window by adapting them to entry operations; do not create new registration records.
- After the compatibility window and production telemetry show no legacy calls, a later cleanup may remove deprecated contract fields and registration active-read code. Historical registration documents remain read-only audit input and are never hard deleted in this feature.

### API and UI flow

- `eventParticipants(eventId)` returns host-only `ParticipantCard` projections with account ID, display name, email, active entry titles, and count. Archived entries remain database-only history and are not exposed through a user-facing query in this feature.
- `archiveEventEntry` archives one active entry after event-owner validation and explicit UI confirmation.
- `archiveEventParticipantEntries` archives every active entry for one owner in one event after event-owner validation and explicit confirmation.
- Category entry projections read active standalone entries and remain safe for existing public event visibility; contact data is never added to public entry types.
- Participants tab uses accessible cards: name title, email subtitle, entry-title list, right-aligned numeric count, and clear loading/empty/failure states.
- Entry controls live with entries and participant removal lives on participant cards. Successful actions refetch the event projection; failures preserve the last confirmed view and identify the failed action.

### Testing, delivery, and observability

- Unit tests exhaust authorization, active/archived transitions, final-entry participation, partial-removal prevention, idempotency, other-event isolation, and projection grouping.
- Contract tests lock GraphQL shapes and persistence validators/indexes. Integration tests use MongoDB transactions for account/entry creation, batch archive, concurrent archive, and migration reruns.
- Component and E2E tests cover accessible participant cards, one-entry removal, final-entry removal, participant removal confirmation, empty state, and unauthorized access.
- Audit `entry.archived` and `participant.entries_archived` with IDs/count/reason only. Structured logs include operation, outcome, duration, count, correlation ID, and no title/email/phone.
- Readiness reports migration 003. Track participant-read p95, archive error rate, zero-match conflicts, migration counts/failures, and critical-flow success. Alert on migration failure, archive error rate above 5% for 10 minutes, or post-deploy participant-card smoke failure.
- Post-deploy smoke uses an isolated synthetic event/account to create and archive an entry safely, verifies active views and retained database state, and never mutates real user fixtures.
- Rollback returns application code to the last known-good commit without deleting `eventEntries`; dual-compatible data and legacy registration history allow old reads during the compatibility window.

## Post-Design Constitution Re-check

PASS. The design removes contradictory state, preserves explicit ownership and least privilege, makes all removal archival and auditable, provides a compatible migration/activation path, covers all mandated test layers, and adds no operational service. No exception requires complexity tracking.

## Complexity Tracking

No constitution violations.
