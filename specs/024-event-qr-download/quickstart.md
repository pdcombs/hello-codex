# Quickstart: Validate Event QR Download

## Prerequisites

- Install workspace dependencies.
- Start local API and UI.
- Sign in as event host and open event settings for event with saved short alias.

## Automated validation

```sh
pnpm --dir votiy-web test -- tests/component/event-short-link.test.jsx
pnpm --dir votiy-web lint
pnpm --dir votiy-web build
```

Expected: component tests pass, lint reports no errors, production build completes.

## Manual critical flow

1. Open host event settings.
2. Confirm QR preview and visible destination use `https://www.votiy.com/{savedAlias}`.
3. Click `Download QR Code` beside `Save short URL`.
4. Confirm downloaded file has `.png` suffix and opens as valid image.
5. Scan PNG with phone and confirm correct production short URL opens.
6. Edit alias without saving. Confirm QR destination remains previous saved URL and unsaved notice appears.
7. Save valid new alias. Confirm preview/destination update without page reload; download and scan new PNG.
8. Test Download button with keyboard.

## Failure validation

Force canvas export failure in component test. Confirm alert appears and no alias save or event mutation occurs.

## Production smoke

After deployment, open one host settings page, confirm QR destination uses `www.votiy.com`, download PNG, and scan it. Existing `/ready` check must stay healthy.
