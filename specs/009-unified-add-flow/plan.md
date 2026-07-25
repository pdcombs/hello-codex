# Implementation Plan: Unified Add Flow

**Branch**: `main` | **Date**: 2026-07-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-unified-add-flow/spec.md`

## Summary

Replace scattered Add Category, Add Entry, and Add Participant controls with one owner-only primary Add
button in the shared event summary. Shared workspace layout mounts one reusable accessible bottom sheet
for Entries, Participants, and Results. Sheet first selects Category or Entry, then composes existing
category creation or entry-owner/title behavior. Entry flow adds mandatory category selection, defaulted
by `isDefault`. Existing GraphQL mutations, server authorization, idempotency, persistence, and
entry-derived participant behavior remain authoritative. Legacy category/entry launch controls remain
until both replacement paths pass, then are removed in one cutover.

## Technical Context

**Language/Version**: JavaScript ES modules on Node.js 24; React 19

**Primary Dependencies**: React, React Router, Zod, existing GraphQL client helpers; no new dependency

**Storage**: Existing MongoDB event categories, event entries, and account collections; no schema change

**Testing**: Vitest, Testing Library, Playwright, existing real-Mongo API integration suites

**Target Platform**: Current desktop and mobile browsers; Render-hosted Node.js service

**Project Type**: React web application plus GraphQL/Node.js service

**Performance Goals**: Add sheet visible within 100 ms after activation; refreshed event content visible
within 2 seconds for 95% of normal successful submissions

**Constraints**: Preserve 80% line/branch coverage; keep owner authorization server-side; no direct
participant creation in current UI; no horizontal overflow at 320 px; existing API contracts remain
compatible

**Scale/Scope**: One shared event-summary action and sheet controller across three owner content routes,
one multi-step bottom sheet, two composed creation flows, participant-panel simplification, and related
tests/observability

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **User value and scope**: PASS. Event host and simplified creation job are explicit; edit/delete,
  bulk actions, verification changes, and non-host creation are excluded.
- **Identity and ownership**: PASS. Add is owner-only in UI; existing server-side category, entry, and
  account authorization remains authoritative and receives direct-call regression coverage.
- **Contracts and boundaries**: PASS. UI orchestration composes existing validated mutations; no
  persistence change. Validation and failure behavior are defined in spec and contracts.
- **Layered quality**: PASS. Component state/keyboard tests, existing API contract/integration
  regressions, and desktop/mobile E2E critical flows are planned. Repository coverage gate remains 80%.
- **Continuous delivery**: PASS. Existing CI, deployment, smoke, and rollback flow remains unchanged;
  unified Add critical flow joins pre-deployment E2E and safe production smoke coverage.
- **Observability**: PASS. Existing category/entry operation names, correlation IDs, audits, latency,
  and failure logs remain authoritative. UI orchestration adds no personal data to logs.
- **Operational simplicity**: PASS. No service, dependency, environment variable, schema, or migration
  added. Existing components and contracts are reused.

## Project Structure

### Documentation (this feature)

```text
specs/009-unified-add-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── add-flow-ui.md
│   └── existing-api-reuse.md
└── tasks.md
```

### Source Code (repository root)

```text
votiy-web/
├── src/
│   ├── components/
│   └── features/events/
│       ├── EventWorkspaceSummary.jsx
│       ├── EventWorkspaceLayout.jsx
│       ├── OwnerEventPage.jsx
│       ├── OwnerEventParticipantsPage.jsx
│       ├── EventCategoryList.jsx
│       ├── EventParticipantsPanel.jsx
│       ├── AddEntryModal.jsx
│       ├── AddEntryOwnerStep.jsx
│       ├── UnifiedAddSheet.jsx
│       ├── AddCategoryStep.jsx
│       └── events.graphql.js
└── tests/
    ├── component/
    └── support/

votiy-api/
├── src/
│   ├── api/graphql/
│   ├── services/
│   └── repositories/
└── tests/
    ├── contract/
    └── integration/

tests/
├── e2e/
└── smoke/
```

**Structure Decision**: Keep existing web/API split. Feature is primarily web orchestration. API tests
prove reused mutations continue enforcing ownership and idempotency; no new server module is justified.

## Phase 0: Research

Research decisions are recorded in [research.md](research.md):

1. Compose existing mutations instead of adding an aggregate mutation.
2. Store add-flow state only in the mounted bottom sheet.
3. Resolve the default category using `isDefault`, never display order.
4. Reuse entry-owner search and provisional account creation.
5. Mount one functional Add sheet across Entries, Participants, and Results.
6. Retain legacy category/entry launch controls until both replacement paths pass.
7. Remove direct participant creation from UI while retaining compatible API contracts.
8. Reload authoritative event data after successful creation.

## Phase 1: Design and Contracts

- [data-model.md](data-model.md) defines transient Add Session states and references existing entities.
- [contracts/add-flow-ui.md](contracts/add-flow-ui.md) defines interaction, accessibility, validation, and
  refresh behavior.
- [contracts/existing-api-reuse.md](contracts/existing-api-reuse.md) maps each step to existing service
  contracts and server-enforced rules.
- [quickstart.md](quickstart.md) defines local validation and critical journeys.

## Post-Design Constitution Check

PASS. Design adds no persistence, dependency, permission, or environment complexity. Existing API remains
authoritative. Planned component, contract/integration regression, E2E, accessibility, smoke, coverage,
and observability validation satisfy all constitution gates.

## Complexity Tracking

No constitution violations.
