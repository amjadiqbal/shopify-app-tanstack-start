# Changelog

All notable changes to `@amjadiqbal/shopify-app-tanstack-start` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.2] - 2026-10-23

### Fixed

- A webhook, Flow or fulfillment service request whose body passes the HMAC check but is not JSON now gets 400 instead
  of an uncaught `JSON.parse` error.
- `complianceWebhooks()`: an error thrown by `onError` itself is logged with `console.error` and the answer is still
  500, instead of escaping the route.

### Documentation

- README: `isEmbeddedApp` is rejected whatever its value; `login()` exists only for App Store and single-merchant apps;
  the app proxy timestamp window is 90 seconds in either direction; the document middleware handles GET and HEAD;
  session cleanup failures also go through `onError`; a CSRF check of the README setup in the test app.

## [0.1.1] - 2026-10-23

### Fixed

- Removed a stray `console.log` of `config.future.expiringOfflineAccessTokens` (inherited from upstream) that ran on every
  token exchange.
- `complianceWebhooks()`: a handler that throws no longer escapes. The webhook is answered with 500 so Shopify retries,
  the shop's sessions are kept, and the new `onError` option (default `console.error`) receives the error.

### Documentation

- README: the App Bridge JSX types file needed for `<s-app-nav>` with React 19.
- README: `src/start.ts` now registers Start's CSRF middleware next to the document middleware (Start warns without it).
- README: a Scope section (embedded apps only, token exchange instead of the authorization-code flow, what `login()`
  does), exactly when the document middleware sets headers, how app proxy requests are skipped, every compliance
  webhook status code, who checks app proxy timestamps, which session adapters and features were tested and how.

## [0.1.0] - 2026-10-23

### Added

- `shopifyApp()` for TanStack Start, with the server API of `@shopify/shopify-app-react-router` 4.0.0: `authenticate.admin`
  (session tokens, token exchange, bounce and exit-iframe pages), `authenticate.webhook`, `authenticate.flow`,
  `authenticate.fulfillmentService`, `authenticate.pos`, `authenticate.public.appProxy`, `.checkout`,
  `.customerAccount`, `unauthenticated.admin` and `.storefront`, billing, scopes, `registerWebhooks`, `login`.
- TanStack Start middleware bodies: `middleware.document` (global; frame-ancestors headers and page authentication),
  `middleware.admin` (server functions), `middleware.webhook` and `middleware.appProxy` (server routes).
- `authRouteHandler()` for the `/auth/$` route and `complianceWebhooks()` for the mandatory compliance topics.
- Responses thrown by billing, `redirect()` and authentication become router redirects in server functions, or a
  `ShopifyResponseError` while a page server-renders.
- `@amjadiqbal/shopify-app-tanstack-start/react`: `appBridgeHead()` and `AppProvider` (App Bridge navigation through
  TanStack Router).
