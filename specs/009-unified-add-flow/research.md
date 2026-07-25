# Research: Unified Add Flow

## Decision 1: Reuse Existing Category and Entry Mutations

**Decision**: Keep category creation and entry creation as separate existing operations. Bottom sheet
orchestrates whichever operation host selects.

**Rationale**: Both operations already enforce ownership, validation, idempotency, audit, and persistence
rules. Feature changes navigation and presentation, not transaction boundaries.

**Alternatives considered**:

- New aggregate “add event content” mutation: rejected because it duplicates mature authorization and
  validation paths.
- Client-only persistence: rejected because server must remain authoritative.

## Decision 2: Local, Explicit Bottom-Sheet State

**Decision**: Model sheet as local states: choose type, add category, choose entry owner/category, and name
entry. Reset state after close or successful save.

**Rationale**: Flow is short-lived and belongs to one event workspace. Local state avoids global state
complexity and stale drafts across events.

**Alternatives considered**:

- URL-backed wizard: rejected because unfinished add state is not shareable product state.
- Application-wide store: rejected because no other view consumes draft values.

## Decision 3: Resolve Default Category by Domain Flag

**Decision**: Select active category whose `isDefault` value is true. Block Entry flow with recovery
guidance if none exists.

**Rationale**: Display order can change and is not a domain guarantee. Selecting first category risks
silently saving into the wrong category.

**Alternatives considered**:

- First active category: rejected as ambiguous and unsafe.
- Ask for category on every entry without a default: rejected because user requires default selection.

## Decision 4: Extend Existing Add Entry Presentation

**Decision**: Reuse owner-choice search, recent-owner ordering, provisional account creation, entry-title
validation, and entry mutation. Add category selection before owner/title completion.

**Rationale**: Existing behavior already implements identity search and creation edge cases. Composition
reduces regression risk and keeps one source of truth.

**Alternatives considered**:

- Copy current modal into a new component: rejected because behavior would drift.
- Keep category-specific launch buttons: rejected by unified entry-point requirement.

## Decision 5: Remove Direct Participant Creation from UI Only

**Decision**: Remove participant disclosure/form and dependencies from current participant panel. Preserve
participant cards, removal behavior, empty state, and compatible server operations.

**Rationale**: Participants are derived from active entry ownership. UI should not encourage an
independent participant lifecycle, while immediate API removal could break older clients.

**Alternatives considered**:

- Delete participant mutation now: rejected as unnecessary breaking contract change.
- Leave collapsed form: rejected because it conflicts with single Add flow.

## Decision 6: Authoritative Reload After Save

**Decision**: After successful category or entry creation, reload event detail before closing or completing
the sheet; participant route loads derived participants through its existing query.

**Rationale**: Reload guarantees categories, entries, analytics, revisions, and ownership reflect
server-authoritative state and avoids fragile client-side cache reconstruction.

**Alternatives considered**:

- Patch local category arrays: rejected because analytics, revisions, and participant derivation can
  become inconsistent.
- Full browser reload: rejected because it loses UI context and is slower.

## Decision 7: Accessibility and Responsive Pattern

**Decision**: Use existing dialog-backed bottom-sheet pattern with accessible name, modal semantics, focus
trap, Escape/backdrop/Close dismissal, focus restoration, step heading focus, scrollable content, and safe
bottom padding.

**Rationale**: Established project pattern already passed keyboard/mobile checks and matches requested
interaction.

**Alternatives considered**:

- Non-modal inline expansion: rejected because user explicitly requested a bottom sheet.
- Native popover: rejected because modal focus and broad current-browser behavior are clearer with the
  existing dialog pattern.

## Decision 8: Shared Workspace Mount and Safe Cutover

**Decision**: Mount one functional Add sheet/controller in shared owner workspace layout so Entries,
Participants, and Results receive identical behavior. Keep legacy category/entry launch controls until
both new creation paths pass validation, then remove them together.

**Rationale**: Shared mounting prevents route-specific drift. One cutover avoids an intermediate release
where chooser exists but one or both creation actions are unavailable.

**Alternatives considered**:

- Mount separate sheets per route: rejected because state, focus, and mutation behavior would diverge.
- Remove legacy controls during chooser-only phase: rejected because it would break existing creation
  before replacements work.
