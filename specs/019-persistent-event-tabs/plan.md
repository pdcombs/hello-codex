# Implementation Plan: Persistent Event Tabs

**Branch**: `019-persistent-event-tabs` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

## Summary

Replace three independently mounted owner event pages with one nested event workspace route. Workspace loads event context once, renders summary and tabs once, and exposes event state through React Router outlet context. Entries, Participants, and Results become child content views with section-contained loading, retry, empty, and error states. Existing URLs, GraphQL operations, authorization, and business behavior remain unchanged.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js 24, React 19

**Primary Dependencies**: React Router 7, Vite 8, GraphQL client utilities

**Storage**: N/A; existing MongoDB-backed GraphQL reads remain unchanged

**Testing**: Vitest with Testing Library; Playwright E2E

**Target Platform**: Current mobile and desktop browsers

**Project Type**: React web client backed by existing GraphQL API

**Performance Goals**: Selected tab state updates within 100 ms; zero shared event reloads during same-event tab navigation; no stale tab content after rapid navigation

**Constraints**: Preserve URLs, owner authorization, deep links, browser history, tab behavior, and initial full-page loading/error behavior

**Scale/Scope**: One shared event workspace and three owner-only child views

## Constitution Check

*GATE: Passed before research and after design.*

- **User value and scope**: Host retains event context while switching three management tabs; settings, voting, preloading, and redesign remain excluded.
- **Identity and ownership**: Existing GraphQL authorization remains authoritative; workspace rejects non-owner context before protected child content renders.
- **Contracts and boundaries**: Workspace owns shared event state; outlet context is documented UI contract; children own tab-specific data and presentation.
- **Layered quality**: Component tests cover persistent shell, contained states, stale responses, deep links, history, and selection; Playwright covers critical navigation. API contracts are unchanged.
- **Continuous delivery**: Existing `main` pipeline remains; web tests and production build gate validation.
- **Observability**: No server operations change. GraphQL errors remain actionable inside selected section without sensitive logging.
- **Operational simplicity**: Existing React Router, loaders, components, and GraphQL calls suffice. No dependency, service, schema, migration, or environment change.

## Project Structure

```text
specs/019-persistent-event-tabs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/event-workspace-ui.md
└── tasks.md

votiy-web/src/
├── app/AppRouter.jsx
└── features/events/
    ├── OwnerEventWorkspacePage.jsx
    ├── OwnerEventPage.jsx
    ├── OwnerEventParticipantsPage.jsx
    ├── OwnerEventResultsPage.jsx
    ├── EventWorkspaceLayout.jsx
    └── EventWorkspaceTabs.jsx

votiy-web/tests/component/event-workspace-routing.test.jsx
tests/e2e/event-details-navigation.spec.js
```

**Structure Decision**: Extend web package only. Parent owner workspace route gives shared UI stable ownership; current page components become child content views.

## Complexity Tracking

No constitution violations.
