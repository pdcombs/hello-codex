# UI Contract: Previous Vote History

## Code modal

- Show **View previous votes** only when server says current identity has history.
- Action ignores code input/error, performs no code request, closes modal, navigates to `/events/:publicId/votes`.
- Existing focus trap/pending lock/cancel behavior remains.

## History page

- Event title, status, Back to event.
- Ballot articles newest first with submitted time.
- Category headings; selection lists; ordered list for ranking; explicit No selection.
- Loading, empty, first-page failure/retry, next-page failure/retry.
- **Load more votes** appends/deduplicates without moving focus.
- Open eligible history may show **Cast another vote**; closed history never does.

## Accessibility

- Semantic articles, headings, lists, time elements, live status.
- Keyboard controls and visible focus.
- No horizontal overflow at 320 CSS pixels or 200% zoom.
