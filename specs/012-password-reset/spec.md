# Feature Specification: Secure Password Reset

**Feature Branch**: `main`

**Created**: 2026-08-26

**Status**: Ready for planning

**Input**: Add forgot-password recovery with configured email-domain bypass, emailed unique reset links for normal accounts, 15-minute expiry, retained audit history, password confirmation, existing password rules, and return to sign-in after success.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request Password Reset (Priority: P1)

A signed-out user selects “Forgot password?” on sign-in and requests recovery using email address on their account.

**Why this priority**: Users locked out by a forgotten password need a safe self-service recovery path.

**Independent Test**: Request recovery for an existing normal account and verify a single-use, 15-minute link is sent only to its saved email without revealing account existence publicly.

**Acceptance Scenarios**:

1. **Given** sign-in page, **When** user selects “Forgot password?”, **Then** a focused recovery form asks for account email.
2. **Given** an existing account outside configured bypass domains, **When** recovery is requested, **Then** one email is sent to account address with a unique reset link rooted at configured application URL.
3. **Given** an unknown or differently cased email, **When** recovery is requested, **Then** public response does not disclose whether an account exists.
4. **Given** a reset request, **When** it is accepted, **Then** its audit record includes account association, creation time, expiration exactly 15 minutes later, request outcome, and no reusable plaintext reset secret.
5. **Given** multiple requests for one account, **When** a newer request is accepted, **Then** older unused links cannot reset password while their audit records remain retained.

---

### User Story 2 - Reset Through Email Link (Priority: P1)

An account holder opens emailed link, confirms account email shown on reset page, and enters a valid new password twice.

**Why this priority**: Request flow has no value unless account holder can securely finish recovery.

**Independent Test**: Open one valid link, submit matching valid passwords, verify one successful password change, then sign in with new password while reuse and old password fail.

**Acceptance Scenarios**:

1. **Given** a valid unused link less than 15 minutes old, **When** it opens, **Then** reset page shows email belonging to linked account without allowing it to be changed.
2. **Given** matching passwords satisfying account-creation password rules, **When** user saves, **Then** password changes once, link becomes consumed, and user is redirected to sign-in with a success message.
3. **Given** passwords do not match or fail current account-creation rules, **When** user submits, **Then** password remains unchanged and clear inline errors explain correction.
4. **Given** an expired, malformed, superseded, already-used, or account-orphaned link, **When** it opens or submits, **Then** password is unchanged and user receives a safe option to request another reset.
5. **Given** password reset succeeds, **When** user attempts authentication, **Then** old password fails and new password succeeds.

---

### User Story 3 - Use Configured Domain Bypass (Priority: P2)

In an environment configured with verification-bypass domains, a user whose account email matches one of those domains can reach password reset without receiving email.

**Why this priority**: Local and controlled test environments need recovery without working outbound email.

**Independent Test**: Configure one bypass domain, request reset for matching and non-matching accounts, and verify only matching account continues in same browser without email while all reset security rules still apply.

**Acceptance Scenarios**:

1. **Given** an existing account whose normalized email domain exactly matches a configured bypass domain, **When** reset is requested, **Then** no email is sent and same browser can continue to reset page using a unique 15-minute reset authorization.
2. **Given** an account whose domain is a suffix, prefix, case variant, or lookalike rather than an exact normalized match, **When** reset is requested, **Then** normal email delivery is used.
3. **Given** bypass configuration is empty, invalid, or unavailable, **When** reset is requested, **Then** system fails closed to normal email recovery and never grants direct reset access.
4. **Given** bypass recovery reaches reset page, **When** user completes it, **Then** password validation, single use, audit retention, redirect, and session security match emailed recovery.

### Edge Cases

