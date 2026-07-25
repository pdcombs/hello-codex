# UI Contract: Unified Add Bottom Sheet

## Launch

- Owner workspace summary renders primary `Add` beside Settings.
- One shared workspace controller mounts the functional sheet for Entries, Participants, and Results.
- Control is absent for non-owner and anonymous views.
- Only one Add sheet may be open.

## Chooser

- Accessible dialog name: `Add to event`.
- Prompt: `What are you adding?`
- Choices: `Category`, `Entry`.
- Close control, Escape, and backdrop dismiss without persistence.
- Dismissal restores focus to Add.

## Category Path

1. Category choice opens category step.
2. Step requests `Category title`.
3. Back returns to chooser; Cancel closes.
4. Save disables while pending.
5. Field validation appears beside title; general failure uses an announced alert.
6. Success reloads event, closes sheet, and restores usable workspace focus.

## Entry Path

1. Entry choice opens entry flow.
2. Active categories appear in required category selector.
3. Active default category is initially selected.
4. Host may select any other active category.
5. Existing owner search/recent choices/new-account interaction follows category selection.
6. Existing title step follows owner selection.
7. Back preserves prior category and owner values.
8. Save disables while pending and uses one stable idempotency key for retries.
9. Success reloads event, closes sheet, and exposes entry under selected category.

## Error Contract

- Missing default category: block progression and show `Default category unavailable. Refresh the event
  or repair event setup before adding an entry.`
- Category disappeared/conflicted: retain input, identify category selection, offer Refresh.
- Validation: focus first invalid field and announce concise summary.
- Authorization/session failure: close management flow after safe denial or route through existing auth
  handling; never show stale success.
- Network/service failure: retain recoverable input and allow retry.

## Removed Controls

- Legacy Add Category and Add Entry controls remain available until both replacement paths pass automated
  validation; removal occurs in one release cutover.
- Category cards and category-list footer do not render Add Entry or Add Category.
- Participant page does not render Add Participant disclosure or form.
- Empty Participants state says participants appear after host adds an entry.
- Existing category Edit, entry Delete, participant cards, and participant removal remain unchanged.

## Accessibility and Responsive Rules

- Focus remains trapped while sheet is open.
- Step heading receives focus after transition.
- Every field has visible label and associated error.
- Sheet content scrolls independently on short viewports.
- Actions remain reachable above device safe area and onscreen keyboard.
- At 320 px width, no horizontal page or sheet overflow.
- Reduced-motion preference removes nonessential transition animation.
