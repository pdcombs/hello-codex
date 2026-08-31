# UI Contract: Event Ballot

## Route

`/events/:publicId/vote` loads server-authorized ballot view. Prior navigation decision never grants direct-load access.

## States

- Loading: ballot view resolving.
- Denied/closed/unavailable: actionable error and event link.
- Editable: event heading, instructions, category sections, sticky **Submit vote**.
- Invalid: focused summary/category guidance; selections preserved.
- Confirming: accessible modal bottom sheet; cancel initially focused; Escape/backdrop cancel; focus trapped/restored.
- Submitting: controls and duplicate confirmation locked.
- Complete/revisit: top completion status; server-saved ballot read-only.
- Repeat eligible: explicit **Cast another vote** starts new attempt; prior ballot stays immutable.

## Category controls

- Category uses `fieldset` and `legend`.
- Single: optional radio group.
- Multiple: checkboxes with limits/count help; blank allowed.
- Ranking: **Rank this category** initializes full ordered list; entry-specific move controls; **Clear ranking** returns blank.
- Read-only: semantic list showing saved titles/order; no interactive choice controls.

## Sticky action

- Exact title: **Submit vote**.
- Visible only editable; viewport bottom with safe-area padding and matching content clearance.
- Empty ballot announces “Select at least one entry before submitting your vote.” and does not open sheet.

## Confirmation

- `role="alertdialog"`, modal, labelled and described.
- Warning: “Are you sure? You will not be able to redo your vote after submitting.”
- Actions: **Cancel**, **Submit vote**.

## Privacy

Choice data appears only from authorized ballot view/submission response. Host/public event views never receive individual choices.
