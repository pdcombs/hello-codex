# Implementation Plan: Clickable Voting Banner

**Branch**: `022-clickable-voting-banner` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

## Summary

Render open-voting banner and existing Vote button from one voting-access controller. Banner becomes semantic full-width button using same request state, access decisions, modal, errors, and navigation. Preserve current button and banner visuals while adding focus and pending states.

## Technical Context

**Language/Version**: JavaScript ES modules, React 19
**Primary Dependencies**: React Router 7, existing GraphQL client
**Storage**: N/A
**Testing**: Vitest and React Testing Library
**Target Platform**: Current desktop/mobile browsers
**Project Type**: Web frontend enhancement
**Performance Goals**: Immediate interaction; one access request per activation
**Constraints**: No API/data changes, accessible button semantics, shared state, existing Vote button unchanged
**Scale/Scope**: Two components, shared CSS, component tests

## Constitution Check

- User value, visitor journey, metrics, and exclusions defined.
- No new private data or ownership boundary.
- Existing API contract unchanged; shared UI controller remains boundary.
- Component tests cover open/closed, access outcomes, keyboard semantics, and duplicate activation.
- Existing CI, deployment, request logging, health, and rollback unchanged.
- No new service, dependency, secret, or migration.

**Gate result**: PASS before and after design.

## Project Structure

```text
votiy-web/src/features/events/EventWorkspaceSummary.jsx
votiy-web/src/features/voting/VotingAccessButton.jsx
votiy-web/src/features/voting/useVotingAccessController.js
votiy-web/src/App.css
votiy-web/tests/component/voting-access.test.jsx
votiy-web/tests/component/open-close-voting.test.jsx
```

**Structure Decision**: Extend existing voting-access component to own both triggers. Avoid duplicate controllers and competing modal/request state.

## Complexity Tracking

No violations.
