# Implementation Plan: Event Details and Voting Summary

**Branch**: `011-edit-event-voting-summary` (planning label; repository remains on `main`) | **Date**: 2026-08-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-edit-event-voting-summary/spec.md`

## Summary

Add a host-only optimistic-concurrency mutation and settings form for event title, description, and
location, atomically rebuilding the existing search projection when those values change. Add a pure,
viewer-aware voting summary below event details using local-time formatting and authoritative rule data,
while preserving private-summary minimization. Make the existing default voting rule the sole active
event-wide method, retain legacy category overrides as dormant history, and replace the completed-account
checkbox with a native accessible switch. No new service, dependency, secret, collection, or document
migration is required.

## Technical Context

**Language/Version**: JavaScript ES modules on Node.js 24; JSX with React 19

**Primary Dependencies**: React 19.2, React Router 7.18, GraphQL 16.11, MongoDB driver 7, Zod 4.4,
Pino 10; browser `Intl.DateTimeFormat`

**Storage**: Existing MongoDB `events` collection and schema-version-4 event documents; raw event fields,
derived search projection, embedded voting rules, and preserved dormant category overrides

**Testing**: Vitest 4 unit/component/contract/integration coverage; Testing Library; real MongoDB replica
set integration tests; Playwright desktop/mobile E2E; production smoke

**Target Platform**: Current desktop/mobile browsers; Linux Node service on Render; MongoDB local replica
set and Atlas production cluster

**Project Type**: Web application with React client and GraphQL API

**Performance Goals**: 95% of event detail/rule loads and successful updates become visible within two
seconds; summary formatting adds no network request; existing search/event latency budgets remain intact

**Constraints**: Host-only active-event edits; optimistic concurrency; stable public ID; search projection
must update atomically with details; private summaries must not receive voting data; one method and bounds
pair per event; dormant overrides preserved but inactive; local-time and timezone clarity; 320px width,
200% zoom, keyboard/touch, reduced motion; repository coverage remains at least 80% lines and branches

**Scale/Scope**: Existing single application and events collection; four UI surfaces, one additive mutation,
one semantic voting-rule change, and existing event/category volumes without new infrastructure

## Constitution Check

*GATE: Passed before Phase 0 and re-checked after Phase 1.*

- **User value and scope — PASS**: Hosts can correct core details and communicate voting rules; voters can
  understand schedule, eligibility, and ballot method. Stable links, category editing, results, reminders,
  and configurable wording are explicitly excluded.
- **Identity and ownership — PASS**: Event-detail mutation requires a verified host-owned active event at
  the authoritative boundary. Private-summary projection excludes all voting data. Dormant overrides remain
  event-owned and are not publicly exposed.
- **Contracts and boundaries — PASS**: Additive GraphQL and UI contracts define validation, stale conflicts,
  archived denial, exact wording, timezone presentation, compatibility input, and private minimization.
  Service logic owns authorization and active-rule resolution; persistence owns atomic compare-and-set.
- **Layered quality — PASS**: Unit tests cover normalization, wording, time formatting, switch state, and rule
  resolution; contract tests cover schema/projections; real-Mongo tests cover atomic updates/search refresh
  and dormant preservation; component and desktop/mobile E2E cover every critical flow.
- **Continuous delivery — PASS**: Feature tests join existing lint, coverage, contract, integration, build,
  E2E, deployment, and post-deploy smoke gates. Rollback restores the prior code while retaining compatible
  event and voting-rule data.
- **Observability — PASS**: Privacy-safe update logs/audits include operation, outcome, duration, changed
  field names/count, actor/event references, reason code, and correlation ID without detail values, voting
  contents, or dormant rules. Existing health/readiness remain sufficient.
- **Operational simplicity — PASS**: Existing React, GraphQL, MongoDB, validation, audit, and CSS boundaries
  are extended. No new dependency, service, environment variable, index, secret, or deployment step.

## Project Structure

### Documentation (this feature)

```text
specs/011-edit-event-voting-summary/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── schema-extension.graphql
│   └── settings-summary-ui.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
votiy-api/
├── src/
│   ├── api/graphql/{schema.js,event-resolvers.js}
│   ├── domain/{event.js,event-search.js,event-voting-rules.js,validation.js}
│   ├── repositories/{audit-event-repository.js,event-repository.js}
│   └── services/{event-service.js,event-visibility-service.js,event-voting-rules-service.js}
└── tests/{unit,contract,integration}/

votiy-web/
├── src/
│   ├── App.css
│   ├── features/events/{EventDetailsEditor.jsx,EventSettingsPage.jsx,EventVotingSummary.jsx,
│   │   EventWorkspaceSummary.jsx,event-voting-summary.js,events.graphql.js}
│   └── features/voting/{CategoryVotingRuleFields.jsx,EventBallot.jsx,EventRulesEditor.jsx}
└── tests/component/

tests/
├── e2e/event-details-voting-summary.spec.js
├── e2e/fixtures/event-setup.js
├── e2e/responsive-accessibility.spec.js
└── smoke/production-smoke.js
```

**Structure Decision**: Preserve the current web/API split and existing event/voting feature directories.
Use one feature-owned schema extension, one focused detail editor, and one pure summary mapping module.
Centralize active method resolution in the voting domain instead of duplicating compatibility behavior.

## Complexity Tracking

No constitution violations.

## Phase 0 Research Outcome

All technical unknowns are resolved in [research.md](research.md). No `NEEDS CLARIFICATION` remains.

## Phase 1 Design Outcome

- Data and compatibility: [data-model.md](data-model.md)
- GraphQL contract: [contracts/schema-extension.graphql](contracts/schema-extension.graphql)
- Settings and summary UI: [contracts/settings-summary-ui.md](contracts/settings-summary-ui.md)
- Validation guide: [quickstart.md](quickstart.md)

The installed Spec Kit distribution has no `update-agent-context` script, so that optional generated-context
step is unavailable; repository-native instructions and this feature's artifacts remain the planning source.

## Post-Design Constitution Re-check

- Event changes use server-side host/lifecycle authorization and atomic expected-version matching.
- Detail and search projection changes commit together; stable identity and existing indexes remain intact.
- Active projections expose one event-wide method and no dormant override contents.
- Private summaries contain no schedule, access policy, method, bounds, or account requirement.
- Compatibility accepts legacy rule payload shape without allowing dormant override mutation.
- Audit/log contracts exclude event text and voting data while retaining actionable correlation metadata.
- Unit, contract, real-Mongo integration, component, E2E, mobile accessibility, smoke, and rollback checks are
  defined with the existing 80% coverage floor.
- No migration, new infrastructure, dependency, secret, or manual release step is introduced.

**Result**: PASS. Design is ready for `/speckit-tasks`.
