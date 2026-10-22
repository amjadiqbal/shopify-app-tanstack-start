import {type BillingConfigSubscriptionLineItemPlan, BillingInterval, Session} from '@shopify/shopify-api';
import {createSHA256HMAC, HashFormat} from '@shopify/shopify-api/runtime';
import {MemorySessionStorage} from '@shopify/shopify-app-session-storage-memory';
import {isRedirect} from '@tanstack/react-router';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {
  API_SECRET_KEY,
  APP_URL,
  BASE64_HOST,
  GRAPHQL_URL,
  getHmac,
  getJwt,
  mockExternalRequest,
  setUpValidSession,
  TEST_SHOP,
  testConfig,
} from '../src/core/__test-helpers';
import {ShopifyResponseError, shopifyApp} from '../src/server';
import {fetchMock} from './fetch-mock';

// Start's request helpers only work inside a running Start request, so the tests stand in for them.
const start = vi.hoisted(() => ({request: undefined as Request | undefined, headers: new Map<string, string>()}));
vi.mock('@tanstack/react-start/server', () => ({
  getRequest: () => {
    if (!start.request) throw new Error('getRequest() called outside a request');
    return start.request;
  },
  setResponseHeader: (name: string, value: string) => start.headers.set(name.toLowerCase(), value),
}));

beforeEach(() => {
  start.request = undefined;
  start.headers.clear();
});

function setup() {
  const sessionStorage = new MemorySessionStorage();
  const shopify = shopifyApp(testConfig({sessionStorage}));
  return {shopify, sessionStorage};
}

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject');
}

async function caughtResponse(promise: Promise<unknown>): Promise<Response> {
  const error = await caught(promise);
  expect(error).toBeInstanceOf(Response);
  return error as Response;
}

async function adminPageUrl(path = '/') {
  const {token} = await getJwt();
  const url = new URL(path, APP_URL);
  url.searchParams.set('embedded', '1');
  url.searchParams.set('shop', TEST_SHOP);
  url.searchParams.set('host', BASE64_HOST);
  url.searchParams.set('id_token', token);
  return url;
}

describe('authRouteHandler', () => {
  it('serves the session token bounce page', async () => {
    const {shopify} = setup();
    const url = new URL('/auth/session-token', APP_URL);
    url.searchParams.set('shop', TEST_SHOP);
    url.searchParams.set('host', BASE64_HOST);
    url.searchParams.set('shopify-reload', `${APP_URL}/?shop=${TEST_SHOP}`);

    const response = await shopify.authRouteHandler(new Request(url));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/html;charset=utf-8');
    expect(await response.text()).toContain('src="https://cdn.shopify.com/shopifycloud/app-bridge.js"');
  });

  it('serves the exit-iframe page for a Shopify admin destination', async () => {
    const {shopify} = setup();
    const destination = `https://admin.shopify.com/store/${TEST_SHOP.replace('.myshopify.com', '')}/charges/1/confirm`;
    const url = new URL('/auth/exit-iframe', APP_URL);
    url.searchParams.set('shop', TEST_SHOP);
    url.searchParams.set('host', BASE64_HOST);
    url.searchParams.set('exitIframe', destination);

    const response = await shopify.authRouteHandler(new Request(url));

    expect(response.status).toBe(200);
    expect(await response.text()).toContain(`window.open(${JSON.stringify(destination)}, "_top")`);
  });

  it('refuses an exit-iframe redirect to another site', async () => {
    const {shopify} = setup();
    const url = new URL('/auth/exit-iframe', APP_URL);
    url.searchParams.set('shop', TEST_SHOP);
    url.searchParams.set('host', BASE64_HOST);
    url.searchParams.set('exitIframe', 'https://evil.example.com/');

    await expect(shopify.authRouteHandler(new Request(url))).rejects.toThrow('Invalid exit-iframe destination');
  });

  it('honours a custom authPathPrefix', async () => {
    const shopify = shopifyApp(testConfig({sessionStorage: new MemorySessionStorage(), authPathPrefix: '/shopify'}));
    const url = new URL('/shopify/session-token', APP_URL);
    url.searchParams.set('shop', TEST_SHOP);
    url.searchParams.set('host', BASE64_HOST);

    const response = await shopify.authRouteHandler(new Request(url));

    expect(response.status).toBe(200);
  });
});

