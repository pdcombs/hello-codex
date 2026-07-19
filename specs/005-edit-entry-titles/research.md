# Research: Edit Entry Titles

## Decision 1: One additive batch mutation

**Decision**: Add one category batch-update operation containing desired category title and full active-entry title snapshot.

**Rationale**: Existing rename and per-entry operations cannot guarantee one-save, all-or-nothing behavior. One intent gives stable validation, field errors, idempotency, and hydration.

**Alternatives considered**:

- Call category rename plus one mutation per entry: rejected because partial success is possible and three edits require four writes.
- Extend legacy rename input incompatibly: rejected because old clients/contracts must remain valid.
- Add entry-title-only mutation and keep category rename separate: rejected because mixed category + entry edits would not be atomic.

## Decision 2: Full active-entry snapshot for optimistic concurrency

**Decision**: Submit every active entry ID/title/expected update timestamp for edited category plus expected category timestamp.

**Rationale**: Detects concurrent add, archive, move, or title edit without introducing shared revision fields or migrating all entry-writing flows.

**Alternatives considered**:

- Validate only changed entries: rejected because concurrent category membership changes could yield a misleading completed edit.
- Add category revision counter updated by every entry operation: rejected because it requires migration and changes across existing creation/archive flows.
- Last-write-wins: rejected because host could overwrite newer changes silently.

## Decision 3: MongoDB transaction across category, entries, and idempotency

**Decision**: Revalidate and update embedded event category, standalone entries, and idempotency record inside existing replica-set transaction boundary.

**Rationale**: Required atomic behavior spans `events` and `eventEntries`; current project already supports transactions with production-equivalent local MongoDB.

**Alternatives considered**:

- Sequential conditional writes with compensation: rejected because rollback and retry become complex and observable partial states remain possible.
- Embed entry titles into event document: rejected because standalone entries are authoritative and migration would duplicate state.

## Decision 4: Changed-only persistence and audit

**Decision**: Full snapshot validates concurrency, but repository updates and audits only effective title changes.

**Rationale**: Preserves meaningful `updatedAt`, avoids false history, reduces writes, and meets no-op requirement.

**Alternatives considered**:

- Rewrite every entry: rejected because unchanged entries would appear modified.
- Store old/new title text in audit metadata: rejected by privacy-minimization requirement; database record already holds current domain value.

## Decision 5: Existing deletion remains separate

**Decision**: Keep current entry archive action independent from batch title Save.

**Rationale**: User requested title editing, not deletion redesign. Existing archive flow is already audited and tested. Concurrent removal causes snapshot conflict rather than partial title update.

**Alternatives considered**:

- Stage removals in batch: rejected as unnecessary scope expansion with larger contract and recovery semantics.

## Decision 6: Controlled form state and indexed field errors

**Decision**: Keep category and entry title values in form state keyed by stable IDs; map server paths like `entryTitles.2.title` back to exact field.

**Rationale**: Preserves multiple edits on failures, supports one request, and provides accessible field-specific correction.

**Alternatives considered**:

- Read uncontrolled inputs only on submit: rejected because props refresh/removal can reset or desynchronize staged values.
- One local save per field: rejected because it violates one-save requirement.

## Decision 7: No migration, package, or environment change

**Decision**: Reuse existing fields, indexes, GraphQL stack, transaction helper, and deployment contract.

**Rationale**: Entry documents already contain title and update timestamp; embedded categories already contain update timestamp. Feature needs behavior and contract changes only.

**Alternatives considered**:

- Add revision/history collection: rejected because user-facing revision history is out of scope.
