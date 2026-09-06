# Implementation Plan: Event Short Links

**Branch**: `023-event-short-links` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

## Summary

Add event-owned `shortId` plus lowercase canonical identity, unique partial index, idempotent backfill, host-only update mutation, public alias-resolution query, settings editor, and root redirect route. Existing canonical event routes remain unchanged.

## Technical Context

**Language/Version**: JavaScript ES modules, Node.js 24, React 19
**Dependencies**: MongoDB driver 7, GraphQL 16, Zod 4, React Router 7
**Storage**: Existing events collection; additive fields/index and idempotent migration
**Testing**: Vitest unit/contract/integration/component
**Target**: Render Linux and current browsers
**Performance**: Root alias lookup through unique index; user-visible navigation under one second normally
**Constraints**: Global case-insensitive uniqueness, reserved roots, atomic ownership/update, backward-compatible canonical URLs

## Constitution Check

PASS before and after design. Server owns authorization, validation, uniqueness, resolution, and audit. Client owns presentation/redirect. Unit, contract, MongoDB integration, component, and critical-flow coverage planned. No new dependency/service/secret. Existing CI, logging, health, deployment, and rollback remain.

## Project Structure

```text
votiy-api/src/{domain,repositories,services,api/graphql,migrations}/
votiy-api/tests/{unit,contract,integration}/
votiy-web/src/{app,features/events}/
votiy-web/tests/component/
specs/023-event-short-links/
```

**Structure Decision**: Add behavior within existing event layers. Root alias resolver uses narrow public contract returning canonical `publicId` only.

## Complexity Tracking

No violations.
