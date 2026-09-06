# Research: Event QR Download

## Client QR renderer

- **Decision**: Use `qrcode.react` and its canvas component.
- **Rationale**: Maintained React-focused package renders QR directly into DOM canvas, accepts accessible DOM properties, and allows PNG extraction through standard canvas API. Fits current client-only requirement with no backend work.
- **Alternatives considered**: `qrcode` supports browser and Node output but needs wrapper lifecycle code for React; custom QR implementation creates avoidable correctness risk; remote QR service adds network and privacy dependencies.

## PNG export

- **Decision**: Read rendered canvas, call `toDataURL('image/png')`, and activate temporary anchor with safe filename.
- **Rationale**: Native browser capability needs no image upload, filesystem permission, or second dependency.
- **Alternatives considered**: Server-generated PNG adds endpoint and storage complexity; SVG serialization does not satisfy required PNG output; screenshot libraries add large unrelated dependency.

## Alias source

- **Decision**: Derive QR destination from persisted `event.shortId`, never live input state.
- **Rationale**: Unsaved alias may be invalid, reserved, taken, or unresolved. Persisted value guarantees downloadable QR targets working link.
- **Alternatives considered**: Live preview risks distributing dead links; disabling all QR behavior during edits reduces utility without improving correctness.

## Production prefix

- **Decision**: Use exact constant `https://www.votiy.com/` independent of runtime origin.
- **Rationale**: Product explicitly requires production share URL even during local development.
- **Alternatives considered**: `window.location.host` would encode localhost during development and can encode legacy Render domain in production.

## Error and accessibility behavior

- **Decision**: Use button with explicit accessible label, QR image title, visible destination, and local alert when canvas export fails.
- **Rationale**: Host can verify destination and recover without event data mutation.
- **Alternatives considered**: Silent failure and unlabeled canvas fail product accessibility and error-state requirements.
