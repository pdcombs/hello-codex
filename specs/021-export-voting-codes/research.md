# Research: Export Voting Codes

## Complete export boundary

**Decision**: Add host-only complete-inventory GraphQL query.
**Rationale**: Guarantees full export and preserves existing authorization/decryption boundary.
**Alternatives considered**: Current-page export truncates. Client pagination creates excessive requests. Streaming HTTP duplicates session plumbing.

## Summary and ordering

**Decision**: Repository provides event-wide counts and deterministic used-first rows.
**Rationale**: Counts remain accurate across pagination and UI order matches export.
**Alternatives considered**: Client-only sorting is incomplete. Persisted sort rank requires migration.

## CSV safety

**Decision**: UTF-8 CSV with BOM, CRLF, quote escaping, and apostrophe prefix for formula-leading values.
**Rationale**: Excel compatibility without formula injection.
**Alternatives considered**: Native workbook adds dependency. Raw joining corrupts fields.

## Download

**Decision**: Temporary object URL and download anchor with sanitized event filename.
**Rationale**: Standard browser download without retained artifact.
**Alternatives considered**: Data URLs increase memory. Server attachment needs separate route.
