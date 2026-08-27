# Research: Open / Close Voting

## Manual state versus saved schedule

**Decision**: Add explicit `votingState.status` (`closed` or `open`) and make it authoritative. `opensAt` and `closesAt` remain saved/displayed but perform no automatic gate.

**Rationale**: Host requested manual-only control for this increment. Separate state avoids mutating configured rule versions or fabricating dates during open/close.

**Alternatives considered**: Combine manual state with date window; automatically derive status from dates; rewrite dates on button actions. All conflict with “at any time” or couple display data to authority.

## State location and concurrency

**Decision**: Embed versioned `votingState` object in event and transition it with event ID, owner ID, expected state version, active lifecycle, and current status filters.

**Rationale**: Ballot and access gates already load event. Atomic conditional update gives one concurrent winner without new collection.

**Alternatives considered**: Store status in `votingRules` and increment rules version; separate state collection. First misrepresents rule changes; second adds cross-document consistency.

## Existing-event migration

**Decision**: Migration 006 adds closed version-1 voting state to every schema-version-4 event and advances event schema version. New events receive closed state.

**Rationale**: Safe default prevents deployment from opening events whose old date window happens to be active.

**Alternatives considered**: Infer state from dates. Rejected because deployment could unexpectedly enable voting.

## Access decision contract

**Decision**: One mutation evaluates fresh state and accepts optional access code. It returns explicit decision enum plus requirements object and current rules version. First code-policy request returns `CODE_REQUIRED`; code submission reuses same mutation.

**Rationale**: Mutations may create browser markers, consume codes, and persist grants. Stable requirements keep policy handling out of UI conditionals.

**Alternatives considered**: Query capability then separate claim mutation; client-only interpretation. Both allow drift and duplicate policy logic.

## Code claim before ballot UI

**Decision**: On successful access request, atomically consume unused code and create active event voter access grant bound to completed account when required, otherwise to secure browser marker digest. Code `usedByBallotId` remains null until future ballot association.

**Rationale**: User explicitly requires code consumption before placeholder navigation. Binding preserves proof for future ballot work and blocks reuse.

**Alternatives considered**: Reserve rather than consume; wait for ballot. Both contradict requested semantics.

## Repeat-limit evaluation

**Decision**: Account policies count existing event ballots by account. Browser-limited unrestricted policies count by marker digest. Code policies allow new unused code when no active grant applies, while rejected used code remains retryable.

**Rationale**: Existing ballot history stays authoritative across close/reopen. Code is bearer authority and always permits another unused code attempt.

**Alternatives considered**: Count access-page visits; reset on reopen. Both would deny non-voters or erase integrity history.

## Return paths through account completion

**Decision**: Use validated same-origin relative `returnTo` query values across sign-in, registration, and email verification. Return to event detail; visitor selects Vote again for fresh decision.

**Rationale**: Verification may cross sessions. URL-carried relative state survives while blocking open redirects and stale access grants.

**Alternatives considered**: Router memory state only; persistent server-side pending intent; direct placeholder redirect. Router state cannot survive email; other choices add state or bypass fresh evaluation.

## Host code inventory warning

**Decision**: Opening requires configured rules and at least one active entry, not codes. For code policy with zero unused codes, transition succeeds with warning and settings link.

**Rationale**: Codes remain manageable while open. Warning prevents surprise without blocking host workflow.

**Alternatives considered**: Block opening until unused codes exist; omit warning.

## Observability and rollback

**Decision**: Emit safe structured state/access/claim logs and retained audit events. Code-only rollback ignores embedded state/grant additions; never delete or reset voting history. New manual state defaults closed if older code cannot interpret it.

**Rationale**: Voting transitions are trust-sensitive. Retention preserves auditability and rollback safety.

**Alternatives considered**: Destructive rollback or logging request inputs. Both violate integrity/privacy.
