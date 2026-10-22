# src/core

Adapted from Shopify's MIT-licensed `@shopify/shopify-app-react-router` 4.0.0 server code
(https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-app-react-router/src/server),
with React Router removed. See the third-party section of `LICENSE.md`.

Changes from upstream, so the code can be re-synced with later Shopify releases:

- `react-router`'s `redirect()` replaced by `redirect-response.ts`, which returns a plain `Response`.
- The React Router error boundary (`boundary/`) and the Node adapter (`adapters/`) are removed.
- The web-api adapter and runtime string are set inside `shopifyApp()` instead of at import time.
- Library name, user agent and version (`version.ts`) changed; JSDoc `@example` blocks (React Router code) removed.
- `override-logger.ts`: `deprecated()` only warns.
- Tests run on vitest (`vi` for `jest`, `vitest-fetch-mock` for `jest-fetch-mock`); a few un-awaited `rejects`
  assertions are now awaited.

This folder is excluded from Biome so diffs against upstream stay small.
