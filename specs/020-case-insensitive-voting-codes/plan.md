# Implementation Plan: Case-Insensitive Voting Codes

**Branch**: `020-case-insensitive-voting-codes` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

## Summary

Canonicalize voting codes with trim plus lowercase at API validation and cryptographic identity boundaries. Existing generator already uses lowercase alphabet, so stored digests remain compatible and no data migration is needed. Normalize UI input during entry and add mobile keyboard hints disabling capitalization, correction, and spell checking. Protect behavior with domain, service, integration, and component tests.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js 24, React 19

**Primary Dependencies**: Zod 4, Node crypto, React 19, GraphQL 16

**Storage**: Existing MongoDB `votingAccessCodes`, `voterAccess`, and `ballotSubmissions`

**Testing**: Vitest unit/contract/integration/component; Playwright E2E coverage through existing voting flow

**Target Platform**: Render Linux API; current mobile and desktop browsers

**Project Type**: API plus web client

**Performance Goals**: Code normalization adds no user-visible delay; access response remains within existing voting budget

**Constraints**: Preserve encrypted inventory, keyed digests, one-code-per-ballot atomicity, existing lowercase codes, errors, and public contracts

**Scale/Scope**: Six-character lowercase alphanumeric codes; access request and ballot submission entry points; one shared code modal

## Constitution Check

*GATE: Passed before research and after design.*

- **User value and scope**: Voters avoid capitalization failures; code format, length, lifecycle, and access rules stay unchanged.
- **Identity and ownership**: Server remains authoritative; normalization exposes no code inventory or ballot data.
- **Contracts and boundaries**: Shared domain canonicalizer defines identity; API validation applies it at inputs; UI only improves entry ergonomics.
- **Layered quality**: Domain decision paths, GraphQL input normalization, real Mongo claim/reuse behavior, UI attributes, and critical flow receive coverage.
- **Continuous delivery**: Existing `main` gates remain; full API/web tests and production build validate change.
- **Observability**: Existing redaction remains; no raw code logging added. Current audit events preserve identity and outcomes.
- **Operational simplicity**: No schema, index, dependency, service, environment, or migration change.

## Project Structure

```text
specs/020-case-insensitive-voting-codes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/voting-code-canonicalization.md
└── tasks.md

votiy-api/src/
├── domain/voting-access-code.js
└── domain/validation.js

votiy-api/tests/
├── unit/voting-access-code.test.js
├── unit/voting-access-decision.test.js
└── integration/voting-code-claim.test.js

votiy-web/src/features/voting/VotingCodeModal.jsx
votiy-web/tests/component/voting-access.test.jsx
```

**Structure Decision**: Extend existing code domain helper and shared modal. Apply canonicalization redundantly at validated input and digest identity boundary for defense in depth without changing external contract.

## Complexity Tracking

No constitution violations.
