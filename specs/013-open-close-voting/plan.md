# Implementation Plan: Open / Close Voting

**Branch**: `main` | **Date**: 2026-08-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-open-close-voting/spec.md`

## Summary

Add explicit manual voting state embedded in each event, host-only optimistic open/close transitions, and fresh access-decision boundary used by public Vote action. Manual state replaces date-window enforcement while saved dates remain display-only. Code access atomically consumes one code and stores account- or browser-bound access grant before routing to placeholder voting page. Existing ballot submission independently rechecks manual state and preserved repeat history.

## Technical Context

**Language/Version**: JavaScript ES modules on Node.js 24.x; React 19

**Primary Dependencies**: GraphQL 16, MongoDB driver 7, React Router 7, Zod 4

**Storage**: MongoDB replica set; embedded event voting state plus evolved event voter access grants and retained audit events

**Testing**: Vitest unit/contract/real-Mongo integration/component coverage; Playwright desktop/mobile E2E; production smoke

**Target Platform**: Render Linux service and current mobile/desktop browsers

**Project Type**: React single-page web application with Node GraphQL API

**Performance Goals**: 95% of host transitions and access decisions visibly complete within two seconds

**Constraints**: 80% repository line/branch coverage; every ownership, status, repeat-limit, and code-claim decision path; no raw code/browser marker in logs or audits; one concurrent code claimant

**Scale/Scope**: Existing per-event limits: up to 100 categories and 100,000 voting codes; one host state transition or voter access request per interaction

## Constitution Check

- **User value and scope**: PASS. Host state control and voter gate defined; ballot UI/results excluded.
- **Identity and ownership**: PASS. Host-only mutation enforced at API; public access evaluation exposes requirements without private identity data.
- **Contracts and boundaries**: PASS. GraphQL, domain state, persistence, and UI requirements object documented in `contracts/`.
- **Layered quality**: PASS. Unit, contract, real-Mongo, component, desktop/mobile E2E, smoke, privacy, and concurrency coverage planned.
- **Continuous delivery**: PASS. Existing CI/deploy gates extended for Feature 013 and safe production smoke.
- **Observability**: PASS. State transition/access/code-claim signals, correlation IDs, safe audits, latency/error budgets, and first diagnostics planned.
- **Operational simplicity**: PASS. Existing React/GraphQL/Mongo stack and collections reused; no new service, dependency, or secret.

Post-design re-check: PASS. Manual state and access grant evolution use existing event and voter-access boundaries. No constitution exception.

## Project Structure

### Documentation (this feature)

```text
specs/013-open-close-voting/
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

### Source Code (repository root)

```text
votiy-api/
├── src/
│   ├── api/graphql/{schema.js,event-resolvers.js}
│   ├── domain/{event.js,event-voting-state.js,ballot-submission.js,validation.js}
│   ├── migrations/006-manual-voting-state.js
│   ├── repositories/{event-repository.js,event-voter-access-repository.js,voting-access-code-repository.js,indexes.js,audit-event-repository.js}
│   ├── services/{event-voting-state-service.js,event-voting-service.js}
│   └── server.js
└── tests/{unit,contract,integration,support}/

votiy-web/
├── src/
│   ├── app/AppRouter.jsx
│   ├── features/auth/{SignInPage.jsx,RegisterPage.jsx,VerifyEmailPage.jsx}
│   ├── features/events/{EventPage.jsx,EventVotingSummary.jsx,EventWorkspaceSummary.jsx}
│   └── features/voting/{VotingAccessButton.jsx,VotingCodeModal.jsx,VotingComingSoonPage.jsx,voting.graphql.js}
└── tests/component/

tests/{e2e,smoke}/
```

**Structure Decision**: Extend established API/web feature modules. Store state with event because transition and ballot gate require one current event read. Evolve existing voter-access collection instead of adding another service or credential store.

## Complexity Tracking

No constitution violations.
