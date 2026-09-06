# Feature Specification: Event QR Download

**Feature Branch**: `024-event-qr-download`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Add a QR code for each event short link in settings, with a button beside Save Short URL that downloads the QR code as a PNG."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Download Event QR Code (Priority: P1)

Event host downloads a PNG QR code representing event's saved short link from event settings.

**Why this priority**: Host can print or share scannable event access without manually creating QR assets.

**Independent Test**: Open event settings, click Download QR Code, inspect downloaded PNG, scan it, and verify it opens correct event through saved short link.

**Acceptance Scenarios**:

1. **Given** event has saved alias `myevent`, **When** host clicks Download QR Code, **Then** browser downloads PNG encoding `https://www.votiy.com/myevent`.
2. **Given** downloaded PNG is scanned, **When** device opens encoded URL, **Then** visitor reaches event through existing short-link flow.
3. **Given** host downloads QR code on supported mobile or desktop browser, **When** download completes, **Then** file is a valid, readable PNG.

---

### User Story 2 - Understand QR Destination (Priority: P2)

Event host can see QR code and its destination alongside short-link controls before downloading it.

**Why this priority**: Visible destination reduces risk of distributing QR code for wrong event.

**Independent Test**: Load settings for known alias and verify displayed QR destination matches saved short link exactly.

**Acceptance Scenarios**:

1. **Given** settings loads saved alias, **When** QR area renders, **Then** visible QR code represents exact displayed production short URL.
2. **Given** host changes alias text but has not saved it, **When** viewing or downloading QR code, **Then** QR continues using saved alias and interface indicates alias must be saved before new QR is available.
3. **Given** host successfully saves new alias, **When** settings updates, **Then** QR code and download use new alias immediately.

### Edge Cases

- QR generation or browser download failure shows clear error and does not affect saved short link.
- Repeated clicks produce valid equivalent PNG downloads without changing event data.
- Longest permitted alias remains scannable at rendered and downloaded size.
- Alias characters are encoded exactly once and never create a different destination.
- Missing saved alias disables download and explains why, though migrated and new events normally always have aliases.
- Download remains usable with keyboard and screen-reader navigation.

## Scope Boundaries *(mandatory)*

### In Scope

- Visible event QR code in host short-link settings.
- Download QR Code action beside Save Short URL action.
- PNG download encoding fixed production prefix plus saved alias.
- Refresh QR after successful alias save.
- Loading, disabled, and failure states.
- Mobile and desktop browser support.

### Out of Scope

- QR code upload or persistent image storage.
- Custom QR colors, logos, frames, sizes, or alternate file formats.
- QR codes in email, public event page, exports, or server-generated documents.
- Scan analytics, expiration, dynamic redirects, or tracking parameters.
- Changing short-link validation or routing behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Event settings MUST show a QR code derived from event's currently saved short-link alias.
- **FR-002**: QR destination MUST equal `https://www.votiy.com/{savedAlias}` exactly.
- **FR-003**: Event settings MUST show Download QR Code beside Save Short URL.
- **FR-004**: Download action MUST produce a PNG containing displayed QR code.
- **FR-005**: Downloaded QR code MUST resolve to same destination shown in settings.
- **FR-006**: Unsaved alias edits MUST NOT alter displayed or downloaded QR destination.
- **FR-007**: When alias has unsaved changes, interface MUST clearly tell host to save before downloading QR for new alias.
- **FR-008**: Successful alias save MUST update displayed and downloadable QR destination without page reload.
- **FR-009**: QR generation and download MUST occur without creating or storing a separate event image record.
- **FR-010**: QR download failure MUST show actionable error without changing event or alias data.
- **FR-011**: QR image and download control MUST provide accessible names and keyboard operation.
- **FR-012**: Downloaded filename MUST identify event alias and PNG format without unsafe path characters.
- **FR-013**: QR code MUST remain reliably scannable for every permitted alias length on current supported mobile and desktop devices.
- **FR-014**: Only host settings users MUST see QR management controls; existing short-link visitor access remains unchanged.

### Key Entities

- **QR Destination**: Fixed production website prefix combined with event's saved alias.
- **QR Download**: Temporary PNG representation generated for host download; not persisted as event data.
- **Event Short Link**: Existing host-controlled alias used as QR destination ending.

### Ownership and Access

- Event host may view and download event QR code through existing protected settings screen.
- QR file contains public event link only and introduces no new private event data.
- Visitors scanning QR retain existing event visibility and access restrictions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of QR downloads in acceptance tests encode exact saved production short URL.
- **SC-002**: Host can download event QR code within 10 seconds and two interactions after opening short-link settings.
- **SC-003**: QR codes for minimum and maximum permitted alias lengths scan successfully on supported mobile and desktop test devices.
- **SC-004**: Unsaved, invalid, or failed alias changes produce zero QR codes pointing to unavailable new aliases.
- **SC-005**: QR generation and download create zero additional persisted event records or uploaded image assets.
- **SC-006**: Keyboard-only user can reach and activate download control in 100% of supported-browser accessibility tests.

### Critical User Flows *(mandatory)*

- **CUF-001**: Host opens settings, confirms saved short URL, downloads PNG QR code, scans it, and reaches correct event.
- **CUF-002**: Host edits alias, saves successfully, downloads refreshed QR code, and reaches event through new short URL.

## Assumptions

- Exact production prefix is `https://www.votiy.com/` in every environment, including local development.
- QR represents saved alias, not unsaved text, because unsaved destination may not resolve.
- Existing host authorization and short-link behavior remain authoritative.
- Browser-native PNG download is supported by current target browsers.
- Default filename follows `votiy-{alias}-qr.png` or equivalent safe, recognizable naming.
