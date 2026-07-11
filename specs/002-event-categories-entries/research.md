# Research: Event Categories and Entries

## Embedded categories on Event

**Decision**: Store a bounded `categories` array in each event document.

**Rationale**: Categories are event-owned, limited to 100, always needed for setup and grouped detail views, and naturally created with the event. Embedding makes default-category creation atomic and avoids a new collection and join for every event read.

**Alternatives considered**:

- Separate category collection: supports independent pagination but adds joins and multi-document event creation without benefit at the target scale.
- One category field on each entry only: cannot represent empty categories or editable category metadata.

## Embedded entries on EventRegistration

**Decision**: Store a bounded `entries` array on each event registration.

**Rationale**: Entries are owned by one participant registration, are created together during registration, and are counted per participant. Embedding makes registration plus entries one document operation and keeps removal/revival lifecycle aligned.

**Alternatives considered**:

- Separate entries collection: simplifies category queries but requires a transaction even when the participant account already exists and increases repository surface.
- Entries embedded in event: one event could approach document limits and participant ownership/count queries become expensive to update.

## Transaction boundary

**Decision**: Use a MongoDB transaction for provisional account, event registration with entries, and idempotency record creation.

**Rationale**: The specification prohibits partial participant or entry records. These records span collections when a provisional account is required. Atlas supports transactions, and a single-node local replica set provides equivalent behavior without a new service.

**Alternatives considered**:

- Compensating deletes: difficult to prove under process interruption and conflicts with the current no-delete repository posture.
- Accept orphan provisional accounts: violates the acceptance scenario that nothing is created on failure.

## Existing-data migration

**Decision**: Run an idempotent startup migration before final validator enforcement and HTTP readiness. Backfill every account display name, add one default category per existing event, and add one sequentially titled entry to every active or removed registration while preserving status.

**Rationale**: The user selected automatic generation. Stable `createdAt` and ID ordering produces repeatable, privacy-safe titles without exposing email or phone.

**Alternatives considered**:

- Manual host setup: rejected by the product decision.
- Contact-derived titles: rejected because entry titles become voter-facing and would disclose personal data.

## GraphQL evolution

**Decision**: Require display name and entry inputs in the combined contract, stage the contract without switching the runtime, and activate it only after migrations, resolvers, host/self-registration UI, and tests are complete in one exact commit.

**Rationale**: The user requires every registration to collect entry details, so silent compatibility-generated entries would violate the product contract. Render serves the tested web bundle from the same API deployment, allowing coordinated activation; stale clients receive an actionable reload response.

**Alternatives considered**:

- Optional compatibility entries: rejected because they bypass required collection.
- Activating the schema before resolvers and UI: rejected because new non-null fields would fail at runtime.

## Public participant representation

**Decision**: Add required `displayName` to every account and use it in public grouped-entry projections. Existing email accounts derive it from the string before `@`; legacy phone-only accounts use stable `Participant {n}` fallbacks. Host-only participant views retain administrative contact fields.

**Rationale**: Entry owners must be distinguishable to voters later, while contact identifiers are private and prohibited in public details.

**Alternatives considered**:

- Display email: rejected as unnecessary personal-data exposure.
- Hide owner entirely: contradicts the requirement to show entry ownership.

## Self-registration entry collection

**Decision**: OPEN-event self-registration collects 1–100 entry inputs, with one row precreated and its category set to the event default.

**Rationale**: This applies the same entry invariant to every registration path while allowing the participant to supply voter-facing titles.

**Alternatives considered**:

- Generate a self-registration entry title: rejected because every registration must collect entry details.
- Disable OPEN registration: rejected because it would regress the existing event policy feature.
