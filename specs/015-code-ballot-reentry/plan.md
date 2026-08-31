# Implementation Plan: Require New Code for Each Ballot

**Branch**: `main` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

## Summary

Separate durable ballot-review identity from code-backed permission to create a ballot. A code-policy access grant represents only the current claimed code: if that code already backs a ballot, access requests require a different unused code. Submission verifies and binds the grant's exact code, while the existing unique ballot/code constraint remains the final concurrency guard. The completed-ballot screen always offers a new-code flow while code voting is open.

## Technical Context

**Language/Version**: Node.js 24, JavaScript ES modules, React 19

**Primary Dependencies**: GraphQL 16, MongoDB driver 7, Zod 4, React Router 7, Pino 10

**Storage**: MongoDB replica set; existing voting code, voter access, ballot, idempotency, and audit collections

**Testing**: Vitest unit/contract/real-Mongo integration, Testing Library, Playwright desktop/mobile, production smoke

**Target Platform**: Linux API service and current desktop/mobile web browsers

**Project Type**: React web application plus GraphQL API

**Performance Goals**: Code decision and ballot review visibly resolve within two seconds under normal conditions

**Constraints**: One accepted ballot per code under races; immutable prior ballots; safe retries; no secrets or choices in logs; 320 CSS pixels and 200% zoom

**Scale/Scope**: Existing event/code limits; focused correction with no new service or dependency

## Constitution Check

*GATE: Passed before research and after design.*

- **User value and scope**: PASS. Shared-device voter, fresh-code job, measurable outcomes, and exclusions are explicit.
- **Identity and ownership**: PASS. Review identity and submission authorization are separate; exact code is validated authoritatively.
- **Contracts and boundaries**: PASS. UI, service, persistence, validation, and failures are explicit.
- **Layered quality**: PASS. Unit, contract, real-Mongo race/idempotency, component, desktop/mobile E2E, and smoke coverage are planned.
- **Continuous delivery**: PASS. Existing `main` pipeline, build gates, safe smoke, and rollback remain applicable.
- **Observability**: PASS. Structured correlation and audits use privacy-safe code-reuse outcomes.
- **Operational simplicity**: PASS. Existing collections, grant, indexes, and modal patterns are reused.

Post-design re-check: PASS. No new privilege, service, dependency, destructive migration, or ballot exposure.

## Project Structure

```text
specs/015-code-ballot-reentry/{plan,research,data-model,quickstart,tasks}.md
specs/015-code-ballot-reentry/contracts/{graphql-behavior,ui-contract}.md
votiy-api/src/repositories/{ballot-submission,voting-access-code}-repository.js
votiy-api/src/services/event-voting-service.js
votiy-api/tests/{unit,contract,integration}/
votiy-web/src/features/voting/{VotingPage,EventBallot,VotingCodeModal,voting.graphql}.jsx
votiy-web/tests/component/
tests/{e2e,smoke}/
```

**Structure Decision**: Preserve API/web separation and Feature 014 voting module. Extend current repositories and access mutation behavior rather than add another authorization subsystem.

## Design Sequence

1. Add code-to-ballot lookup and claimed-code ballot attachment operations.
2. Distinguish an unused current grant from a grant already used by a ballot.
3. Require the grant's exact unused-for-ballot code during submit; map races to code denial.
4. Return repeat availability for every open code-policy completed ballot.
5. Open new-code modal before resetting the editable ballot.
6. Validate browser/account, race, idempotency, revisit, accessibility, E2E, and smoke behavior.

## Deployment and Rollback

- No destructive migration; retain the unique ballot/code constraint.
- Roll back code only; preserve ballots, codes, grants, idempotency, audits, and encryption key.
- Alert on duplicate code conflicts, accepted code ballots without exact linkage, or elevated invalid-code denials.

## Complexity Tracking

No constitution violations.