describe('middleware.document', () => {
  it('leaves server function requests alone', async () => {
    const {shopify} = setup();
    const request = new Request(await adminPageUrl());

    expect(await shopify.middleware.document({request, handlerType: 'serverFn'})).toEqual({shopifyAdmin: undefined});
    expect(start.headers.size).toBe(0);
  });

  it('leaves non-GET requests, the auth path and excluded paths alone', async () => {
    const {shopify} = setup();
    const url = await adminPageUrl();

    for (const [request, exclude] of [
      [new Request(url, {method: 'POST'}), []],
      [new Request(new URL(`/auth/session-token${url.search}`, APP_URL)), []],
      [new Request(new URL(`/public/terms${url.search}`, APP_URL)), ['/public']],
      [new Request(new URL(`/legal${url.search}`, APP_URL)), [/^\/legal/]],
    ] as const) {
      const context = await shopify.middleware.document({request, handlerType: 'router'}, {exclude: [...exclude]});
      expect(context).toEqual({shopifyAdmin: undefined});
    }
    expect(start.headers.size).toBe(0);
  });

  it('leaves signed app proxy requests to their own middleware', async () => {
    const {shopify} = setup();
    const url = new URL('/proxy/page', APP_URL);
    url.searchParams.set('shop', TEST_SHOP);
    url.searchParams.set('path_prefix', '/apps/page');
    url.searchParams.set('signature', 'checked-by-the-app-proxy-middleware');

    const context = await shopify.middleware.document({request: new Request(url), handlerType: 'router'});

    expect(context).toEqual({shopifyAdmin: undefined});
    expect(start.headers.size).toBe(0);
  });

  it('answers a page opened outside the admin with the App Bridge page', async () => {
    const {shopify} = setup();

    const response = await caughtResponse(
      shopify.middleware.document({request: new Request(`${APP_URL}/products`), handlerType: 'router'}),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/html;charset=utf-8');
    expect(await response.text()).toContain('app-bridge.js');
  });

  it('authenticates an embedded admin page load and sets frame-ancestors', async () => {
    const {shopify, sessionStorage} = setup();
    const session = await setUpValidSession(sessionStorage);

    const context = await shopify.middleware.document({
      request: new Request(await adminPageUrl('/products')),
      handlerType: 'router',
    });

    expect(context.shopifyAdmin?.session).toEqual(session);
    expect(context.shopifyAdmin?.sessionToken?.dest).toBe(`https://${TEST_SHOP}`);
    expect(start.headers.get('content-security-policy')).toBe(
      `frame-ancestors https://${TEST_SHOP} https://admin.shopify.com https://*.spin.dev https://admin.myshopify.io https://admin.shop.dev;`,
    );
    expect(start.headers.get('link')).toContain('app-bridge.js');
  });

  it('redirects an embedded page load without a session token to the bounce page', async () => {
    const {shopify} = setup();
    const url = await adminPageUrl('/products');
    url.searchParams.delete('id_token');

    const response = await caughtResponse(
      shopify.middleware.document({request: new Request(url), handlerType: 'router'}),
    );

    expect(response.status).toBe(302);
    const location = new URL(response.headers.get('location')!, APP_URL);
    expect(location.pathname).toBe('/auth/session-token');
    expect(location.searchParams.get('shopify-reload')).toBe(`${APP_URL}/products?${url.searchParams.toString()}`);
  });

  it('redirects a page load outside the admin into the admin', async () => {
    const {shopify} = setup();
    const url = await adminPageUrl();
    url.searchParams.delete('embedded');
    url.searchParams.delete('id_token');

    const response = await caughtResponse(
      shopify.middleware.document({request: new Request(url), handlerType: 'router'}),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toMatch(/^https:\/\/.*\/apps\/testApiKey/);
  });
});

describe('middleware.admin', () => {
  it("reuses the document middleware's context during server rendering", async () => {
    const {shopify, sessionStorage} = setup();
    await setUpValidSession(sessionStorage);
    const {shopifyAdmin} = await shopify.middleware.document({
      request: new Request(await adminPageUrl()),
      handlerType: 'router',
    });

    start.request = new Request(await adminPageUrl());
    const fetchesBefore = fetchMock.mock.calls.length;

    const context = await shopify.middleware.admin({context: {shopifyAdmin}});

    expect(context.session).toBe(shopifyAdmin?.session);
    expect(context.sessionToken).toBe(shopifyAdmin?.sessionToken);
    expect(fetchMock.mock.calls.length).toBe(fetchesBefore);
  });

  it('authenticates a server function call with the session token header', async () => {
    const {shopify, sessionStorage} = setup();
    const session = await setUpValidSession(sessionStorage);
    const {token} = await getJwt();
    start.request = new Request(`${APP_URL}/_serverFn/abc`, {
      method: 'POST',
      headers: {authorization: `Bearer ${token}`},
    });

    const context = await shopify.middleware.admin({context: {}});

    expect(context.session).toEqual(session);
    expect(typeof context.admin.graphql).toBe('function');
    expect(typeof context.billing.require).toBe('function');
  });

  it('answers an invalid session token with the 401 App Bridge retries', async () => {
    const {shopify} = setup();
    start.request = new Request(`${APP_URL}/_serverFn/abc`, {
      method: 'POST',
      headers: {authorization: 'Bearer not-a-jwt'},
    });

    const response = await caughtResponse(shopify.middleware.admin({context: {}}));

    expect(response.status).toBe(401);
    expect(response.headers.get('X-Shopify-Retry-Invalid-Session-Request')).toBe('1');
  });

  it('turns any other Response into a ShopifyResponseError while a page is server-rendered', async () => {
    const {shopify} = setup();
    start.request = new Request(`${APP_URL}/settings`);

    const error = await caught(shopify.middleware.admin({context: {shopifyAdmin: undefined}}));

    expect(error).toBeInstanceOf(ShopifyResponseError);
    expect((error as ShopifyResponseError).status).toBe(200);
    expect((error as Error).message).toContain('while rendering /settings');
  });

  it('turns a redirect into a router redirect while a page is server-rendered', async () => {
    const {shopify} = setup();
    const url = await adminPageUrl('/settings');
    url.searchParams.delete('id_token');
    start.request = new Request(url);

    const error = await caught(shopify.middleware.admin({context: {shopifyAdmin: undefined}}));

    expect(isRedirect(error)).toBe(true);
    const redirect = error as Response & {options: {href: string; statusCode: number}};
    expect(redirect.options.statusCode).toBe(302);
    expect(redirect.options.href).toMatch(/^\/auth\/session-token\?/);
  });
});

describe('admin context helpers inside server functions', () => {
  const BILLING: Record<string, BillingConfigSubscriptionLineItemPlan> = {
    Pro: {lineItems: [{amount: 9, currencyCode: 'USD', interval: BillingInterval.Every30Days}]},
  };

  function mockPurchase() {
    return mockExternalRequest({
      request: new Request(GRAPHQL_URL, {method: 'POST', body: 'test'}),
      response: new Response(
        JSON.stringify({
          data: {
            appSubscriptionCreate: {
              userErrors: [],
              confirmationUrl: 'https://admin.shopify.com/store/shop/charges/confirm',
              appSubscription: {id: 'gid://shopify/AppSubscription/1'},
            },
          },
        }),
      ),
    });
  }

  async function adminContext(request: Request) {
    const sessionStorage = new MemorySessionStorage();
    const shopify = shopifyApp(testConfig({sessionStorage, billing: BILLING}));
    await setUpValidSession(sessionStorage);
    start.request = request;
    return shopify.middleware.admin({context: {}});
  }

  it('turns billing.request() into a router redirect to the exit-iframe page while server rendering', async () => {
    const context = await adminContext(new Request(await adminPageUrl('/billing')));
    await mockPurchase();

    const error = await caught(context.billing.request({plan: 'Pro', isTest: true}));

    expect(isRedirect(error)).toBe(true);
    const href = new URL((error as Response & {options: {href: string}}).options.href, APP_URL);
    expect(href.pathname).toBe('/auth/exit-iframe');
    expect(href.searchParams.get('exitIframe')).toBe('https://admin.shopify.com/store/shop/charges/confirm');
  });

  it('leaves the 401 reauthorize Response for App Bridge when called from the browser', async () => {
    const {token} = await getJwt();
    const context = await adminContext(
      new Request(`${APP_URL}/_serverFn/abc`, {method: 'POST', headers: {authorization: `Bearer ${token}`}}),
    );
    await mockPurchase();

    const response = await caughtResponse(context.billing.request({plan: 'Pro', isTest: true}));

    expect(response.status).toBe(401);
    expect(response.headers.get('X-Shopify-API-Request-Failure-Reauthorize-Url')).toBe(
      'https://admin.shopify.com/store/shop/charges/confirm',
    );
  });

  it('returns a router redirect from redirect() for an in-app path', async () => {
    const context = await adminContext(new Request(await adminPageUrl('/billing')));

    const result = context.redirect('/settings');

    expect(isRedirect(result)).toBe(true);
    expect(new URL((result as Response & {options: {href: string}}).options.href).pathname).toBe('/settings');
  });
});

function webhookRequest(topic: string, body: object, hmac?: string) {
  const raw = JSON.stringify(body);
  return new Request(`${APP_URL}/webhooks`, {
    method: 'POST',
    body: raw,
    headers: {
      'X-Shopify-Shop-Domain': TEST_SHOP,
      'X-Shopify-Topic': topic,
      'X-Shopify-API-Version': '2026-07',
      'X-Shopify-Webhook-Id': 'webhook-1',
      'X-Shopify-Hmac-Sha256': hmac ?? getHmac(raw),
    },
  });
}

describe('middleware.webhook', () => {
  it('returns the verified webhook', async () => {
    const {shopify} = setup();

    const {webhook} = await shopify.middleware.webhook({request: webhookRequest('products/update', {id: 1})});

    expect(webhook.topic).toBe('PRODUCTS_UPDATE');
    expect(webhook.shop).toBe(TEST_SHOP);
    expect(webhook.payload).toEqual({id: 1});
  });

  it('rejects a bad HMAC with 401', async () => {
    const {shopify} = setup();

    const response = await caughtResponse(
      shopify.middleware.webhook({request: webhookRequest('products/update', {id: 1}, 'bad')}),
    );

    expect(response.status).toBe(401);
  });
});

describe('middleware.appProxy', () => {
  async function proxyUrl(sign = true) {
    const url = new URL('/proxy/hello', APP_URL);
    url.searchParams.set('shop', TEST_SHOP);
    url.searchParams.set('path_prefix', '/apps/hello');
    url.searchParams.set('timestamp', String(Math.trunc(Date.now() / 1000)));
    const message = [...url.searchParams.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('');
    url.searchParams.set('signature', sign ? await createSHA256HMAC(API_SECRET_KEY, message, HashFormat.Hex) : 'bad');
    return url;
  }

  it('verifies the signature and returns the proxy context', async () => {
    const {shopify, sessionStorage} = setup();
    const session = await setUpValidSession(sessionStorage);

    const {appProxy} = await shopify.middleware.appProxy({request: new Request(await proxyUrl())});

    expect(appProxy.session).toEqual(session);
    const liquid = appProxy.liquid('Hello {{ shop.name }}');
    expect(liquid.headers.get('content-type')).toBe('application/liquid');
  });

  it('rejects a bad signature', async () => {
    const {shopify} = setup();

    const response = await caughtResponse(shopify.middleware.appProxy({request: new Request(await proxyUrl(false))}));

    expect(response.status).toBe(400);
  });
});

describe('complianceWebhooks', () => {
  it('answers 401 to a bad HMAC without calling handlers', async () => {
    const {shopify} = setup();
    const customersRedact = vi.fn();

    const response = await shopify.complianceWebhooks({customersRedact})(
      webhookRequest('customers/redact', {customer: {id: 1}}, 'bad'),
    );

    expect(response.status).toBe(401);
    expect(customersRedact).not.toHaveBeenCalled();
  });

  it.each([
    ['customers/data_request', 'customersDataRequest'],
    ['customers/redact', 'customersRedact'],
  ] as const)('calls the %s handler and answers 200', async (topic, handler) => {
    const {shopify} = setup();
    const handlers = {customersDataRequest: vi.fn(), customersRedact: vi.fn()};

    const response = await shopify.complianceWebhooks(handlers)(webhookRequest(topic, {customer: {id: 1}}));

    expect(response.status).toBe(200);
    expect(handlers[handler]).toHaveBeenCalledOnce();
    expect(handlers[handler].mock.calls[0]![0].payload).toEqual({customer: {id: 1}});
  });

  it.each([
    ['shop/redact', 'shopRedact'],
    ['app/uninstalled', 'appUninstalled'],
  ] as const)('calls the %s handler and deletes the shop sessions', async (topic, handler) => {
    const {shopify, sessionStorage} = setup();
    await sessionStorage.storeSession(new Session({id: 'offline_x', shop: TEST_SHOP, state: '', isOnline: false}));
    await sessionStorage.storeSession(new Session({id: 'online_x', shop: TEST_SHOP, state: '', isOnline: true}));
    await sessionStorage.storeSession(
      new Session({id: 'other', shop: 'other.myshopify.com', state: '', isOnline: false}),
    );
    const spy = vi.fn();

    const response = await shopify.complianceWebhooks({[handler]: spy})(webhookRequest(topic, {shop_id: 1}));

    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledOnce();
    expect(await sessionStorage.findSessionsByShop(TEST_SHOP)).toEqual([]);
    expect(await sessionStorage.findSessionsByShop('other.myshopify.com')).toHaveLength(1);
  });

  it('acknowledges other topics', async () => {
    const {shopify} = setup();
    const other = vi.fn();

    const response = await shopify.complianceWebhooks({other})(webhookRequest('orders/create', {id: 1}));

    expect(response.status).toBe(200);
    expect(other).toHaveBeenCalledOnce();
  });
});
