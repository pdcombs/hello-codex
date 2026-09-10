# Quickstart

1. Run analytics component tests from `votiy-web`.
2. Verify catalog names are unique, format-safe, no longer than 40 characters, and contain all dispatchable names.
3. Verify event-results navigation emits `page_view` with `/events/:eventId/results`.
4. Verify Open voting emits `click_open_voting_button`.
5. Verify service failure emits `error_service_unavailable`.
6. Verify dynamic labels and unknown errors use safe fallbacks.
7. Run full web tests, lint, build, and analytics privacy E2E test.
8. In GA Admin, register event-scoped custom dimension `page_route` using parameter `page_route`; verify in Realtime/DebugView before production report validation.

Rollback by reverting commit. Historical generic events remain unchanged.
