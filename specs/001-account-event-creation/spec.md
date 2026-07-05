# Feature Specification: Account, Event, and Participant Registration

**Feature Branch**: `001-account-event-creation`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Make the public home page informational, switch signed-in users to a hosted-events dashboard, and keep all event-specific actions on the event detail page."

## Clarifications

### Session 2026-07-03

- Q: How many events may an account create during the MVP? → A: Multiple events per account.
- Q: Who may view an event? → A: Anyone with the direct link may view event details; the event setting governs participant registration rather than viewing.

### Session 2026-07-04

- Q: What participant-registration policy should a newly created event use by default? → A: ADMIN_MANAGED by default.
- Q: How does identity relate to event access and personas? → A: Hosts and participants must be signed in; direct-link attendees may be signed in or anonymous. These are contextual personas rather than account types.
- Q: Does this MVP implement participant registration? → A: Yes. It implements OPEN self-registration and ADMIN_MANAGED registration by the event creator; voting remains a future feature.
- Q: How do event viewing and the registration-policy setting interact? → A: Anyone with the direct link can view event details; OPEN allows self-registration, while ADMIN_MANAGED requires the event creator to register participants.
- Q: Who administers participant registration in this MVP? → A: Only the event creator can register or remove participants.
- Q: What happens when the creator registers a participant who has no account? → A: The system creates a provisional account identified by email or phone and writes the event registration with that account ID; verification and account completion are deferred.
- Q: Does this MVP send account-completion links to host-added participants? → A: No. Hosts add participants by email or phone directly; those identifiers remain unverified and link generation is out of scope.

## User Scenarios & Testing *(mandatory)*

### Actors and Personas

- **Visitor** lands on a public informational home page that explains what Votiy is and points toward sign-in or account creation.
- **Signed-in user** and **anonymous user** describe authentication state, not permanent roles.
- **Provisional user** has an unverified account created through participant registration and cannot
  authenticate or exercise completed-account privileges in this MVP.
- **Event host** is the signed-in creator and owner of an event.
- **Event participant** is a signed-in user registered for an event's voting activity.
- **Event attendee** views or attends an event and may be signed in or anonymous according to the host's
  access configuration.
- A single person may hold different personas in different events.

### Navigation and Page Model

- Public visitors see an informational home page focused on what Votiy is and what they can do next.
- After sign-in, the home page becomes the user's hosted-events dashboard.
- Event-specific actions live on the detail page for a single event rather than on the dashboard list.
- The dashboard lists events the user hosts; it does not mix in unrelated participant activity.

### User Story 1 - Create an Account (Priority: P1)

A new visitor creates a personal account so their future events can be associated with a durable,
protected identity.

**Why this priority**: Event ownership and all later participant, entry, and voting permissions depend on
knowing who the user is.

**Independent Test**: A visitor can submit valid account information, verify ownership of the email
address, and reach the hosted-events dashboard in an authenticated empty state without creating an event.

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
   session and see their hosted-events dashboard.
2. **Given** a visitor provides invalid credentials, **When** they attempt to sign in, **Then** access is
   denied without revealing whether a specific account exists.
3. **Given** an authenticated user, **When** they sign out, **Then** their session ends and protected areas
   require authentication again.

---

### User Story 3 - Create a Minimal Event (Priority: P3)

An authenticated user creates a voting event with a title, optional description and location, and a
participant-registration policy, establishing the first host-controlled event record on the platform.

**Why this priority**: Event creation is the first domain capability and the container for all later
participant, entry, category, and voting features.

**Independent Test**: A verified authenticated user can create multiple events, see a confirmation with
the saved values for each, leave, return, and still see all of those events on the hosted-events
dashboard associated with their account.

**Acceptance Scenarios**:

1. **Given** a verified authenticated user, **When** they submit a title and valid optional event details,
   **Then** the event is created, owned by that user, and displayed back to them.
2. **Given** a user omits description or location, **When** they submit a valid title, **Then** the event is
   still created without invented placeholder values.
3. **Given** a user omits the title or exceeds a field limit, **When** they submit the form, **Then** no
   event is created and the relevant field displays clear guidance.
4. **Given** an unauthenticated visitor, **When** they attempt to access event creation, **Then** they are
   required to authenticate and no event is created.
5. **Given** any event, **When** a signed-in or anonymous attendee opens its direct link, **Then** they can
   view the event details.
6. **Given** an event with OPEN registration, **When** a signed-in user chooses to participate, **Then**
   they can register themself as a participant.
7. **Given** an event with ADMIN_MANAGED registration, **When** a signed-in user attempts to self-register,
   **Then** no participant registration is created and the event creator must register them.
