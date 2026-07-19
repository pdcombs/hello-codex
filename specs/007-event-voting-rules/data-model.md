# Data Model: Event Voting Rules

## Event Voting Rules (embedded in `events`)

One required object per schema-version-3 event.

| Field | Type | Rules |
|-------|------|-------|
| `status` | enum | `draft`, `configured`; draft cannot accept ballots |
| `version` | integer | Starts 1; increments each effective update |
| `opensAt` | date/null | Null only in draft; inclusive |
| `closesAt` | date/null | Null only in draft; exclusive; later than opening |
| `accessPolicy` | enum | `unrestricted`, `account`, `code` |
| `unrestrictedRepeatPolicy` | enum/null | `unlimited`, `browser_limited`; required only unrestricted |
| `maxBallotsPerAccount` | integer/null | 1–100 for account or account-required code |
| `codeRequiresCompletedAccount` | boolean/null | Required only code policy |
| `defaultCategoryMethod` | enum | `single`, `multiple`, `ranking` |
| `defaultMultipleMin` | integer/null | Required for multiple; 0 or greater |
| `defaultMultipleMax` | integer/null | Required for multiple; at least 1 and not below min |
| `categoryOverrides` | array | At most one override per active category ID |
| `updatedByAccountId` | ObjectId | Host that saved revision |
| `createdAt`, `updatedAt` | date | UTC instants |

### Category override

`categoryId`, `method`, `multipleMin`, `multipleMax`. Override category must belong to same event and be active at save time. Non-multiple methods require null bounds. New categories inherit defaults. Archived categories are ignored by active projections and ballot validation.

### Effective-rule validation

- `single`: exactly one active entry ID.
- `multiple`: unique active entry IDs; count between effective min/max. At ballot time maximum cannot exceed active entry count.
- `ranking`: every active entry ID exactly once; order defines ranks 1..N.
- Empty categories cannot receive category ballot.

## Voting Access Code (`votingAccessCodes`)

| Field | Type | Rules |
|-------|------|-------|
| `_id`, `eventId` | ObjectId | Event-owned immutable identity |
| `codeDigest` | string | Keyed digest; unique per event; claim lookup only |
| `codeCiphertext`, `codeIv`, `codeAuthTag`, `keyVersion` | string/integer | AES-256-GCM protected host display value |
| `status` | enum | `unused`, `used`, `revoked` |
| `batchId` | ObjectId | Groups one host request |
| `claimedByAccountId` | ObjectId/null | Completed or provisional account |
| `usedByBallotId` | ObjectId/null | Successful consuming ballot |
| `createdByAccountId` | ObjectId | Host |
| `createdAt`, `usedAt`, `revokedAt`, `updatedAt` | date/null | Lifecycle |
| `schemaVersion` | integer | 1 |

### Invariants and indexes

- Unique `(eventId, codeDigest)`.
- Index `(eventId, status, createdAt, _id)` for inventory.
- Unused requires null claimant/ballot/used time.
- Used requires claimant, ballot, and used time.
- No used-to-unused transition; no hard delete.
- Conditional claim matches `status:unused` inside ballot transaction.

## Event Voter Access (`eventVoterAccess`)

| Field | Type | Rules |
|-------|------|-------|
| `_id`, `eventId`, `accountId` | ObjectId | Unique event/account relationship |
| `source` | enum | `account_policy`, `code` |
| `codeId` | ObjectId/null | Required for code-granted relationship |
| `status` | enum | `active`, `revoked` |
| `grantedAt`, `revokedAt`, `createdAt`, `updatedAt` | date/null | Lifecycle |
| `schemaVersion` | integer | 1 |

Unique `(eventId, accountId)`. Relationship never implies event participant or entry ownership. Code relationship persists after first successful claim.

## Ballot Submission (`ballotSubmissions`)

Immutable accepted ballot envelope.

| Field | Type | Rules |
|-------|------|-------|
| `_id`, `eventId` | ObjectId | Event ballot identity |
| `accountId` | ObjectId/null | Required for account/code flows; null only unrestricted anonymous |
| `accessCodeId` | ObjectId/null | Consuming code when applicable |
| `browserMarkerDigest` | string/null | Browser-limited unrestricted policy only |
| `rulesVersion` | integer | Event rule revision evaluated at submission |
| `accessPolicy` | enum | Submission-time policy snapshot |
| `categoryBallots` | array | Validated category choices/ranks |
| `submittedAt`, `createdAt` | date | Same accepted instant |
| `schemaVersion` | integer | 1 |

### Category ballot

`categoryId`, `method`, and ordered `entryIds`. For selection methods order has no meaning; ranking order is authoritative. Store immutable IDs, never entry/category titles.

### Indexes

- `(eventId, submittedAt, _id)` for audit/processing.
- `(eventId, accountId, submittedAt)` for account limit count.
- Unique partial `(eventId, browserMarkerDigest)` for browser-limited mode.
- Unique partial `accessCodeId` ensures one consuming ballot/code.

## Existing Account changes

No new account lifecycle. Code-only email flow uses existing normalized-email lookup. Missing account becomes existing `provisional`, `unverified` account with email, optional phone, no password, and referral semantics from current domain. Account completion later preserves event voter access.

## Audit events

- `event.voting_rules_updated`: event subject; rules version and policy/method enums only.
- `voting.codes_generated`: event subject; batch ID/count only.
- `voting.code_consumed`: code subject; code/account/ballot IDs only, never raw code.
- `event.voter_access_granted`: access subject; event/account/source IDs.
- `voting.ballot_submitted`: ballot subject; event/rules version/category count only.
- `event.voting_change_denied` / `voting.ballot_denied`: identifier and safe error code only.

## State transitions

```text
rules: draft -> configured -> configured(version + 1)
code: unused -> used
                \-> revoked
access: active -> revoked
ballot: created (immutable)
```

## Migration 005

1. Find events missing `votingRules` or lifecycle fields.
2. Add closed draft defaults without changing identity, categories, timestamps, or existing behavior.
3. Advance event schema to version 3.
4. Reruns produce zero effective changes.
5. Install strict version-3 event validator only after migration completes.
6. Readiness fails when migration/index/validator setup fails.
