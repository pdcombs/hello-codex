# Quickstart: Site Usage Analytics and Privacy

## Local validation

Run web/API tests and builds. Confirm consent/footer/privacy UI works on localhost while no Google script or production event exists. Exercise normalization, button mapping, alerts, and preference changes in component tests.

## Production smoke

On both approved domains, use a fresh private session. Verify the notice, consent changes, normalized page views, catalog values, and no raw IDs, aliases, queries, or PII in GA4 Realtime/DebugView. Confirm non-production hosts do not load the tag.

## Rollback

Revert the feature commit and redeploy. No database rollback is required.
