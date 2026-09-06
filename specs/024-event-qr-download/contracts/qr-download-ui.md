# UI Contract: Event QR Download

## Inputs

- Authenticated host settings context
- Event `shortId` persisted by existing short-link save flow
- Current editable alias value

## Derived values

- Destination: `https://www.votiy.com/${event.shortId}`
- Dirty state: normalized editable alias differs from persisted alias
- Filename: sanitized alias within recognizable PNG filename

## Render contract

- Show visible QR preview and destination for persisted alias.
- Show `Download QR Code` beside `Save short URL`.
- Download control remains tied to persisted alias during unsaved edits.
- Show notice that new alias must be saved before its QR becomes available.
- Archived host settings may download current QR but cannot save alias changes.

## Download contract

- Activation exports rendered QR as `image/png`.
- PNG encodes exact destination and receives safe `.png` filename.
- Button works by mouse, touch, and keyboard.
- Export failure renders local alert and performs no event mutation.

## Compatibility

- Existing alias save request and responses remain unchanged.
- Existing root short-link resolution remains unchanged.
- No new API operation, database document, cookie, secret, or environment variable.
