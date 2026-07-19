# Implementation Plan: Add Entries

**Branch**: `main` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-add-entries/spec.md`

## Summary

Add host-facing entry creation to every category through an accessible two-step modal. First step loads recent event participants or bounded global account matches by normalized contact prefix; unmatched complete contacts may create a provisional account. Second step validates title and submits one idempotent transaction that revalidates manager, event, category, and owner, creates one entry, and returns hydrated entry/participant projections. Existing entry-derived participation remains source of truth.

## Technical Context

**Language/Version**: JavaScript on Node.js 24.x; React 19 client

**Primary Dependencies**: GraphQL 16, MongoDB driver 7, Zod 4, React Router 7, Vite 8

**Storage**: MongoDB 8; existing `accounts`, embedded event categories, standalone `eventEntries`, idempotency, and audit collections

**Testing**: Vitest unit/component/contract suites, MongoDB replica-set integration tests, Playwright critical-flow E2E tests

**Target Platform**: Current mobile and desktop browsers; Node service on Render; MongoDB Atlas production cluster

**Project Type**: Web application with React frontend and Node GraphQL backend

**Performance Goals**: Owner choices usable within one second after input pause; recent-participant selection and entry save complete within 30 seconds for first-time hosts; event refresh within two seconds for up to 1,000 participants and 5,000 entries

**Constraints**: Three-character search minimum; ten-result maximum; authenticated event-manager authorization before contact access; exact event/category/account revalidation on save; one entry per intended idempotent operation; no contact values in logs or audit metadata; repository-wide 80% line and branch coverage

**Scale/Scope**: Up to 1,000 participants and 5,000 active entries per event; bounded global prefix lookup; one modal and two new GraphQL operations; no new runtime service or dependency

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **User value and scope**: PASS — host job, three prioritized journeys, measurable outcomes, and deferred editing/bulk/voting work are explicit.
- **Identity and ownership**: PASS — lookup and creation require event-management permission at server boundary; selected account owns entry; actor remains auditable; public contact exposure prohibited.
- **Contracts and boundaries**: PASS — UI state, GraphQL operations, service validation, transaction, persistence queries, failure behavior, and compatible additions are documented.
- **Layered quality**: PASS — authorization and validation decisions receive unit coverage; schema/index contracts, real transaction/search integration, component accessibility, and critical E2E flows are planned.
- **Continuous delivery**: PASS — additions preserve current operations, CI gates all layers, exact tested commit deploys, and isolated post-deploy smoke covers lookup/create/archive.
- **Observability**: PASS — correlation-safe structured signals, domain audits without contact data, SLI queries, readiness, and alerts are defined.
- **Operational simplicity**: PASS — current app, database, indexes, and transaction boundary are reused; no service, package, environment contract, or migration added.

## Phase 0: Research Decisions

Research outcomes recorded in [research.md](./research.md). No unresolved technical clarification remains.

## Phase 1: Design and Contracts

- [data-model.md](./data-model.md) defines existing-account/provisional-owner paths, choice projections, query/index behavior, and state transitions.
- [contracts/schema-extension.graphql](./contracts/schema-extension.graphql) defines additive GraphQL owner-choice and single-entry creation operations.
- [contracts/persistence.md](./contracts/persistence.md) defines bounded contact and recent-owner query contracts plus transaction invariants.
- [quickstart.md](./quickstart.md) defines executable validation, privacy, accessibility, observability, and deployment checks.
- Spec Kit installation has no agent-context update script; no generated agent context file changes.

## Project Structure

### Documentation (this feature)

```text
specs/004-add-entries/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── schema-extension.graphql
│   └── persistence.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
votiy-api/
├── src/
│   ├── api/graphql/
│   ├── domain/
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
└── tests/component/

