# Changelog

All notable changes to `@amjadiqbal/shopify-app-tanstack-start` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.1] - 2026-10-23

### Fixed

- Removed a stray `console.log` of `config.future.expiringOfflineAccessTokens` (inherited from upstream) that ran on every
  token exchange.
- `complianceWebhooks()`: a handler that throws no longer escapes. The webhook is answered with 500 so Shopify retries,
  the shop's sessions are kept, and the new `onError` option (default `console.error`) receives the error.

### Documentation

- README: the App Bridge JSX types file needed for `<s-app-nav>` with React 19.
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
