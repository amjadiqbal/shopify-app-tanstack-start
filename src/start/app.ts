import {isRedirect, redirect as routerRedirect} from '@tanstack/react-router';
import {getRequest, setResponseHeader} from '@tanstack/react-start/server';
import type {AdminContext as CoreAdminContext} from '../core/authenticate/admin/types';
import type {AppProxyContext, AppProxyContextWithSession} from '../core/authenticate/public/appProxy/types';
import type {WebhookContext} from '../core/authenticate/webhooks/types';
import type {AppConfigArg} from '../core/config-types';
import {shopifyApp as createCoreApp} from '../core/shopify-app';
import type {ShopifyApp} from '../core/types';

import {type ComplianceWebhookHandlers, complianceWebhooksFactory} from './compliance';

/** What `authenticate.admin()` returns for this app's config. */
export type StartAdminContext<Config extends AppConfigArg> = CoreAdminContext<Config>;

/** The fields of TanStack Start's request middleware arguments that the helpers read. Pass Start's object as is. */
export interface RequestMiddlewareArgs {
  request: Request;
  handlerType?: 'serverFn' | 'router';
}

/** The fields of TanStack Start's function middleware arguments that the helpers read. Pass Start's object as is. */
export interface FunctionMiddlewareArgs {
  context?: unknown;
}

export interface DocumentMiddlewareOptions {
  /**
   * Paths the document middleware leaves alone: a string matches that path and everything under it, a RegExp is
   * tested against the pathname. The auth path prefix (`/auth` by default) is always excluded.
   */
  exclude?: (string | RegExp)[];
}

export interface DocumentContext<Config extends AppConfigArg> {
  /** Set when the request was an embedded admin page load and passed authentication. */
  shopifyAdmin: StartAdminContext<Config> | undefined;
}

/**
 * Bodies for TanStack Start middleware. Each one takes the object Start passes to `.server()` and returns the context
 * to hand to `next()`:
 *
 * ```ts
 * createMiddleware({ type: 'function' }).server(async (ctx) => ctx.next({ context: await shopify.middleware.admin(ctx) }))
 * ```
 */
export interface StartMiddleware<Config extends AppConfigArg> {
  /**
   * For a global request middleware (register it in `src/start.ts`). Every page request (GET or HEAD, not a server
   * function call) is treated as an embedded admin page: it gets the `Content-Security-Policy: frame-ancestors` and
   * preload headers Shopify requires and is authenticated with `authenticate.admin()`. A Response that throws (the
   * session token bounce redirect, the App Bridge page, the redirect into the admin) goes to the browser as is.
   *
   * Exclude pages and GET server routes that are not part of the embedded app with `options.exclude`. The auth path
   * prefix and signed app proxy requests are always left alone.
   */
  document: (args: RequestMiddlewareArgs, options?: DocumentMiddlewareOptions) => Promise<DocumentContext<Config>>;
  /**
   * For a server function middleware. It authenticates with `authenticate.admin()`, reusing the document
   * middleware's result while a page is server-rendered, and returns the admin context: `admin`, `session`,
   * `billing`, `redirect`, `cors`, `scopes`, `sessionToken`.
   */
  admin: (args: FunctionMiddlewareArgs) => Promise<StartAdminContext<Config>>;
  /** For a server route request middleware: verifies a webhook (HMAC) and returns `{ webhook }`. */
  webhook: (args: RequestMiddlewareArgs) => Promise<{webhook: WebhookContext<string>}>;
  /** For a server route request middleware: verifies an app proxy signature and returns `{ appProxy }`. */
  appProxy: (args: RequestMiddlewareArgs) => Promise<{appProxy: AppProxyContext | AppProxyContextWithSession}>;
}

