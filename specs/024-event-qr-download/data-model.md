# Data Model: Event QR Download

No persistent model changes.

## QR Destination

- `prefix`: fixed `https://www.votiy.com/`
- `savedAlias`: persisted event short-link alias
- `url`: exact concatenation of prefix and saved alias
- Validation: alias must exist before preview or download is available
- Ownership: derived from host-owned event; contains public link only

## QR Download

- `format`: PNG
- `filename`: safe recognizable value such as `votiy-{savedAlias}-qr.png`
- `content`: transient bitmap encoding QR Destination URL
- Lifecycle: generated in browser on render/download, never persisted or uploaded

## State Transitions

1. Settings load: saved alias establishes QR destination and preview.
2. Alias input edited: QR destination remains bound to prior saved alias; unsaved notice appears.
3. Alias save succeeds: parent event refresh updates saved alias, QR destination, preview, and filename.
4. Download activated: transient PNG generated and offered to browser.
5. Generation fails: alert shown; saved alias and event remain unchanged.
