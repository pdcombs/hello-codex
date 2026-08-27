# Data Model: Secure Password Reset

## PasswordResetRequest

| Field | Type | Rules |
|---|---|---|
| `_id` | identifier | Generated once |
| `accountId` | account identifier | Required eligible account |
| `tokenDigest` | string | Required, unique, peppered, never returned |
| `deliveryPath` | enum | `email` or `bypass` |
| `status` | enum | `active`, `consumed`, `superseded`, `delivery_failed` |
| `expiresAt` | datetime | Exactly `createdAt + 15 minutes` |
| `consumedAt` | datetime/null | Set with successful password update |
| `supersededAt` | datetime/null | Set by newer request |
| `deliveryFailedAt` | datetime/null | Set when send fails |
| `createdAt` | datetime | Generation time |
| `updatedAt` | datetime | Last lifecycle change |
| `schemaVersion` | integer | `1` |

### Indexes

- Unique `tokenDigest`.
- `{ accountId, status, createdAt }`.
- No expiry TTL; history retained.

### Invariants and states

- Raw token never stored.
- Active has all final timestamps null; one final timestamp matches terminal status.
- Authorization also requires `expiresAt > now`.
- New issuance supersedes all active account records.
- `active` changes once to `consumed`, `superseded`, or `delivery_failed`; expiration is derived without document mutation.

## Account changes

No new field. Successful reset atomically replaces `passwordHash`, increments `credentialVersion`, sets `updatedAt`, and requires completed verified eligible account. Email/profile/verification unchanged.

## Session changes

Existing sessions retained and marked revoked. Credential-version mismatch remains secondary defense.

## ResetMessage

Transient only: account email, canonical URL, 15-minute guidance, unsolicited-request warning. No password or unrelated data.

## Ownership and disclosure

- Reset records are security audit data, not end-user list/edit/delete data.
- Valid token may disclose linked normalized email only to token holder.
- Invalid token discloses no account data.
- Bypass token returned only for exact configured-domain account in request response.
