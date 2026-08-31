# Implementation Plan: View Previous Vote Submissions

**Branch**: `main` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

## Summary

Add private paginated ballot history, authorized exclusively by signed-in account or signed-out browser marker. Expose identity-specific history availability in voting access decisions so code modal can link to dedicated `/events/:publicId/votes` route. History works after voting closes, uses immutable snapshots, and never changes code/submission authorization.

## Technical Context

**Language/Version**: Node.js 24, JavaScript ES modules, React 19

**Primary Dependencies**: GraphQL 16, MongoDB driver 7, Zod 4, React Router 7, Pino 10

**Storage**: Existing MongoDB ballot collection plus additive account/browser history indexes

**Testing**: Vitest unit/contract/real-Mongo integration, Testing Library, Playwright desktop/mobile, production smoke

**Target Platform**: Linux API and current mobile/desktop browsers

**Project Type**: React web application plus GraphQL API

**Performance Goals**: 95% of pages up to 50 ballots visibly ready within two seconds

**Constraints**: Private choices; account precedence; stable pagination; closed review; immutable ballots; 80% line/branch coverage; 320 CSS pixels/200% zoom

**Scale/Scope**: Event-specific history, default 20/max 50 page size, no new service or dependency

## Constitution Check

*GATE: Passed before research and after design.*

- **User value and scope**: PASS. Returning voter, private review job, measurable outcomes, explicit exclusions.
- **Identity and ownership**: PASS. Account-only when signed in; browser-only when signed out; host grants nothing.
- **Contracts and boundaries**: PASS. Dedicated history query, access availability, pagination, UI states, failures documented.
- **Layered quality**: PASS. Cursor unit, GraphQL/persistence contract, real-Mongo isolation, component, E2E, smoke planned.
- **Continuous delivery**: PASS. Existing `main` gates and code-only rollback apply.
- **Observability**: PASS. Privacy-safe history read signals exclude choices, identity secrets, codes, cursor.
- **Operational simplicity**: PASS. Existing ballot snapshots and modules reused; indexes additive.

Post-design: PASS. No destructive migration, new dependency, host privilege, or public ballot exposure.

## Project Structure

```text
specs/016-previous-vote-history/{plan,research,data-model,quickstart,tasks}.md
specs/016-previous-vote-history/contracts/{schema-extension,ui-contract}.*
votiy-api/src/{domain,repositories,services,api/graphql}/
votiy-api/tests/{unit,contract,integration}/
votiy-web/src/features/voting/{VotingAccessButton,VotingCodeModal,VotingHistoryPage,SubmittedBallotReview,voting.graphql}.jsx
votiy-web/tests/component/
tests/{e2e,smoke}/
```

**Structure Decision**: Extend Feature 014-015 voting boundary. Dedicated history route/query stays independent from open-ballot access.

## Design Sequence

1. Add opaque `(submittedAt,_id)` cursor and identity-specific repository pages/indexes.
2. Add private history service/query that allows closed events and projects legacy/current snapshots.
3. Add `hasBallotHistory` to access decision for current identity only.
4. Add modal history action and dedicated semantic read-only history page with Load more.
5. Preserve fresh-code enforcement for another vote.
6. Validate privacy, stable pagination, closure, accessibility, E2E, smoke, coverage.

## Deployment and Rollback

- Add indexes under new names; preserve current indexes until later evidence supports removal.
- Roll back application code only; additive indexes may remain.
- Preserve ballots, codes, grants, idempotency, audits, encryption key.
- Alert on foreign-history leakage, elevated history errors, or p95 above two seconds.

## Complexity Tracking

No violations.
