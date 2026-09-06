# Data Model: Case-Insensitive Voting Codes

No persistence schema changes.

## Voting Code

- Raw representation: six lowercase alphanumeric characters
- Canonical value: trimmed lowercase raw value
- Stored identity: existing event-scoped keyed digest of canonical value
- Protected display value: existing encrypted canonical value
- Lifecycle: `unused` until associated ballot commits, then `used`

Identity rule: case variants for same event produce same digest. Event scope remains part of digest, so same code in different events remains distinct.

## Code Entry

- Accepted source: typed or pasted string
- Transformation: trim, then lowercase
- Blank after trim: invalid
- Maximum accepted length: unchanged

## Compatibility

Existing generated records already contain lowercase values and matching digests. Canonicalization is identity-preserving. No index, ciphertext, status, access grant, audit, or ballot record changes.
