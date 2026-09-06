# Research: Event Short Links

## Identity

**Decision**: Store display `shortId` and lowercase `shortIdNormalized`; unique index canonical field.
**Rationale**: Preserves generated default identifier while guaranteeing case-insensitive custom uniqueness.
**Alternatives considered**: Case-insensitive collation complicates every lookup. Replacing `publicId` would break canonical links.

## Routing

**Decision**: Explicit product routes precede final `/:shortId` route; resolver returns canonical public ID and client replaces location.
**Rationale**: Reserved paths stay authoritative; canonical page remains single event implementation.
**Alternatives considered**: Duplicate event rendering at root creates nested-route inconsistencies.

## Rename lifecycle

**Decision**: One alias stored on event. Atomic replacement releases old value immediately.
**Rationale**: Matches Q1 A without historical alias storage.
**Alternatives considered**: Alias collection adds lifecycle complexity not requested.

## Migration

**Decision**: Add optional validator fields and partial unique index, then idempotently backfill existing events from `publicId`.
**Rationale**: Safe production startup with existing documents and restartability.
**Alternatives considered**: Required-field validator plus unique index before backfill can block deployment.
