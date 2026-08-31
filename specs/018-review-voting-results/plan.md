# Implementation Plan: Review Voting Results

**Branch**: `018-review-voting-results` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

## Summary

Replace results placeholder with host-only aggregate view. Add pure tally domain logic, event ballot/entry repository reads, authorized results service, GraphQL contract, responsive UI, and layered tests. Results calculate on request from immutable ballots.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js 24, React 19

**Primary Dependencies**: GraphQL 16, MongoDB 7, React Router 7, Vite 8

**Storage**: Existing MongoDB events, entries, ballots, audit events

**Testing**: Vitest unit/contract/integration/component; Playwright E2E

**Target Platform**: Render Linux service; current mobile and desktop browsers

**Project Type**: API plus web client

**Performance Goals**: Host sees results within 2 seconds for 10,000 ballots

**Constraints**: Host-only; immutable ballots; exact winner paths covered; no voter identity exposure

**Scale/Scope**: One event result request, all categories, up to 10,000 ballots

## Constitution Check

*GATE: Passed before research and after design.*

- **User value and scope**: Host gets ballot count and leaders; sharing, exports, charts, and certification excluded.
- **Identity and ownership**: Service verifies authenticated event owner before reading ballots.
- **Contracts and boundaries**: Pure tally domain, repository reads, service authorization, GraphQL output, UI rendering remain separate.
- **Layered quality**: Full scoring decision paths receive unit tests; GraphQL contract, Mongo integration, component, and critical E2E coverage planned.
- **Continuous delivery**: Existing main pipeline remains deployment gate.
- **Observability**: Privacy-safe result-view audits and structured operation logs include event/correlation identifiers, not selections or voters.
- **Operational simplicity**: Uses existing runtime, collections, route, and workspace. No migration, dependency, or environment change.

## Project Structure

```text
specs/018-review-voting-results/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/schema-extension.graphql
└── tasks.md

votiy-api/src/
├── domain/voting-results.js
├── services/event-results-service.js
├── repositories/ballot-submission-repository.js
├── repositories/event-entry-repository.js
└── api/graphql/{schema.js,event-resolvers.js}

votiy-web/src/features/
├── events/OwnerEventResultsPage.jsx
└── voting/voting.graphql.js
```

**Structure Decision**: Extend existing web/API packages and results route. Pure domain calculator makes scoring deterministic and independently testable.

## Complexity Tracking

No constitution violations.
