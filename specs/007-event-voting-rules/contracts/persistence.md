# Persistence Contract: Event Voting Rules

## Atomic boundaries

### Rules update

Single conditional event write MUST match event ID, host ID, event timestamp, and rules version. It validates active category IDs and effective method bounds before incrementing version. Idempotency and audit persist in same transaction when available; stale or duplicate-title/category changes return conflict without overwrite.

### Code generation

Transaction validates host and code policy, generates exact requested count, encrypts raw codes, computes digests, inserts unique records, audit, and idempotency result. Collision retries are bounded. Replay returns same generated code records; changed payload conflicts.

### Ballot submission

One transaction MUST:

1. Re-read event, current rules, active categories, and active entries.
2. Reject draft/outside-window/stale-version/malformed category ballots.
3. Resolve access policy and account/browser/code eligibility.
4. Enforce account count or browser-marker uniqueness.
5. For code-only email, find/create provisional account by normalized email.
6. Conditionally claim unused code when no prior event access applies.
7. Upsert event voter access when required.
8. Insert immutable ballot with current rules version.
9. Link claimed code to ballot.
10. Append identifier-only audits and idempotency record.

Any failure rolls back every write. Conditional match/count mismatch maps to safe conflict/denial.

## Security contract

- Code lookup uses keyed digest, not ciphertext scan.
- Host inventory decrypts only after ownership authorization.
- Public/voter responses never expose inventory or another claimant.
- Raw codes, crypto material, contacts, and ballot contents never enter logs/audits.
- Encryption key comes from environment and supports key version for rotation.
- Browser marker is HttpOnly, Secure in production, SameSite=Lax, opaque, and never accepted as strong identity.

## Compatibility

- Existing GraphQL fields/mutations remain valid.
- Event `voting` is additive; legacy client operations need not select it.
- Migration accepts schema versions 1/2 during transition, writes version 3, then enforces strict validator.
- Existing account/event/category/entry IDs and timestamps remain unchanged by migration.
- New collections have no TTL and no hard-delete repository methods.

## Failure codes

- `AUTHENTICATION_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`
- `VOTING_NOT_CONFIGURED`, `VOTING_NOT_OPEN`, `VOTING_CLOSED`
- `ACCOUNT_REQUIREMENTS_NOT_MET`, `BALLOT_LIMIT_REACHED`
- `INVALID_ACCESS_CODE`, `ACCESS_CODE_USED`
- `INVALID_BALLOT`, `RULES_CHANGED`, `CONFLICT`, `SERVICE_UNAVAILABLE`

Messages remain safe and do not reveal code existence, claimant, account lookup, or private inventory.
