# Feature Specification: Account and Event Creation

**Feature Branch**: `001-account-event-creation`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Allow people to navigate to the application, create an account, and create a minimal event with a title, description, and location."

## Clarifications

### Session 2026-07-03

- Q: How many events may an account create during the MVP? → A: Multiple events per account.
- Q: Who may view an event? → A: The creator selects public or private; public events are accessible to anyone with the link, while private events are accessible only to people invited or added by the creator.

### Session 2026-07-04

- Q: What visibility should a newly created event use by default? → A: Private by default.
- Q: How does identity relate to event access and personas? → A: Hosts and participants must be signed in; attendees may be signed in or anonymous according to the host's event configuration. Host, participant, and attendee are contextual personas rather than account types.
- Q: Does this MVP implement participant registration? → A: No. This MVP implements event hosts and attendee access only; participant registration remains a future feature.

## User Scenarios & Testing *(mandatory)*

### Actors and Personas

- **Signed-in user** and **anonymous user** describe authentication state, not permanent roles.
- **Event host** is the signed-in creator and owner of an event.
- **Event participant** is a signed-in user involved in an event's competition or activity.
- **Event attendee** views or attends an event and may be signed in or anonymous according to the host's
  access configuration.
- A single person may hold different personas in different events.

### User Story 1 - Create an Account (Priority: P1)

A new visitor creates a personal account so their future events can be associated with a durable,
protected identity.

**Why this priority**: Event ownership and all later participant, entry, and voting permissions depend on
knowing who the user is.

**Independent Test**: A visitor can submit valid account information, verify ownership of the email
address, and reach an authenticated empty state without creating an event.

**Acceptance Scenarios**:

1. **Given** a visitor with an unused email address, **When** they provide valid account details and
   complete email verification, **Then** an account is created and they enter an authenticated session.
2. **Given** a visitor enters an email address already associated with an account, **When** they submit
   registration, **Then** no duplicate account is created and they receive safe guidance to sign in.
3. **Given** a visitor provides incomplete or invalid account details, **When** they submit registration,
   **Then** the account is not created and each correctable field displays clear guidance.

---

### User Story 2 - Return to an Account (Priority: P2)

A returning user signs in and signs out so they can safely resume or end access to their account.

**Why this priority**: A durable account is useful only if its owner can securely return to it and end a
session on a shared device.

**Independent Test**: An existing verified user can sign in with valid credentials, reach their account,
and sign out; invalid credentials never grant access.

**Acceptance Scenarios**:

1. **Given** a verified user, **When** they provide valid credentials, **Then** they enter an authenticated
   session and see their event area.
2. **Given** a visitor provides invalid credentials, **When** they attempt to sign in, **Then** access is
   denied without revealing whether a specific account exists.
3. **Given** an authenticated user, **When** they sign out, **Then** their session ends and protected areas
   require authentication again.

---

### User Story 3 - Create a Minimal Event (Priority: P3)

An authenticated user creates an event with a title, optional description and location, and a visibility
setting, establishing the first host-controlled event record on the platform.

**Why this priority**: Event creation is the first domain capability and the container for all later
participant, entry, category, and voting features.

**Independent Test**: A verified authenticated user can create multiple events, see a confirmation with
the saved values for each, leave, return, and still see all of those events associated with their account.

**Acceptance Scenarios**:

1. **Given** a verified authenticated user, **When** they submit a title and valid optional event details,
   **Then** the event is created, owned by that user, and displayed back to them.
2. **Given** a user omits description or location, **When** they submit a valid title, **Then** the event is
   still created without invented placeholder values.
3. **Given** a user omits the title or exceeds a field limit, **When** they submit the form, **Then** no
   event is created and the relevant field displays clear guidance.
4. **Given** an unauthenticated visitor, **When** they attempt to access event creation, **Then** they are
   required to authenticate and no event is created.
5. **Given** a host creates a public event, **When** a signed-in or anonymous attendee opens its link,
   **Then** they can view the event without being added by the host.
6. **Given** a host creates a private event, **When** a person who has not been invited or added opens its
   link, **Then** no private event information is disclosed.
7. **Given** a host invites an attendee to a private event, **When** that attendee signs in using the
   invited identity and opens the event, **Then** they can view it.

---

### Edge Cases

- Account input contains leading/trailing spaces or differently cased versions of an existing email.
- Verification is attempted with an expired, invalid, or already-used verification link.
- A user submits a form repeatedly while the first request is still processing.
- A session expires while the user is completing the event form.
- Event text contains Unicode, punctuation, or markup-like content.
- The service is temporarily unavailable during account or event creation.
- A user attempts to access an event owned by another account.
- A person uses a revoked, malformed, or expired private-event invitation.
- A host changes an event's visibility while another person is viewing it.

## Scope Boundaries *(mandatory)*

### In Scope

- Account registration using an email address and password.
- Email ownership verification.
- Sign-in, authenticated-session recognition, and sign-out.
- An authenticated empty state for users with no events.
- Creation and persistence of creator-owned events.
- Event title, description, and location fields.
- Host selection of public or private visibility during event creation.
- Link-based viewing of public events.
- Host-managed access to private events through invitations or an access list.
- Event-host and event-attendee journeys; the participant persona is defined for future compatibility but
  has no registration or participation behavior in this MVP.
- Confirmation and access-controlled viewing of a newly created event.
- Clear validation, loading, success, empty, and failure states for included journeys.

### Out of Scope

- Voting and vote counting.
- Participant registration, competition participation, or participant management.
- Entries, submissions, categories, judging, rankings, or winners.
- Event date/time, schedules, rules, capacity, imagery, or custom attributes.
- Multiple entries or category-specific participation rules.
- Public event discovery, search, or directory listings beyond direct-link access.
- Event editing beyond the visibility changes required by this feature, deletion, duplication, or
  cancellation.
