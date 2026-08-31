# Contract: Voting Code Lifecycle

## Access Request

- Valid unused code returns existing `ALLOWED` decision and records pending access.
- Request does not change code status, used time, or ballot relationship.
- Invalid or used code returns retryable `CODE_REQUIRED`.

## Ballot Submission

- Existing input may use pending access or directly supplied code.
- Service revalidates code as unused inside transaction.
- Success creates one ballot and marks code used with ballot ID and timestamp.
- Concurrent loser returns `ACCESS_CODE_USED`.
- Failed transaction leaves no ballot and unused code.
- Exact idempotent replay returns original receipt.

## Inventory

- `UNUSED` means no accepted ballot relationship.
- `USED` means one accepted ballot relationship.
- GraphQL fields and enum values remain unchanged.

## Compatibility Reconciliation

- Used code with matching ballot remains used and gains backlink.
- Used code without matching ballot becomes unused.
- Repeat execution changes only inconsistent records.
