# UI Contract: Code Ballot Re-entry

## Completed ballot

- Show latest ballot read-only.
- While code voting is open, show **Cast another vote** regardless of consumed code or known inventory.
- Selecting it leaves review unchanged and opens code entry.

## New-code prompt

- Explain that every ballot needs a different unused code.
- Provide labeled input, Cancel, and submit.
- Invalid/used code keeps prompt open with actionable error.
- Cancel or Escape restores focus to trigger and preserves review.
- Pending state prevents duplicate action.

## Fresh ballot

- Appears only after successful new-code authorization.
- Starts blank/editable; previous ballot remains immutable.
- Successful submission makes new ballot the latest review.

## Accessibility

- Dialog traps/restores focus, announces errors, supports keyboard, and avoids overflow at 320 CSS pixels and 200% zoom.
