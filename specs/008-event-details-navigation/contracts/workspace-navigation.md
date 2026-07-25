# Event Workspace Navigation Contract

## Canonical owner routes

| Route | Active control | Content |
|-------|----------------|---------|
| `/events/:publicId` | Entries | Existing category/entry list and add/edit actions |
| `/events/:publicId/participants` | Participants | Existing participant cards and create flow |
| `/events/:publicId/results` | Results (coming soon) | `🎉 Feature Coming Soon` |
| `/events/:publicId/settings` | None | Existing voting rules and conditional code manager |

## Shared content-view shell

Entries, Participants, and Results render:

1. Photo or stable fallback at top left.
2. Category, participant, and entry analytics.
3. Right-aligned Settings control for owner.
4. Title, optional description, and optional location.
5. Three controls in Entries, Participants, Results order.
6. Route-selected content.

Settings renders a Back control and settings content without summary/tabs.

## Navigation behavior

- Base URL redirects nowhere; it is canonical Entries.
- Existing Participants URL remains unchanged.
- Results and Settings support direct load, refresh, browser back/forward, and opening in a new tab.
- Unknown fourth-level event routes use standard not-found behavior.
- Active state comes from URL, never duplicated local state.
- Back from Settings navigates to base Entries route.

## Accessibility

- Tab controls have accessible names, visible focus, selected state, and associated content.
- Keyboard activation changes URL/content.
- Route change focuses page title or main content using existing route-focus behavior.
- Photo trigger names the event; dialog has title, close control, focus trap, Escape close, backdrop close,
  and focus return.
- Replace/Delete appear only for owner. Delete opens an alert dialog with Cancel initially focused.
- Loading uses status semantics; failures use alerts; photo upload progress is announced.

## Compatibility

- Existing category, entry, participant, voting, registration, and ballot actions remain unchanged.
- Existing non-owner public event route remains available and gains only safe photo display/preview.
- Analytics counts are public read-only event facts; they expose no owner identity or mutation capability.
- Non-host and anonymous viewers never receive owner category, entry, participant, photo-management, or
  settings controls. Direct mutation attempts remain denied by server ownership checks.
- Existing participant bookmarks continue to resolve.