export type ShopifyStartApp<Config extends AppConfigArg> = ShopifyApp<Config> & {
  /**
   * Handler for the auth splat route (`/auth/$` by default). It serves the session token bounce page and the
   * exit-iframe page that the admin flows redirect to.
   */
  authRouteHandler: (request: Request) => Promise<Response>;
  /**
   * Builds a POST handler for Shopify's mandatory compliance webhooks (`customers/data_request`, `customers/redact`,
   * `shop/redact`). It verifies the HMAC (401 when invalid), calls your handlers, deletes the shop's sessions on
   * `shop/redact` and `app/uninstalled`, and answers 200.
   */
  complianceWebhooks: (handlers?: ComplianceWebhookHandlers) => (request: Request) => Promise<Response>;
  /** Bodies for TanStack Start middleware. See the README for the one-line `createMiddleware()` wrappers. */
  middleware: StartMiddleware<Config>;
};

/** Shopify signs app proxy requests with `signature`; they have their own middleware. */
function isAppProxyRequest(url: URL) {
  return url.searchParams.has('signature') && url.searchParams.has('path_prefix');
}

/**
 * Creates the object your app uses to talk to Shopify, with TanStack Start helpers on top.
 *
 * ```ts
 * // src/shopify.server.ts
 * import { shopifyApp, ApiVersion } from '@amjadiqbal/shopify-app-tanstack-start/server';
 * import { MemorySessionStorage } from '@shopify/shopify-app-session-storage-memory';
 *
 * export const shopify = shopifyApp({
 *   apiKey: process.env.SHOPIFY_API_KEY!,
 *   apiSecretKey: process.env.SHOPIFY_API_SECRET!,
 *   appUrl: process.env.SHOPIFY_APP_URL!,
 *   scopes: process.env.SCOPES?.split(','),
 *   apiVersion: ApiVersion.July26,
 *   sessionStorage: new MemorySessionStorage(),
 * });
 * ```
 */
export function shopifyApp<Config extends AppConfigArg>(appConfig: Readonly<Config>): ShopifyStartApp<Config> {
  const app = createCoreApp(appConfig) as ShopifyApp<Config>;
  const authPathPrefix = appConfig.authPathPrefix || '/auth';
  const authenticateAdmin = app.authenticate.admin as (request: Request) => Promise<StartAdminContext<Config>>;

  async function authRouteHandler(request: Request): Promise<Response> {
    try {
      await authenticateAdmin(request);
    } catch (errorOrResponse) {
      if (errorOrResponse instanceof Response) return errorOrResponse;
      throw errorOrResponse;
    }
    // Authenticated, with no bounce or exit page to render: there is nothing to show at an auth path.
    return new Response(null, {status: 204});
  }

  function isExcluded(pathname: string, exclude: (string | RegExp)[]) {
    return [authPathPrefix, ...exclude].some((rule) =>
      typeof rule === 'string'
        ? pathname === rule || pathname.startsWith(rule.endsWith('/') ? rule : `${rule}/`)
        : rule.test(pathname),
    );
  }

  const middleware: StartMiddleware<Config> = {
    async document({request, handlerType}, options = {}) {
      const url = new URL(request.url);
      const isPage = handlerType !== 'serverFn' && (request.method === 'GET' || request.method === 'HEAD');
      if (!isPage || isExcluded(url.pathname, options.exclude ?? []) || isAppProxyRequest(url)) {
        return {shopifyAdmin: undefined};
      }

      const headers = new Headers();
      app.addDocumentResponseHeaders(request, headers);
      for (const [name, value] of headers) setResponseHeader(name, value);

      return {shopifyAdmin: await authenticateAdmin(request)};
    },

    async admin({context}) {
      const request = getRequest();
      const fromDocument = (context as Partial<DocumentContext<Config>> | undefined)?.shopifyAdmin;
      if (fromDocument) return withStartResponses(fromDocument, request);

      try {
        return withStartResponses(await authenticateAdmin(request), request);
      } catch (errorOrResponse) {
        throw toServerFunctionError(errorOrResponse, request);
      }
    },

    async webhook({request}) {
      return {webhook: await app.authenticate.webhook(request)};
    },

    async appProxy({request}) {
      return {appProxy: await app.authenticate.public.appProxy(request)};
    },
  };

  return Object.assign(app, {
    authRouteHandler,
    complianceWebhooks: complianceWebhooksFactory(app),
    middleware,
  });
}

