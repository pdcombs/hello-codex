# Research: Secure Password Reset

## Token storage and retention

- **Decision**: Generate random opaque token, send/return raw value once, store only peppered digest. Retain record after expiry/consumption; no TTL index.
- **Rationale**: Database compromise cannot yield usable links. Audit history survives expiry.
- **Alternatives considered**: Raw token (credential exposure); TTL deletion (audit loss); encryption (unneeded recovery risk).

## Expiration and single use

- **Decision**: Valid only when active, final timestamps null, and `expiresAt > now`. Atomic claim inside transaction permits one winner.
- **Rationale**: Exact boundary and concurrent tabs cannot produce two changes.
- **Alternatives considered**: Separate validate/update (race); delete after use (audit loss); accept at exact expiry (exceeds limit).

## Request supersession

- **Decision**: New accepted request supersedes all older active requests before new record; retain every record.
- **Rationale**: One authoritative link; older stolen links stop working.
- **Alternatives considered**: Multiple valid links (larger attack surface); deletion (audit loss).

## Account update and sessions

- **Decision**: Transaction consumes request, replaces Argon2id hash, increments `credentialVersion`, revokes sessions.
- **Rationale**: Credential and authorization cannot diverge; version protects against revocation gaps.
- **Alternatives considered**: Password-only update (sessions survive); automatic sign-in (conflicts with requested redirect).

## Bypass behavior

- **Decision**: Reuse exact normalized `VERIFICATION_BYPASS_DOMAINS` matching. Matching eligible account gets unique normal reset token in same browser; no email. Empty/malformed/non-exact configuration uses email path.
- **Rationale**: Meets local/test need with expiry, audit, and single-use.
- **Alternatives considered**: Suffix match (lookalike risk); deterministic token (not unique); email plus direct token (violates request).

## Enumeration and inactive accounts

- **Decision**: Normal and unknown/ineligible requests return same neutral success and comparable work. No record/email for unknown/ineligible account. Direct continuation exists only for configured bypass domains.
- **Rationale**: Prevents normal-environment account discovery.
- **Alternatives considered**: Unknown-account error (enumeration); unknown-email records (unneeded personal data).

## Email failure

- **Decision**: Create record, attempt send, then activate success; failure marks record unusable and retains outcome.
- **Rationale**: No live unreceived credential; audit explains failure.
- **Alternatives considered**: Delete record (audit loss); leave active (orphan authorization).

## Link and UI

- **Decision**: `${APP_ORIGIN}/reset-password?token=<encoded-token>`. Inspection returns read-only email only for valid active authorization. Password fields reuse create-account rule.
- **Rationale**: Configured origin blocks host injection; shared validation prevents drift.
- **Alternatives considered**: Email in URL (privacy leak); duplicate password rules (drift).

## Observability and abuse

- **Decision**: Safe audits/logs for requested, bypassed, emailed, failed, denied, consumed, superseded. Record correlation, account ID where known, delivery path, reason, duration; never email/token/password. Track request/completion/error/email-failure/denial rates and p95 latency. Reuse existing rate-limit contract.
- **Rationale**: Security-sensitive flow must be diagnosable without credential leakage.
- **Alternatives considered**: Token/email logging (sensitive); no denial telemetry (hides abuse).
