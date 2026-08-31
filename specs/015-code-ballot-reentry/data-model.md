# Data Model: Require New Code for Each Ballot

## Voting Code

- Existing event-scoped credential with protected code, unused/used status, claimant, timestamps, and optional accepted ballot identity.
- May be claimed once and attached to zero or one ballot.
- A code attached to a ballot cannot authorize another ballot.

## Current Code Access Grant

- Existing unique event/account or event/browser authorization record.
- `codeId` is the most recently claimed code.
- If that code has no ballot, the grant may authorize it.
- If that code has a ballot, the grant supports review only; another submission requires rotation to a different unused code.
- Rotation does not alter old ballots or code history.

## Code-Authorized Ballot

- Existing immutable ballot with a non-null exact code identity.
- No two ballots may share a code.
- Code and ballot identify each other after acceptance.
- Idempotent replay returns the same ballot.

## Ballot Review Identity

- Existing account or browser identity locates latest ballot.
- Does not independently authorize submission.
- Latest review advances only after another accepted ballot.

## State Transitions

```text
unused code -> claimed/no ballot -> ballot accepted/attached -> review only
review only -> different code claimed/grant rotated -> fresh ballot
same grant race -> one accepted ballot + one code-used denial
same attempt retry -> original ballot result
```

## Compatibility

- No ballot/code deletion or rewrite.
- Existing grants remain readable; their code/ballot relationship determines whether another code is required.
- Existing unique ballot/code constraint remains.
