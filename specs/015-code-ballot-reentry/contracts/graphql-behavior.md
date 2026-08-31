# GraphQL Behavioral Contract

## Request voting access

For an open code-protected event:

| Identity state | Supplied code | Decision | Effect |
|---|---|---|---|
| No grant | none | `CODE_REQUIRED` | Prompt for code |
| Grant code has no ballot | none | `ALLOWED` | Resume pending ballot |
| Grant code has ballot | none | `CODE_REQUIRED` | Prompt for another code |
| Grant code has ballot | different unused code | `ALLOWED` | Claim and rotate grant |
| Any | invalid, consumed, wrong-event code | `CODE_REQUIRED` | Keep retry available; do not rotate |

`CODE_REQUIRED` retains `codeRequired=true` and `mayRetryCode=true`.

## Event ballot view

- Same account/browser may retrieve latest ballot.
- Open code event with completed ballot returns `mayCastAnother=true`.
- Review does not treat consumed code as submission permission.

## Submit ballot

- Requires an active grant whose exact code does not already identify a ballot.
- Accepted ballot stores that code; claimed code gains ballot identity.
- Different attempt with same code returns code-specific error and stores nothing.
- Same idempotency key/payload returns original success first.
- Existing unions and private ballot shape remain compatible.

## Privacy

Responses/logs/audits never expose raw codes, browser markers, contacts, or choices.
