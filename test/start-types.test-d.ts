import {MemorySessionStorage} from '@shopify/shopify-app-session-storage-memory';
import {createMiddleware, createServerFn} from '@tanstack/react-start';
import {expectTypeOf, test} from 'vitest';

import {ApiVersion, type Session, shopifyApp} from '../src/server';

const shopify = shopifyApp({
  apiKey: 'key',
  apiSecretKey: 'secret',
  appUrl: 'https://app.example.com',
  apiVersion: ApiVersion.July26,
  sessionStorage: new MemorySessionStorage(),
});

// The one-line wrappers the README tells users to write.
const documentMiddleware = createMiddleware().server(async (ctx) =>
  ctx.next({context: await shopify.middleware.document(ctx, {exclude: ['/public']})}),
);
const adminMiddleware = createMiddleware({type: 'function'}).server(async (ctx) =>
  ctx.next({context: await shopify.middleware.admin(ctx)}),
);
const webhookMiddleware = createMiddleware().server(async (ctx) =>
  ctx.next({context: await shopify.middleware.webhook(ctx)}),
);
const appProxyMiddleware = createMiddleware().server(async (ctx) =>
  ctx.next({context: await shopify.middleware.appProxy(ctx)}),
);

test('the admin middleware puts the admin context on server function context', () => {
  createServerFn()
    .middleware([adminMiddleware])
    .handler(({context}) => {
      expectTypeOf(context.session).toEqualTypeOf<Session>();
      expectTypeOf(context.admin.graphql).toBeFunction();
      expectTypeOf(context.billing.require).toBeFunction();
      expectTypeOf(context.redirect).toBeFunction();
      expectTypeOf(context.cors).toBeFunction();
      return null;
    });
});

test('the document middleware context is typed', () => {
  createMiddleware()
    .middleware([documentMiddleware])
    .server(({context, next}) => {
      expectTypeOf(context.shopifyAdmin?.session).toEqualTypeOf<Session | undefined>();
      return next();
    });
});

test('server route middleware puts webhook and app proxy contexts on context', () => {
  createMiddleware()
    .middleware([webhookMiddleware, appProxyMiddleware])
    .server(({context, next}) => {
      expectTypeOf(context.webhook.topic).toEqualTypeOf<string>();
      expectTypeOf(context.webhook.shop).toEqualTypeOf<string>();
      expectTypeOf(context.appProxy.liquid).toBeFunction();
      return next();
    });
});

test('route handlers take a Request and return a Response', () => {
  expectTypeOf(shopify.authRouteHandler).toEqualTypeOf<(request: Request) => Promise<Response>>();
  expectTypeOf(shopify.complianceWebhooks()).toEqualTypeOf<(request: Request) => Promise<Response>>();
});
