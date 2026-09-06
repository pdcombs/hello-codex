# Quickstart: Case-Insensitive Voting Codes

## Automated validation

```bash
pnpm --dir votiy-api test:unit
pnpm --dir votiy-api test:contract
pnpm --dir votiy-api test:integration
pnpm --dir votiy-web test
pnpm --dir votiy-web lint
pnpm --dir votiy-web build
```

## Manual flow

1. Configure code-required event and generate codes.
2. Confirm displayed codes contain lowercase letters only.
3. Open event on mobile-sized browser and focus code field.
4. Confirm field requests no capitalization/correction and shows pasted uppercase code in lowercase.
5. Enter valid code using uppercase; proceed and submit ballot.
6. Attempt same code using mixed case; confirm consumed-code denial.
7. Use different unused code; confirm another voter may proceed under existing rules.

Expected: casing never changes code identity, access, or one-code-per-ballot enforcement.
