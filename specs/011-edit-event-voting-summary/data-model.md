# Data Model: Event Details and Voting Summary

## Event Schema Version 4

Feature 011 updates existing fields and derived projections without changing document version.

### Editable source fields

| Field | Type | Rules | Ownership |
|---|---|---|---|
| `title` | string | Trimmed, required, 1–120 characters | Host-owned |
| `description` | nullable string | Trimmed, null when blank, maximum 2,000 | Host-owned |
| `location` | nullable string | Trimmed, null when blank, maximum 300 | Host-owned |
| `updatedAt` | date | Replaced on successful compare-and-set | System-managed concurrency token |

`publicId`, `_id`, `ownerAccountId`, registration policy, visibility, lifecycle, categories, entries, photo,
and created time do not change through this operation.

### Derived search fields

A successful edit rebuilds the same schema-version-4 fields created by `createEventSearchProjection`:

- `searchTitleNormalized`
- `searchDescriptionNormalized`
- `searchLocationNormalized`
- `searchTitleGrams`
- `searchDescriptionGrams`
- `searchLocationGrams`
- `searchGrams`

Source and derived fields change atomically. Empty optional values project to empty normalized strings and
empty field grams. Existing search index and eligibility rules remain unchanged.

### Detail update transition

```text
active + host + matching updatedAt + valid fields
  -> source fields and search projection replaced; updatedAt advanced

active + host + stale updatedAt
  -> CONFLICT; no fields changed

archived OR non-host OR anonymous OR invalid input
  -> denied; no fields changed
```

## Event Voting Rules

Existing embedded rule fields remain the persistence model.

| Field | Type | Active behavior |
|---|---|---|
| `status` | `draft` or `configured` | Existing configuration lifecycle |
| `version` | positive integer | Optimistic concurrency and ballot reference |
| `opensAt` | nullable date | Inclusive opening instant when configured |
| `closesAt` | nullable date | Exclusive closing instant when configured |
| `accessPolicy` | `unrestricted`, `account`, `code` | Determines eligibility summary/enforcement |
| `unrestrictedRepeatPolicy` | nullable enum | Existing unrestricted repeat behavior |
| `maxBallotsPerAccount` | nullable integer | Existing account submission limit |
| `codeRequiresCompletedAccount` | nullable boolean | Existing code-mode account requirement |
| `defaultCategoryMethod` | `single`, `multiple`, `ranking` | Sole active event-wide method |
| `defaultMultipleMin` | nullable integer | Event-wide multiple minimum |
| `defaultMultipleMax` | nullable integer | Event-wide multiple maximum |
| `categoryOverrides` | rule array | Preserved dormant history; never active/projected |
| `updatedAt` | date | Rule change time |

### Method validation

- `single`: both multiple bounds are null; each category accepts exactly one active entry.
- `ranking`: both multiple bounds are null; each category requires every active entry exactly once.
- `multiple`: minimum is integer `>= 0`; maximum is integer `>= 1`; minimum `<=` maximum.
- Every active category must have at least `defaultMultipleMax` active entries before voting is reported open.
- Capability and ballot submission re-evaluate live entry counts to protect against later setup changes.

### Active rule resolution

```text
effectiveRule(categoryId) = {
  method: defaultCategoryMethod,
  minimum: defaultMultipleMin,
  maximum: defaultMultipleMax
}
```

`categoryOverrides` are not consulted. New categories require no rule record.

### Rule update transition

```text
matching host/event/rules versions + valid active fields
  -> active event-wide fields updated; version incremented;
     categoryOverrides copied unchanged

legacy request containing categoryRules
  -> request remains accepted; categoryRules ignored;
     stored categoryOverrides unchanged

stale/unauthorized/archived/invalid request
  -> denied; active and dormant fields unchanged
```

Previously accepted ballots retain their stored rules version and method snapshot/reference.

## Dormant Category Voting Rule

Historical embedded value retained for reversibility.

| Field | Type | Rules |
|---|---|---|
| `categoryId` | object ID | May reference active or archived historical category |
| `method` | enum | Historical value only |
| `multipleMin` | nullable integer | Historical value only |
| `multipleMax` | nullable integer | Historical value only |

It is not returned in active event or voting-capability projections, cannot be edited by Feature 011, and
does not affect ballot rendering or validation. Rollback may restore prior resolution without data recovery.

## Voting Information Summary

Transient view model; never persisted.

| Field | Source | Rule |
|---|---|---|
| `opensAt` | active rules | Render only with a valid closing instant |
| `closesAt` | active rules | Render only with a valid opening instant |
| `audience` | event `isOwner` | `host` only for owner; otherwise `public` |
| `accessText` | audience + access policy | Exact contract wording |
| `methodText` | audience + active default rule | Exact contract wording; multiple includes bounds |

The formatter uses the viewer's runtime locale/timezone. A private summary contains no source voting data,
so no voting information view model can be created.

## Audit Event

Successful and denied detail updates append one immutable audit event:

| Field | Rule |
|---|---|
| `name` | `event.details_updated` or `event.details_change_denied` |
| `actorAccountId` | Viewer account when known, otherwise null |
| `subjectId` | Event ID or requested event reference |
| `outcome` | `success` or `denied` |
| `correlationId` | Request correlation ID |
| `metadata.changedFields` | Names from `title`, `description`, `location`; never values |
| `metadata.reasonCode` | Safe denial/conflict code when applicable |

Logs and audits exclude title, description, location, search tokens, voting rules, codes, and ballots.

## Migration and Rollback

- No migration or validator version change.
- Existing default rules become authoritative at deployment.
- Existing category overrides remain byte-for-byte intact.
- Existing search index updates automatically when atomic projection fields change.
- Rollback restores previous UI and override resolution; no data reversal is required.
