# Implementation Plan: Export Voting Codes

**Branch**: `021-export-voting-codes` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

## Summary

Extend host-only voting-code query with event-wide status totals and deterministic used-first ordering. Add host-only export query returning complete inventory, then create formula-safe UTF-8 CSV in browser and download it. Replace list markup with responsive accessible table.

## Technical Context

**Language/Version**: JavaScript ES modules on Node.js 24 and current browsers
**Primary Dependencies**: React 19, GraphQL 16, MongoDB driver 7, Zod 4
**Storage**: Existing MongoDB `votingAccessCodes` collection; no migration
**Testing**: Vitest unit, contract, integration, React Testing Library component tests
**Target Platform**: Render Linux API and current desktop/mobile browsers
**Project Type**: Web application with GraphQL API
**Performance Goals**: Summary feels immediate; 100,000-row export begins within 10 seconds under normal conditions
**Constraints**: Host-only data, no new dependency/service, no plaintext logging, formula-safe CSV, 100,000-code limit
**Scale/Scope**: One settings component, repository/service contract extension, one export query

## Constitution Check

- **User value and scope**: Host, inventory task, measurable outcome, exclusions defined.
- **Identity and ownership**: Existing server authentication and event ownership guard both inventory paths.
- **Contracts and boundaries**: API owns authorization/decryption; browser owns presentation and attachment.
- **Layered quality**: Unit, contract, real MongoDB integration, component, critical-flow validation planned.
- **Continuous delivery**: Existing `main` pipeline, gates, smoke tests, rollback unchanged.
- **Observability**: Existing correlated GraphQL logging covers failures without plaintext code logging.
- **Operational simplicity**: No new service, runtime dependency, secret, or migration.

**Gate result**: PASS before research and after design.

## Project Structure

```text
specs/021-export-voting-codes/{plan.md,research.md,data-model.md,quickstart.md,contracts/,tasks.md}
votiy-api/src/{repositories,services,api/graphql}/
votiy-api/tests/{unit,contract,integration}/
votiy-web/src/features/voting/
votiy-web/src/App.css
votiy-web/tests/component/
```

**Structure Decision**: Extend existing layers and shared settings component. Browser creates attachment; API remains authoritative for complete host-authorized data.

## Complexity Tracking

No violations.
