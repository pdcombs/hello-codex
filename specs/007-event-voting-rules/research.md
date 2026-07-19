# Research: Event Voting Rules

## Rules persistence

**Decision**: Embed one current rules object on event with monotonic `version`, `updatedAt`, and category overrides keyed by category identity.

**Rationale**: Event and rules load consistently in one read; host update uses event ownership and optimistic concurrency already established. Version captured by ballots preserves submission-time context.

**Alternatives considered**: Separate rules collection adds joins and cross-document consistency without independent growth benefit. Full rule-version documents add complexity before historical rule reconstruction is required.

## Safe defaults and migration

**Decision**: Migration 005 creates `draft` rules with `opensAt:null`, `closesAt:null`, unrestricted access, unlimited public repeats, single-selection default, one account ballot, and no overrides. Draft/null window means voting closed until host saves valid instants.

**Rationale**: Existing events cannot accidentally open voting. FR-006 applies when rules move from draft to configured. Migration is deterministic and idempotent.

**Alternatives considered**: Arbitrary future dates surprise hosts; always-open migration violates safe rollout.

## Category method representation

**Decision**: Store event default method plus sparse category overrides. Each effective rule resolves against active category and active entry count at read/submission time.

**Rationale**: New categories inherit predictable behavior; archived category identities cannot vote; sparse storage avoids copying defaults.

**Alternatives considered**: One required record per category creates synchronization burden whenever categories change.

## Code secrecy and inventory

**Decision**: Generate codes with cryptographic randomness. Persist keyed digest for claim lookup and AES-256-GCM ciphertext/IV/tag for host-only inventory. Add externally supplied 32-byte encryption key; never expose key or raw code in logs/audits.

**Rationale**: Host must retrieve raw codes, while digest-only storage cannot satisfy inventory. Encryption limits database snapshot exposure and supports indexed equality lookup through digest.

**Alternatives considered**: Plaintext is operationally simpler but treats credentials weakly. Reversible deterministic encryption leaks equality and is unnecessary beside digest.

## Code alphabet and capacity

**Decision**: Use `a-z0-9`, length six. Maximum 1,000 codes/request and 100,000/event. Unique `(eventId, codeDigest)` index; retry random collisions until exact count or bounded failure.

**Rationale**: 36^6 offers 2.18 billion values. Limits protect request latency and host usability while supporting large events.

**Alternatives considered**: Global uniqueness unnecessary; longer codes reduce memorability; ambiguous-character filtering conflicts with clarified alphabet.

## Atomic code consumption

**Decision**: Validate rules/category/entries and eligibility inside one transaction, then upsert provisional account/access, conditionally claim unused code, insert immutable ballot, write audits/idempotency. Code is used only if transaction commits.

**Rationale**: Prevents consumed-without-ballot and ballot-without-access failures. Conditional code update plus unique ballot constraints resolves races.

**Alternatives considered**: Claim-on-entry can burn codes during abandoned forms, contrary to requirement. Compensation is less reliable than transaction.

## Account and voter relationship

**Decision**: Reuse normalized-email account when found; otherwise create unverified provisional account with `referredByAccountId` set to host only when host created it, otherwise null. Create separate event-voter-access record. Never create participant or entry ownership.

**Rationale**: Matches current account lifecycle and keeps voting eligibility independent from participation.

**Alternatives considered**: Email-only voter record duplicates identity and complicates later account completion.

## Anonymous browser limit

**Decision**: Server issues random HttpOnly same-site browser marker on first successful browser-limited ballot and stores only digest on ballot. Reject same event/marker later. Unlimited mode omits marker uniqueness.

**Rationale**: UI remains dumb and server evaluates marker. Product explicitly accepts browser limitation as deterrence, not identity security.

**Alternatives considered**: LocalStorage is client-authoritative. IP/fingerprint limits create privacy and false-positive risks. Strong prevention requires accounts/codes.

## Account submission limits

**Decision**: Host configures integer `maxBallotsPerAccount` from 1–100; default one. Applies to account-restricted and account-required code mode. A code remains single-use regardless of account allowance.

**Rationale**: Makes FR-016 testable and bounded. Code mode can grant account event access once, but later ballots remain subject to account limit.

**Alternatives considered**: Unlimited integer risks abuse and unclear UI; per-category limits conflate ballot count with selection rules.

## Rule updates during voting

**Decision**: Optimistic concurrency on event/rules timestamps and monotonic version. Each submission re-reads current rules inside transaction and records version. Accepted ballots remain immutable.

**Rationale**: Clear prospective semantics and safe races without retroactive mutation.

**Alternatives considered**: Locking rules after open contradicts host requirement; rewriting ballots breaks auditability.

## API capability projection

**Decision**: Return rules plus computed `votingStatus`, `canVote`, eligibility reason, effective category methods, remaining account ballots, and own code/access state. UI renders these capabilities; mutations independently revalidate.

**Rationale**: Keeps UI simple while preventing direct-call bypass.

**Alternatives considered**: Sending configuration alone duplicates policy logic in browser. Sending only boolean hides needed ballot shape.

## Privacy and retention

**Decision**: Keep rules, codes, access, and ballots indefinitely for audit until future retention policy. Host-only inventory may show claimant display/email; public views never do. No raw codes/contact/choices in operational telemetry.

**Rationale**: Existing product requires history and no hard delete. Future privacy/retention feature may archive/anonymize under explicit policy.

**Alternatives considered**: TTL would destroy audit history and conflict with current requirements.
