# Quickstart

1. Run `npm test -- --run tests/component/analytics.test.jsx` from `votiy-web`.
2. Run `npm run lint` and `npm run build` from `votiy-web`.
3. Run `./node_modules/.bin/playwright test tests/e2e/analytics-privacy.spec.js` from repository root.
4. Verify fresh and declined sessions queue `page_view`, `button_click`, and `unhappy_path` with denied analytics storage and no prohibited values.
5. Verify accepted session grants analytics storage while advertising consent remains denied.
6. Production smoke through GA4 Realtime/DebugView; expect cookie-free visitor/session totals to be less precise.

Rollback by reverting feature commit; no data migration exists.
