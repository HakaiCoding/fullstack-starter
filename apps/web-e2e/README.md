# Web E2E (`apps/web-e2e`)

Browser end-to-end tests for the Angular web app using Playwright.

## Browser Baseline

- Default: Chromium only (deterministic starter baseline)

## Run

```sh
npx playwright install chromium
npx nx e2e web-e2e
```

## Notes

- Playwright config starts the app via `npx nx run web:serve`.
- Add Firefox/WebKit projects later if cross-browser validation becomes necessary.