8. **Given** the creator registers a participant by email or phone and no matching account exists, **When**
   registration succeeds, **Then** a provisional account is created and the event registration references
   that account's ID, with the host recorded as the account's referrer.
9. **Given** a signed-in host opens an event from their dashboard, **When** the event detail page loads,
   **Then** they see only that event's details and available actions.

---

### Edge Cases

- Account input contains leading/trailing spaces or differently cased versions of an existing email.
- A creator registers a phone number or email that already belongs to a provisional or completed account.
- A provisional account is referenced by participant records in more than one event.
- Email verification is attempted with an expired, invalid, superseded, or already-used verification link.
- A user submits a form repeatedly while the first request is still processing.
- A session expires while the user is completing the event form.
- Event text contains Unicode, punctuation, or markup-like content.
- The service is temporarily unavailable during account or event creation.
- A user attempts to access an event owned by another account.
- A person attempts to register twice for the same event or retries while registration is processing.
- A host changes an event's registration policy while another person is viewing or registering.

## Scope Boundaries *(mandatory)*

### In Scope

- Account registration using an email address and password.
- A public informational home page that explains Votiy to visitors and routes them toward sign-in or
  account creation.
- A signed-in hosted-events dashboard that becomes the home page after authentication.
- Provisional account creation from an event participant's email address or phone number.
- Email ownership verification for visitor-created accounts.
- Sign-in, authenticated-session recognition, and sign-out.
- An authenticated empty state for users with no events.
- Creation and persistence of creator-owned events.
- Event title, description, and location fields.
- Host selection of OPEN or ADMIN_MANAGED participant registration during event creation.
- Direct-link viewing of every event by signed-in or anonymous attendees.
- Event detail pages that present one event at a time and contain that event's actions.
- Participant self-registration for OPEN events and creator-managed participant registration for
  ADMIN_MANAGED events.
- Event-host, event-participant, and event-attendee journeys.
- Confirmation and direct-link viewing of a newly created event.
- Clear validation, loading, success, empty, and failure states for included journeys.

### Out of Scope

- Voting and vote counting.
- Entries, submissions, categories, judging, rankings, or winners.
- Event date/time, schedules, rules, capacity, imagery, or custom attributes.
- Multiple entries or category-specific participation rules.
- Event discovery, search, or directory listings beyond direct-link access.
- Event editing beyond the participant-registration policy changes required by this feature, deletion,
  duplication, or
  cancellation.
- User profiles, social login, multi-factor authentication, teams, or host organizations.
- Password recovery and account deletion; these require a follow-up account-management feature.
- Verification, notification, invitation, or account-completion links for host-added provisional accounts.
- Claiming or completing a host-added provisional account and phone-based visitor signup.
- Administrative moderation, analytics, billing, notifications, or messaging beyond visitor email
  verification.

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
- **FR-012**: The system MUST create events with ADMIN_MANAGED participant registration by default and
  allow the creator to deliberately select OPEN registration.
- **FR-013**: The system MUST persist a successfully created event so its owner can see it in a later
  authenticated session.
- **FR-014**: Repeated or concurrent submissions MUST NOT create unintended duplicate accounts or events.
- **FR-015**: The system MUST provide visible loading, success, empty, validation, authentication-required,
  and recoverable failure states for included user journeys.
- **FR-016**: Authentication failures MUST use messages that do not disclose whether a submitted email is
  registered.
- **FR-017**: The system MUST allow an authenticated account to create and retain multiple independently
  identified events.
- **FR-018**: The system MUST provide each event with an unguessable direct link suitable for signed-in or
  anonymous viewing.
- **FR-019**: The system MUST allow signed-in and anonymous attendees possessing an event's direct link to
  view that event's details regardless of participant-registration policy.
- **FR-020**: The system MUST allow a verified signed-in user to self-register as a participant when the
  event's participant-registration policy is OPEN.
- **FR-021**: The system MUST prevent self-registration when the event's participant-registration policy
  is ADMIN_MANAGED and allow only the event creator to register participants instead.
- **FR-022**: The system MUST enforce the event's current participant-registration policy and the actor's
  creator authority at the server boundary on every participant-registration request.
- **FR-023**: When the event creator registers a participant by email or phone, the system MUST reuse the
  matching account or atomically create a provisional account when none exists.
- **FR-024**: The system MUST write every event registration with the registered account's immutable ID,
  including registrations for provisional accounts.
- **FR-025**: A provisional account MUST retain its unverified email or phone identifier but MUST NOT
  authenticate or exercise completed-account privileges in this MVP.
- **FR-026**: Host-managed participant registration MUST NOT send a verification, notification,
  invitation, or account-completion message.