- Email includes leading/trailing whitespace, mixed case, internationalized characters, or invalid syntax.
- Account exists but is unverified, archived, disabled, or otherwise unable to sign in.
- Configured application root has or lacks trailing slash; generated link remains one canonical URL with no open redirect.
- Two reset requests occur concurrently for same account.
- Link is opened exactly at expiration boundary or password submission crosses that boundary.
- Link is opened in multiple tabs and both submit concurrently; at most one succeeds.
- Password changes through another path after link generation.
- Email delivery fails after reset record is created.
- Email, logs, browser history, analytics, or errors accidentally expose reset secret or unnecessary personal data.
- Bypass-domain comparison encounters uppercase, whitespace, empty entries, subdomains, or comma-separated configuration.

## Scope Boundaries *(mandatory)*

### In Scope

- “Forgot password?” entry point from sign-in.
- Email collection and privacy-safe request response.
- Unique, single-use links using configured application root and password-reset route.
- Fifteen-minute reset expiration.
- Retained audit history for unused, expired, superseded, consumed, failed-delivery, and successful requests.
- Email-domain bypass based on exact normalized matches from `VERIFICATION_BYPASS_DOMAINS`.
- Reset page showing linked account email and requiring matching new-password values.
- Existing account-creation password requirements.
- Redirect to sign-in after successful reset.
- Security-warning language in reset email.

### Out of Scope

- Recovery by phone, SMS, support agent, security question, passkey, or social sign-in provider.
- Changing account email, display name, verification status, or profile during reset.
- User-configurable reset expiry.
- Restoring deleted accounts or bypassing account lifecycle restrictions.
- Reminder emails for unused links.
- Administrative browsing or manual deletion of reset audit history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sign-in page MUST provide visible, keyboard-accessible “Forgot password?” action.
- **FR-002**: Recovery request MUST accept one email, normalize it using existing account identity rules, and reject malformed input with inline error.
- **FR-003**: Public request result MUST use same neutral wording and comparable observable behavior for known and unknown non-bypass emails to prevent account discovery.
- **FR-004**: For an eligible existing account outside configured bypass domains, system MUST send reset instructions only to account email on file.
- **FR-005**: Reset email MUST include one unique link composed from configured application root, canonical password-reset route, and an unguessable unique secret.
- **FR-006**: Reset email MUST state recipient should not click link if they did not request password reset and may safely ignore message.
- **FR-007**: Every accepted reset request MUST create a retained audit record containing account association, generated time, expiration time, delivery path, status, and later consumption or invalidation outcome.
- **FR-008**: Each reset authorization MUST expire exactly 15 minutes after generation and MUST be unusable at or after expiration time.
- **FR-009**: Stored reset verification data MUST not expose a reusable plaintext link secret if database or logs are inspected.
- **FR-010**: Reset authorizations MUST be single-use, and concurrent submissions MUST allow at most one password change.
- **FR-011**: Accepting a newer reset request MUST invalidate older unused reset authorization for same account without deleting its audit record.
- **FR-012**: A valid reset page MUST show linked account email as read-only information and MUST not allow account selection or email replacement.
- **FR-013**: Reset form MUST require new password and confirmation fields.
- **FR-014**: Both password values MUST match and satisfy same requirements active in account-creation flow at submission time.
- **FR-015**: Validation failure MUST leave password and reset authorization unchanged so user can correct input while authorization remains valid.
- **FR-016**: Successful reset MUST atomically change password and mark reset authorization consumed before redirecting user to sign-in.
- **FR-017**: Successful reset MUST invalidate existing authenticated sessions for account and require sign-in with new password.
- **FR-018**: Expired, malformed, superseded, consumed, or invalid links MUST not disclose extra account data and MUST offer a path to request another reset.
- **FR-019**: Accounts in a sign-in-ineligible lifecycle state MUST not receive usable reset authorization; public request response MUST remain neutral.
- **FR-020**: Exact normalized domain matches in `VERIFICATION_BYPASS_DOMAINS` MUST use direct same-browser recovery without sending email.
- **FR-021**: Domain bypass MUST fail closed: malformed configuration, empty configuration, suffix-only matches, and lookalike domains MUST not grant direct recovery.
- **FR-022**: Bypass recovery MUST still create same unique, expiring, single-use, retained audit record and enforce all normal password and account rules.
- **FR-023**: Email delivery failure MUST prevent issued link from remaining usable, retain failure outcome for audit, and show user a retry-safe neutral response.
- **FR-024**: Logs, errors, analytics, and audit metadata MUST exclude plaintext reset secrets, password values, password digests, and unnecessary email content.
- **FR-025**: Request, link validation, and password change MUST produce privacy-safe auditable security events with correlation, outcome, and timestamps.
- **FR-026**: Request and reset screens MUST include clear loading, success, validation, expired-link, and service-failure states on current mobile and desktop browsers.
- **FR-027**: Existing sign-up, verification, sign-in, sign-out, and password validation behavior MUST remain compatible.

