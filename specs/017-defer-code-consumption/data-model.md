# Data Model: Defer Voting Code Consumption

## Voting Access Code

- State: `unused` or `used`
- Relationships: event, optional claimant account, optional accepted ballot
- `unused` has no ballot relationship or used time
- `used` has exactly one accepted ballot relationship
- Transition occurs only within accepted ballot transaction

## Pending Voter Access

- Identity: event plus account or browser marker
- Stores currently validated code
- Does not reserve or consume code
- Later validation may replace grant

## Ballot Submission

- Immutable accepted vote linked to event and voter identity or browser marker
- Code-policy ballot has one code; code is unique across ballots
- Created only when code can become used in same transaction

## Audit Event

- Records validation, consumption, rejection, ballot attachment, or reconciliation
- Never stores plaintext code or raw browser marker

## Legacy Reconciliation

1. Find used codes missing ballot backlink.
2. Attach matching ballot and retain used state when ballot references code.
3. Restore unused state and clear claim/use fields when no ballot references code.
4. Append audit record; preserve ballots and old audit history.
