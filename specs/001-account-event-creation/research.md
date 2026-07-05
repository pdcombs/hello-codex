# Research: Account and Event Creation

## Deployment Shape

**Decision**: Keep one Render Node service serving both the built React assets and same-origin GraphQL API.

**Rationale**: This preserves the working deployment, avoids CORS and cross-site cookie complexity, and
meets the current scale with the fewest services.

**Alternatives considered**: Separate static frontend and API services would scale independently but add
origins, deployments, and failure modes without current value. Multiple repositories would make atomic
contract changes and one-gate delivery harder.

## Authentication

**Decision**: Use email/password accounts with Argon2id hashes and opaque server-side MongoDB sessions
delivered through secure HTTP-only cookies.

**Rationale**: Server-side sessions support immediate sign-out/revocation and keep credentials out of
browser JavaScript. Opaque cookies are easier to secure for this same-origin application than long-lived
browser JWTs.

**Alternatives considered**: Browser-stored JWTs increase token theft and revocation complexity. A hosted
identity provider reduces credential implementation but adds cost/vendor setup and changes the deliberately
simple local environment. It can be reconsidered before social login or MFA.

## Verification Secrets

**Decision**: Generate cryptographically random, single-use secrets; persist only a digest; expire them;
and consume them atomically.

**Rationale**: A database leak does not expose usable links, and atomic consumption prevents replay.

**Alternatives considered**: Persisting raw secrets is simpler but unsafe. Signed self-contained links are
harder to revoke and audit.

## Event Viewing and Participant Registration

**Decision**: Every event is viewable by direct link. `OPEN` permits verified users to self-register;
`ADMIN_MANAGED` permits only the event creator to register or remove participants. Creator-added email or
phone identifiers reuse a matching account or create an unverified provisional account, and the
EventRegistration stores that account ID immediately.

**Rationale**: Viewing and participation are separate concerns. Stable account IDs preserve participant
identity across events, including before account completion, while server-side policy checks protect the
registration boundary.

**Alternatives considered**: Hiding ADMIN_MANAGED events conflates discovery with participation. Sending
claim/invitation links to provisional accounts adds messaging, expiry, and completion workflows that are
deferred. Free-standing participant records without account IDs would complicate later identity merging.

## Home and Dashboard Navigation

**Decision**: Anonymous visitors land on an informational home page that explains Votiy and points to
sign-in or account creation. After sign-in, the home page becomes the hosted-events dashboard. Event
actions are moved onto a single event detail page for the selected event.

**Rationale**: This separates marketing, account overview, and event management into clear stages and
keeps the dashboard focused on a host's event list instead of mixing actions across multiple events.

**Alternatives considered**: A single mixed home page for signed-in and signed-out users would blur the
primary call to action. Putting event actions on the dashboard list would make the user choose between
overview and management every time.

## GraphQL Error Contract

**Decision**: Return typed result unions with stable error codes for expected business failures and reserve
top-level GraphQL errors for malformed operations or unexpected failures.

**Rationale**: The UI can render deterministic field, authentication, conflict, and authorization states
without parsing messages.

**Alternatives considered**: Throwing every failure as a GraphQL error is compact but creates an unstable,
hard-to-test client contract.

## Persistence

**Decision**: Use focused MongoDB collections with unique, compound, and TTL indexes plus repository-level
document validation.

**Rationale**: It preserves the existing datastore, models lifecycle records naturally, and makes
uniqueness/expiry enforceable under concurrency.

**Alternatives considered**: Embedding all sessions and access records inside accounts/events creates
unbounded documents and makes TTL cleanup difficult. A relational migration is unjustified for this MVP.

## Transactional Email

**Decision**: Define a small email-sender interface for visitor-created account verification, use Mailpit
locally/in CI, and configure a production transactional provider through Render secrets. Host-added
provisional participants receive no message in this MVP.

**Rationale**: Host account verification requires a deliverable link, while the adapter keeps provider
details out of domain logic and tests without expanding provisional-account scope.

**Alternatives considered**: Logging links locally risks accidental production behavior. Running a
production mail server is operationally disproportionate.

## Validation and Duplicate Prevention

**Decision**: Validate at GraphQL input, service, and persistence boundaries; enforce unique indexes; and
use scoped idempotency keys on retryable creation mutations.

**Rationale**: Validation produces useful feedback, indexes protect concurrency, and idempotency prevents
double clicks or network retries from creating duplicates.

**Alternatives considered**: Client-only validation and in-memory request flags fail across tabs,
instances, or restarts.

## Testing

**Decision**: Use Vitest/Testing Library for unit and component tests, real Docker MongoDB for integration,
checked-in GraphQL operations for contract tests, and Playwright for critical journeys.

**Rationale**: These layers meet the constitution while keeping JavaScript tooling consistent across both
packages.

**Alternatives considered**: MongoDB mocks are fast but cannot verify indexes, atomic updates, TTLs, or
driver behavior. E2E-only testing is slower and poor at isolating failures.

## Observability and Delivery

**Decision**: Emit correlated JSON logs and audit events, split liveness/readiness, use Render and Atlas
operational views/alerts, and gate auto-deployment with the complete CI suite plus post-deploy smoke tests.

**Rationale**: This makes autonomous production delivery diagnosable without adding a separate telemetry
platform before traffic warrants one.

**Alternatives considered**: Console strings are hard to query and unsafe for context. A full external
observability stack adds cost and another service before baseline signals exist.
