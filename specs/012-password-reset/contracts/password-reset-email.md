# Password Reset Email Contract

## Envelope

- To: normalized account email.
- From: configured Votiy sender.
- Subject: `Reset your Votiy password`.
- One email per accepted non-bypass request.

## Content

- State password reset was requested.
- One `Reset password` link: `{APP_ORIGIN}/reset-password?token={URL-encoded unique secret}`.
- State link expires in 15 minutes.
- State: “If you did not request this password reset, do not click the link. You can safely ignore this email.”
- Plain-text and HTML meaning match.

## Safety

- No password, digest, session secret, or unrelated data.
- Host comes from configured origin, never request/user input.
- Token absent from logs, audits, provider diagnostics, errors.
- Delivery failure makes authorization unusable but retains record.