tests/e2e/
tests/smoke/
```

**Structure Decision**: Extend existing layered React/GraphQL/MongoDB application. Add account-choice repository/service behavior and single-entry service operation; compose modal from reusable event feature components; retain existing multi-entry and legacy contracts unchanged.

## Design Details

### Authorization and compatibility

- Centralize event-management check used by owner choices and creation. Current data model grants this permission to `ownerAccountId`; naming and boundary permit future delegated administrators without weakening current access.
- Account choice queries authorize before reading accounts or entries. Authentication failure, missing event, and forbidden access return existing safe error union with no choices.
- New schema fields and operations are additive. `createEventEntriesForParticipant`, participant page, category reads, and deprecated compatibility operations remain valid.
- UI activation and API contract ship together. Older web clients ignore additions; newer client handles schema-mismatch failure safely until deployed API is active.

### Owner choices

- `entryOwnerChoices(eventId, search, first)` uses one host-only operation. Empty search returns recent active event participants. Search requires three normalized characters and performs global email/phone prefix matching.
- Contact input normalization determines email-like or phone-like search. Repository uses bounded range predicates against existing unique normalized indexes; no unanchored scan, text index, or external search service.
- Return at most ten choices. Each includes account ID, display name, available email/phone, whether account currently participates, and latest active event-entry timestamp when applicable.
- Recent choices group active event entries by owner, take each owner's newest `createdAt`, order descending with account ID tie-break, limit before account hydration, and exclude archived-only owners.
- UI debounces input, aborts superseded requests where possible, and uses monotonically increasing request identity so stale responses never replace current results.

### Single-entry creation

- `createEventEntry` accepts event, fixed category, title, idempotency key, and exactly one owner source: existing `accountId` or provisional `{displayName,email,phone}`.
- Validate syntax before transaction. Within transaction: authorize manager, verify category belongs to event, resolve existing owner or normalize/recheck contact uniqueness, create provisional account only if no exact account exists, create one active entry, store idempotency result, commit.
- If provisional contact now matches account because of concurrent creation, reuse matching account. Conflicting email and phone mapping to different accounts returns conflict; never merge automatically.
- Idempotent replay returns stored entry and hydrated participant. Same key with different digest returns conflict. Transaction failure creates neither entry nor idempotency record; provisional account creation rolls back with entry failure.
- Successful response returns created entry and affected participant; web reloads hydrated event and closes modal. Failure preserves category, owner choice/provisional fields, and title.

### UI behavior and accessibility

- Empty category replaces plain empty copy with primary Add entry prompt. Populated category exposes content-sized Add entry action without entering category-edit mode.
- Modal step 1 heading: “Who is this entry for?” Search field and recent choices share one selection list. Search loading, empty, failure, provisional creation, and selected state remain distinct.
- Provisional path appears only after complete valid contact returns no exact match; it requests display name and confirms contact before owner selection.
- Step 2 shows selected person and locked category, validates title, and exposes Back, Cancel, Save. Save disabled during request.
- Focus enters modal heading, remains trapped while open, advances to step headings, returns to initiating category action on close, supports Escape/cancel, keyboard listbox navigation, labelled errors, mobile scrolling, and reduced-motion preferences.

### Testing, delivery, and observability

- Unit tests cover manager authorization, normalization, minimum/maximum lookup bounds, recent grouping/order/ties, stale-result state, XOR owner source, exact account reuse, conflicting contacts, invalid category, idempotent replay, and privacy-safe errors.
- Contract tests lock additive schema, input/result unions, search limit validation, repository index definitions, and no contact fields on public event types.
- Replica-set integration tests exercise indexed email/phone prefix lookup, archived exclusion, recent ordering, concurrent provisional resolution, transaction rollback, idempotency, and unauthorized no-read behavior.
- Component tests cover empty/populated category actions, both modal steps, search/recent/provisional paths, focus return, keyboard operation, state preservation, mobile layout, and reload after success.
- Playwright covers recent-owner add, global lookup add, provisional add, retry without duplicate, and unauthorized denial.
- Log `entry.owner_choices_read` and `event.entry_create` with outcome, result/entry count, duration, correlation ID, and lifecycle category only. Never log search string, display name, title, email, or phone.
- Audit successful/denied entry creation with event/category/entry/owner/actor IDs and provisional-created boolean; contact values excluded.
- Track owner-choice latency/error/denial rate, entry-create success/error/conflict rate, transaction aborts, and critical-flow success. Alert when lookup or create errors exceed 5% for 10 minutes, p95 choice latency exceeds one second for 10 minutes, or post-deploy smoke fails.
- Post-deploy smoke uses dedicated synthetic event/category/account: verify bounded lookup, create one idempotent entry, confirm category/participant projection, archive entry, confirm active removal. Never query or mutate real user fixtures.
- Rollback restores prior application commit. Additive schema/indexes and existing entry documents remain compatible; no data reversal required.

## Post-Design Constitution Re-check

PASS. Design keeps contact data behind manager authorization, preserves account/entry ownership, uses atomic idempotent creation, adds compatible contracts, covers all required test layers and production signals, and introduces no service or dependency. No exception requires complexity tracking.

## Complexity Tracking

No constitution violations.
