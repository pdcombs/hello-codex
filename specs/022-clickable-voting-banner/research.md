# Research: Clickable Voting Banner

## Shared action state

**Decision**: One voting-access component renders both banner and existing Vote button.
**Rationale**: Both triggers share pending, error, code modal, and navigation state; duplicate controllers could issue simultaneous requests.
**Alternatives considered**: Synthetic click/ref coupling is brittle. Separate controllers duplicate logic and state.

## Semantics

**Decision**: Use native button for banner.
**Rationale**: Keyboard activation, focus, disabled state, and action semantics work without custom handlers.
**Alternatives considered**: Clickable status div needs manual keyboard/ARIA behavior. Direct link bypasses access check.

## Visual behavior

**Decision**: Keep current banner style, reset browser button chrome, add focus-visible and pending treatment.
**Rationale**: Preserves recognized visual while making interaction clear.
**Alternatives considered**: New banner design exceeds scope.
