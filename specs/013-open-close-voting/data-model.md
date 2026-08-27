# Data Model: Open / Close Voting

## Event Voting State

Embedded under event as `votingState`.

| Field | Type | Rule |
|-------|------|------|
| `status` | enum | `closed` or `open`; authoritative |
| `version` | integer | Starts at 1; increments every successful transition |
| `openedAt` | date/null | Last successful opening timestamp |
| `closedAt` | date/null | Last successful closing timestamp |
| `updatedAt` | date | Transition timestamp |
| `updatedByAccountId` | account ID | Event host making transition |

Transitions: `closed` to `open`; `open` to `closed`. Same-state and stale-version requests conflict.

Closing and reopening never modify ballots, rules, dates, codes, markers, limits, or audits.

Opening invariants:

- Event lifecycle active.
- Voting rules configured.
- At least one active entry exists.
- Code inventory is not invariant; zero unused codes yields host warning.

## Voting Rules

Existing entity unchanged. `opensAt` and `closesAt` remain dates for display. Neither computes status nor gates access/submission during this feature.

## Event Voter Access Grant

Evolves existing `eventVoterAccess` records.

| Field | Type | Rule |
|-------|------|------|
| `eventId` | event ID | Required |
| `accountId` | account ID/null | Present for account-bound grant |
| `browserMarkerDigest` | string/null | Present for anonymous/browser-bound grant |
| `source` | enum | `account_policy` or `code` |
| `codeId` | voting code ID/null | Required for code grant |
| `status` | enum | `active` or `revoked` |
| `rulesVersion` | integer | Rules evaluated during grant |
| `grantedAt` | date | Successful access time |
| `createdAt`, `updatedAt` | date | Audit timestamps |

Exactly one of account ID or browser marker digest identifies anonymous code grant. Partial unique indexes protect event/account and event/browser pairs.

## Voting Access Code

Existing lifecycle remains `unused`, `used`, `revoked`.

- `unused` to `used` only inside access-grant transaction.
- `claimedByAccountId` may remain null for browser-bound claim.
- `usedByBallotId` remains null until future ballot association.
- `usedAt` and `updatedAt` record claim instant.

## Voting Access Decision

Transient response, never sufficient authority for ballot submission.

| Field | Type | Meaning |
|-------|------|---------|
| `decision` | enum | `ALLOWED`, `CLOSED`, `SIGN_IN_REQUIRED`, `ACCOUNT_COMPLETION_REQUIRED`, `CODE_REQUIRED`, `REPEAT_LIMIT_REACHED`, `EVENT_UNAVAILABLE` |
| `allowed` | boolean | True only for `ALLOWED` |
| `requirements` | object | Stable booleans and safe action hints |
| `rulesVersion` | integer/null | Current evaluated rules version |
| `votingStateVersion` | integer/null | Current evaluated manual state version |

## Audit Events

Names: `voting.state_opened`, `voting.state_closed`, `voting.state_change_denied`, `voting.access_allowed`, `voting.access_denied`, `voting.code_claimed`.

Allowed metadata: `correlationId`, `reasonCode`, `rulesVersion`, `votingStateVersion`, `accessPolicy`, `hasUnusedCodes`, `durationMs`. Raw code, code digest, browser marker/digest, email, phone, and message bodies prohibited.
