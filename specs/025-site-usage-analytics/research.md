# Research: Site Usage Analytics and Privacy

## Decisions

- Use official gtag.js directly with `send_page_view: false`; React Router sends one manual page view per navigation.
- Set consent defaults before config/tag insertion. All storage begins denied. Acceptance grants only analytics storage; decline retains cookieless measurement.
- Permit only cataloged fields. Routes come from patterns; unknown buttons become `Other button`; errors use categories, never raw messages.
- Use delegated button clicks, role-alert observation, and global error listeners with deduplication.
- Enable only exact production hosts. Expand CSP narrowly for Google tag/collection endpoints. Analytics failures never affect app behavior.
- Rely on GA4 browser/device/coarse geography; never request geolocation or fingerprint.

## Alternatives Rejected

- Wrapper package: unnecessary and does not solve privacy normalization.
- Static index tag: complicates consent ordering and production isolation.
- Raw DOM/error text: may contain PII or user content.
- Per-component-only tracking: omission risk conflicts with all-button coverage.