/**
 * Server functions send Responses differently from React Router loaders:
 *
 * - A redirect Response becomes a router redirect, the only kind Start follows, whether the server function runs
 *   while a page is server-rendered or is called from the browser.
 * - While a page is server-rendered (no session token header), any other Response becomes a ShopifyResponseError for
 *   the route's error boundary, because Start cannot send a second Response for the page.
 * - Called from the browser, other Responses go back unchanged; App Bridge acts on them (a 401 with
 *   `X-Shopify-Retry-Invalid-Session-Request` or `X-Shopify-API-Request-Failure-Reauthorize-Url`).
 */
function toServerFunctionError(errorOrResponse: unknown, request: Request): unknown {
  if (!(errorOrResponse instanceof Response) || isRedirect(errorOrResponse)) return errorOrResponse;
  const location = errorOrResponse.headers.get('Location');
  if (location && errorOrResponse.status >= 300 && errorOrResponse.status < 400) {
    return routerRedirect({
      href: location,
      statusCode: errorOrResponse.status,
      headers: errorOrResponse.headers,
    });
  }
  if (request.headers.has('authorization')) return errorOrResponse;
  return new ShopifyResponseError(errorOrResponse, new URL(request.url).pathname);
}

// biome-ignore lint/suspicious/noExplicitAny: wraps functions of any signature and returns them with the same type.
type AnyFunction = (...args: any[]) => any;

function wrapFunction<Fn extends AnyFunction>(fn: Fn, request: Request, convertReturned: boolean): Fn {
  const convert = (value: unknown) => {
    throw toServerFunctionError(value, request);
  };
  return ((...args: Parameters<Fn>) => {
    let result: unknown;
    try {
      result = fn(...args);
    } catch (error) {
      convert(error);
    }
    if (result instanceof Promise) return result.catch(convert);
    // `redirect()` returns its Response for the caller to throw or return.
    if (convertReturned && result instanceof Response) return toServerFunctionError(result, request);
    return result;
  }) as Fn;
}

function wrapMethods<T extends object>(target: T, request: Request): T {
  const wrapped = {...target} as Record<string, unknown>;
  for (const [key, value] of Object.entries(target)) {
    if (typeof value === 'function') wrapped[key] = wrapFunction(value as AnyFunction, request, false);
  }
  return wrapped as T;
}

/**
 * The admin context's helpers (`billing`, `redirect`, `scopes`, `admin.graphql`) throw Responses the React Router way.
 * Wrapped here so those Responses work in server functions, as described on toServerFunctionError.
 */
function withStartResponses<Context extends object>(context: Context, request: Request): Context {
  const result = {...context} as Record<string, unknown>;
  for (const [key, value] of Object.entries(context)) {
    if (key === 'redirect' && typeof value === 'function') {
      result[key] = wrapFunction(value as AnyFunction, request, true);
    } else if ((key === 'billing' || key === 'scopes' || key === 'admin') && value && typeof value === 'object') {
      result[key] = wrapMethods(value, request);
    }
  }
  return result as Context;
}

/** Thrown by the admin middleware while server rendering when authentication answered with a non-redirect Response. */
export class ShopifyResponseError extends Error {
  readonly response: Response;
  readonly status: number;

  constructor(response: Response, pathname: string) {
    super(
      `Shopify authentication answered HTTP ${response.status} while rendering ${pathname}. Open the app from the ` +
        'Shopify admin, or check that the document middleware is registered and does not exclude this page.',
    );
    this.name = 'ShopifyResponseError';
    this.response = response;
    this.status = response.status;
  }
}