- **FR-027**: When a host-managed participant account is created, the system MUST store the creating host's
  account ID on the account as referral metadata; self-registered accounts MUST store a null referral.
- **FR-028**: The system MUST show an informational public home page to anonymous visitors and switch the
  home page to a hosted-events dashboard after sign-in.
- **FR-029**: The system MUST present event-specific actions on a single event detail page for the selected
  event and MUST not require users to act from the dashboard list.

### Key Entities

- **Account**: A platform identity with a normalized unique email address or phone number, optional host
  referral metadata, provisional-or-completed lifecycle state, identifier-verification state, optional
  credential security information, creation time, and session eligibility. A host-created provisional
  account has no credentials, records the host's account ID as its referrer, remains unverified, and is
  not session eligible in this MVP.
- **Home Page**: A visitor-facing public page that explains Votiy and routes people into sign-in or account
  creation before authentication.
- **Hosted-Events Dashboard**: The signed-in home page that lists events the user hosts and provides entry
  points to each event's detail page.
- **Event**: A creator-owned voting-event record with a required title, optional description, optional
  location, OPEN-or-ADMIN_MANAGED participant-registration policy, direct-link identifier, creation time,
  and immutable creator association for this MVP.
- **Event Registration**: A record connecting an account ID, including a provisional account ID, to an
  event as a participant, including whether it was self-created or creator-managed and its current status.
- **Email Verification**: A single-purpose, expiring proof that a visitor-created account controls its
  supplied email address; provisional participant accounts do not receive one in this MVP.
- **Session**: Time-bounded authenticated access associated with one account and capable of being ended by
  the user or invalidated by the system.

### Ownership and Access

- An account owns the events it creates.
- The public home page is informational for anonymous visitors, while the signed-in home page becomes the
  hosted-events dashboard.
- Anyone with the direct link may view an event's details.
- Each event's actions are performed from that event's detail page.
- Event ownership is assigned by the system from the authenticated session, never accepted from client
  input.
- Each event registration references exactly one immutable account ID.
- OPEN events allow a verified signed-in account to register itself as a participant.
- ADMIN_MANAGED events allow only the event creator to create participant registrations.
- Participant-registration policy and creator authority are enforced by the service and never inferred
  solely from browser state.
- Account credentials and verification artifacts are never readable through user-facing event data.
- Unauthenticated and unverified users cannot create events or register as participants; direct-link event
  viewing remains available without authentication.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of first-time users can create and verify an account without assistance on their
  first attempt.
- **SC-002**: A new user can progress from the registration screen to a successfully created event in under
  three minutes, excluding time spent waiting to receive email.
- **SC-003**: At least 95% of valid account, sign-in, and event-creation submissions provide a visible result
  within two seconds under normal operating conditions.
- **SC-004**: In acceptance testing, 100% of unauthorized attempts to create events or register
  participants are denied, while every valid direct link remains viewable.
- **SC-005**: In acceptance testing, every successfully created event remains visible to its owner after
  signing out and returning in a later session.
- **SC-006**: At least 90% of usability-test participants can identify which event fields are required and
  correct an invalid submission without assistance.
- **SC-007**: In acceptance testing, first-time visitors can identify Votiy's purpose from the home page
  and reach the sign-in or account-creation entry points without assistance.

### Critical User Flows *(mandatory)*

- **CUF-001 - New Host Creates First Event**: A visitor registers, verifies their email, enters an
  authenticated session, creates an event with a title and optional details, and sees the persisted event.
- **CUF-002 - Returning Host Resumes Work**: A verified account owner signs in, sees all of their existing
  events, and signs out successfully.
- **CUF-003 - Participant Registration Policy Is Enforced**: A signed-in or anonymous attendee can open an
  event through its direct link, a verified signed-in user can self-register for an OPEN event, and only
  the event creator can register a participant for an ADMIN_MANAGED event; registering an unknown
  identifier creates a provisional account linked to the participant record.

## Assumptions

- Users are adults or otherwise permitted to create an account; age-gating and parental consent are not
  part of this feature.
- Email/password is the initial visitor-created account method; email verification establishes a
  recoverable identity before protected actions.
- Title is the only required event field; description and location are optional.
- Hosts control whether participant registration is OPEN or ADMIN_MANAGED; all event details are viewable
  by direct link, while directory discovery remains a future feature.
- The platform sends transactional email verification only for visitor-created accounts; host-added
  participants receive no message in this MVP.
- Users who create their own accounts have access to a current mobile or desktop browser and an email inbox.
- The current deployed application and environments remain the delivery foundation; implementation choices
  are deferred to planning.