- User profiles, social login, multi-factor authentication, teams, or host organizations.
- Password recovery and account deletion; these require a follow-up account-management feature.
- Administrative moderation, analytics, billing, notifications, or messaging.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a visitor to register with an email address and password.
- **FR-002**: The system MUST normalize email input and prevent multiple accounts from using the same
  normalized email address.
- **FR-003**: The system MUST require proof of email ownership before a user can create an event.
- **FR-004**: The system MUST validate account input and communicate correctable problems without exposing
  credentials or whether a specific account exists beyond the safe registration guidance.
- **FR-005**: The system MUST allow a verified user to establish and end an authenticated session.
- **FR-006**: The system MUST deny protected account and event-creation capabilities to unauthenticated or
  unverified users.
- **FR-007**: The system MUST allow a verified authenticated user to create an event with a required title.
- **FR-008**: The system MUST allow an event description and location to be omitted independently.
- **FR-009**: The system MUST reject titles that are blank after trimming and MUST enforce documented
  limits of 120 characters for title, 2,000 for description, and 300 for location.
- **FR-010**: The system MUST preserve user-entered Unicode and punctuation while treating all event text
  as untrusted content when displayed.
- **FR-011**: The system MUST associate every event with exactly one creating account at creation time.
- **FR-012**: The system MUST create events as private by default and allow the creator to deliberately
  select public visibility.
- **FR-013**: The system MUST persist a successfully created event so its owner can see it in a later
  authenticated session.
- **FR-014**: Repeated or concurrent submissions MUST NOT create unintended duplicate accounts or events.
- **FR-015**: The system MUST provide visible loading, success, empty, validation, authentication-required,
  and recoverable failure states for included user journeys.
- **FR-016**: Authentication failures MUST use messages that do not disclose whether a submitted email is
  registered.
- **FR-017**: The system MUST allow an authenticated account to create and retain multiple independently
  identified events.
- **FR-018**: The system MUST provide each event with an unguessable direct link suitable for access by
  its intended audience.
- **FR-019**: The system MUST allow signed-in and anonymous attendees possessing a public event's direct
  link to view that event.
- **FR-020**: The system MUST disclose a private event only to its creator or a person currently invited
  or added by the creator who is signed in with the authorized identity.
- **FR-021**: The system MUST allow the creator to add, invite, and remove people from a private event's
  access list.
- **FR-022**: The system MUST enforce the event's current visibility and access list at the server
  boundary on every event-view request.

### Key Entities

- **Account**: A platform identity with a normalized unique email address, verification state, credential
  security information, creation time, and session eligibility.
- **Event**: A creator-owned event record with a required title, optional description, optional location,
  public-or-private visibility, direct-link identifier, creation time, and immutable creator association
  for this MVP.
- **Event Access**: A creator-managed authorization record connecting an invited or added signed-in
  identity to a private event, including its current access status.
- **Email Verification**: A single-purpose, expiring proof that the account registrant controls the supplied
  email address.
- **Session**: Time-bounded authenticated access associated with one account and capable of being ended by
  the user or invalidated by the system.

### Ownership and Access

- An account owns the events it creates.
- Anyone with the direct link may view a public event.
- Only the creator and signed-in people currently invited or added by the creator may view a private event.
- Event ownership is assigned by the system from the authenticated session, never accepted from client
  input.
- Event visibility and private-event access are enforced by the service and never inferred solely from
  browser state or possession of a private-event link.
- Account credentials and verification artifacts are never readable through user-facing event data.
- Unauthenticated and unverified users cannot create events; viewing access follows the event's public
  or private visibility rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of first-time users can create and verify an account without assistance on their
  first attempt.
- **SC-002**: A new user can progress from the registration screen to a successfully created event in under
  three minutes, excluding time spent waiting to receive email.
- **SC-003**: At least 95% of valid account, sign-in, and event-creation submissions provide a visible result
  within two seconds under normal operating conditions.
- **SC-004**: In acceptance testing, 100% of unauthorized attempts to create events or view private events
  are denied without exposing protected event data, while public direct links remain viewable.
- **SC-005**: In acceptance testing, every successfully created event remains visible to its owner after
  signing out and returning in a later session.
- **SC-006**: At least 90% of usability-test participants can identify which event fields are required and
  correct an invalid submission without assistance.

### Critical User Flows *(mandatory)*

- **CUF-001 - New Host Creates First Event**: A visitor registers, verifies their email, enters an
  authenticated session, creates an event with a title and optional details, and sees the persisted event.
- **CUF-002 - Returning Host Resumes Work**: A verified account owner signs in, sees all of their existing
  events, and signs out successfully.
- **CUF-003 - Event Visibility Is Enforced**: A signed-in or anonymous attendee can open a public event
  through its direct link, an invited or added signed-in attendee can open a private event, and an
  unauthorized person receives no private event data.

## Assumptions

- Users are adults or otherwise permitted to create an account; age-gating and parental consent are not
  part of this feature.
- Email/password is the initial account method because it provides a conventional baseline without adding
  third-party identity dependencies.
- Email verification is required before event creation to reduce abuse and establish recoverable identity.
- Title is the only required event field; description and location are optional.
- Hosts control whether an event is public by direct link or private to invited and added people; public
  directory discovery remains a future feature.
- The platform sends transactional verification email, but other notifications are deferred.
- Users have access to a current mobile or desktop browser and an email inbox.
- The current deployed application and environments remain the delivery foundation; implementation choices
  are deferred to planning.
