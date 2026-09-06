# Contract: Voting-Code Canonicalization

## Inputs

Existing `accessCode` fields on voting access requests and ballot submissions remain nullable strings with unchanged length limits.

Before business processing:

```text
canonicalCode = trim(input).toLowerCase()
```

Blank canonical values resolve according to existing missing-code validation. No GraphQL shape changes.

## Identity

For one event and code:

```text
digest("abc123") == digest("ABC123") == digest("AbC123")
```

Different event identifiers continue producing different digests.

## UI field

- Value is shown in lowercase as user types or pastes.
- `autoCapitalize="none"`
- `autoCorrect="off"`
- `spellCheck={false}`
- Existing one-time-code autocomplete remains.

## Security and errors

- Raw codes remain redacted from logs.
- Invalid, missing, and consumed code messages remain indistinguishable under existing behavior.
- Case variants cannot create separate claims or ballots.
