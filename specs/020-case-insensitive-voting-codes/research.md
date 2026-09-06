# Research: Case-Insensitive Voting Codes

## Existing generated-code format

- **Decision**: Keep current generator unchanged.
- **Rationale**: It already uses `abcdefghijklmnopqrstuvwxyz0123456789` and produces six lowercase characters.
- **Alternatives considered**: New alphabet or regeneration rejected because format already meets requirement and would add compatibility risk.

## Canonical identity

- **Decision**: Define shared canonicalization as Unicode-insensitive application trim followed by lowercase; use it before keyed digest and in both voting-code API input schemas.
- **Rationale**: Digest is authoritative stored identity. Normalizing there protects callers outside GraphQL, while schema normalization gives services consistent input and idempotency behavior.
- **Alternatives considered**: UI-only normalization fails direct API callers. Service-call-site normalization can drift between access and ballot flows.

## Existing code compatibility

- **Decision**: No migration.
- **Rationale**: All generated production codes already use lowercase before digest and encryption. Lowercasing same value produces identical digest and preserves stored records, status, and ballot associations.
- **Alternatives considered**: Re-digesting stored codes adds risky writes and requires decryption despite no data identity change.

## UI entry behavior

- **Decision**: Lowercase typed/pasted field value and set no-capitalization, no-correction, and no-spellcheck hints.
- **Rationale**: Server guarantees correctness; field behavior visibly reinforces expected format and reduces mobile friction.
- **Alternatives considered**: Attributes only are advisory and cannot guarantee casing. Submit-only normalization delays feedback.