### Key Entities

- **Password Reset Request**: Retained security record linking one account to generation time, exact expiration time, delivery path, lifecycle status, non-reusable secret verifier, and consumption/invalidation outcome.
- **Account**: Existing identity whose normalized email determines delivery path and whose password credential changes after valid reset.
- **Reset Message**: One-time recovery communication sent to account email, containing canonical link, expiry guidance, and unsolicited-request warning.
- **Bypass Domain Configuration**: Environment-specific allowlist used only to choose direct recovery instead of email delivery.

### Ownership and Access

- Account holder may request recovery while signed out, but public response does not confirm account existence.
- Only holder of valid unexpired reset authorization may view linked email and change password.
- Direct bypass recovery is available only where account domain is explicitly configured.
- Reset request records are security audit data; end users cannot list, edit, or delete them through this feature.
- Operational staff may access audit metadata only through existing authorized diagnostics, never plaintext password or reset secrets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of users in usability testing can request password recovery in under one minute without assistance.
- **SC-002**: At least 95% of users with a valid link can set a compliant password and reach sign-in in under two minutes.
- **SC-003**: 100% of tested authorizations reject use at or after 15 minutes, after consumption, after supersession, and during losing concurrent submissions.
- **SC-004**: 100% of tested successful resets reject old password, accept new password, and invalidate prior sessions.
- **SC-005**: 100% of exact configured-domain accounts use direct recovery without email; 100% of non-exact matches use normal email recovery.
- **SC-006**: 100% of tested reset records retain creation, expiration, delivery path, and final outcome without exposing reusable secret or password data.
- **SC-007**: At least 95% of reset requests show user next-step result within two seconds, excluding external email transit time.
- **SC-008**: Existing account creation, email verification, and sign-in critical flows show no functional regression.

### Critical User Flows *(mandatory)*

- **CUF-001**: Signed-out user requests recovery for normal account, receives email, opens unique link, sets matching compliant password, and signs in with new password.
- **CUF-002**: User with exact configured bypass domain requests recovery, receives no email, resets in same browser, and signs in with new password.
- **CUF-003**: Unknown-email request receives neutral response without usable link or account disclosure.
- **CUF-004**: Expired, malformed, superseded, and consumed links fail safely and lead to new-request path.
- **CUF-005**: Two concurrent uses of same valid link produce exactly one password change.
- **CUF-006**: Successful reset invalidates prior sessions and rejects old password.

## Assumptions

- Existing account-creation password rules remain authoritative and are reused without duplication.
- `VERIFICATION_BYPASS_DOMAINS` represents controlled development/test domains; production operators leave it empty unless direct recovery risk is intentionally accepted.
- Bypass uses exact normalized domain equality, not subdomain or suffix matching.
- Same-browser bypass continuation may reveal account match only inside intentionally configured bypass environments; normal environments retain neutral account-discovery behavior.
- Application already has one canonical externally reachable root URL suitable for email links.
- Reset audit records are retained under existing security-audit retention policy; expiration controls authorization use, not record deletion.
- Newest accepted request invalidates older unused requests to reduce risk and user confusion.
- Password reset invalidates existing sessions as standard account-recovery security behavior.
- Email delivery is available wherever bypass does not apply.
