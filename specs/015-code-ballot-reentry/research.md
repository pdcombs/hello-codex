# Research: Require New Code for Each Ballot

## Decision: Treat the grant as the current claimed code

**Rationale**: The existing event/browser or event/account grant can rotate to a newly claimed code. If its code already backs a ballot, it supports review identity but cannot authorize submission.

**Alternatives considered**: Permanent reusable grants violate one ballot per code. A grant-history collection duplicates immutable ballot/code history.

## Decision: Preserve the unique ballot/code constraint

**Rationale**: The existing unique ballot code identity is the final defense against concurrent double use. Service checks improve recovery, but persistence decides races.

**Alternatives considered**: Count-only validation races. Removing the constraint weakens integrity.

## Decision: Keep review authorization separate

**Rationale**: Account/browser identity retrieves the latest ballot without reusing a code. Another ballot requires a grant whose current code has no ballot.

**Alternatives considered**: Requiring a consumed code breaks review. Letting review identity submit recreates the defect.

## Decision: Reuse the access request mutation

**Rationale**: No code plus used grant returns `CODE_REQUIRED`; a different unused code rotates the grant and returns `ALLOWED`. Server state determines intent without a client-trusted flag.

**Alternatives considered**: A second mutation adds surface without authority.

## Decision: Preserve claim-at-access timing

**Rationale**: Existing behavior marks a code used when access is granted. Submission attaches its ballot to that claimed code, preserving established management semantics.

**Alternatives considered**: Delayed consumption changes recovery behavior beyond this correction.

## Decision: Make the completed page own re-entry

**Rationale**: Prior review stays intact while code entry is canceled or rejected. Only successful fresh-code authorization resets the form.

**Alternatives considered**: Immediate clearing exposes an unauthorized editable ballot and discards review state.

## Decision: Map races to code-specific feedback

**Rationale**: Duplicate code use should request another code; exact idempotent replay still returns original success.

**Alternatives considered**: Raw storage conflicts and generic ballot-limit errors are misleading.
