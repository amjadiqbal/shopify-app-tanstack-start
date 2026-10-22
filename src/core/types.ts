import {RegisterReturn, Shopify} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';

import type {AuthenticateAdmin} from './authenticate/admin/types';
import type {AuthenticateFlow} from './authenticate/flow/types';
import {AuthenticateFulfillmentService} from './authenticate/fulfillment-service/types';
import type {AuthenticatePublic} from './authenticate/public/types';
import type {
  AuthenticateWebhook,
  RegisterWebhooksOptions,
} from './authenticate/webhooks/types';
import type {AppConfig, AppConfigArg} from './config-types';
import type {
  ApiConfigWithFutureFlags,
  ApiFutureFlags,
  FutureFlagOptions,
} from './future/flags';
import type {Unauthenticated} from './unauthenticated/types';
import type {AuthenticatePOS} from './authenticate/pos/types';

export interface BasicParams<
  Future extends FutureFlagOptions = FutureFlagOptions,
> {
  api: Shopify<ApiConfigWithFutureFlags<Future>, any, ApiFutureFlags<Future>>;
  config: AppConfig;
  logger: Shopify['logger'];
}

// eslint-disable-next-line no-warning-comments
// TODO: Use this enum to replace the isCustomStoreApp config option in shopify-api-js
export enum AppDistribution {
  AppStore = 'app_store',
  SingleMerchant = 'single_merchant',
  ShopifyAdmin = 'shopify_admin',
}

type RegisterWebhooks = (
  options: RegisterWebhooksOptions,
) => Promise<RegisterReturn | void>;

export enum LoginErrorType {
  MissingShop = 'MISSING_SHOP',
  InvalidShop = 'INVALID_SHOP',
}

export interface LoginError {
  shop?: LoginErrorType;
}

type Login = (request: Request) => Promise<LoginError | never>;

type AddDocumentResponseHeaders = (request: Request, headers: Headers) => void;

type SessionStorageType<Config extends AppConfigArg> =
  Config['sessionStorage'] extends SessionStorage
    ? Config['sessionStorage']
    : SessionStorage;

interface Authenticate<Config extends AppConfigArg> {
  /**
   * Authenticate an admin Request and get back an authenticated admin context.  Use the authenticated admin context to interact with Shopify.
   *
   * Examples of when to use this are requests from your app's UI, or requests from admin extensions.
   *
   * If there is no session for the Request, this will redirect the merchant to correct auth flows.
   *
   */
  admin: AuthenticateAdmin<Config>;

  /**
   * Authenticate a Flow extension Request and get back an authenticated context, containing an admin context to access
   * the API, and the payload of the request.
   *
   * If there is no session for the Request, this will return an HTTP 400 error.
   *
   * Note that this will always be a POST request.
   *
   */
  flow: AuthenticateFlow;

  /**
   * Authenticate a request from a fulfillment service and get back an authenticated context.
   *
   * */
  fulfillmentService: AuthenticateFulfillmentService;

  /**
   * Authenticate a request from a POS UI extension
   *
   */
  pos: AuthenticatePOS;

  /**
   * Authenticate a public request and get back a session token.
   *
   */
  public: AuthenticatePublic;

  /**
   * Authenticate a Shopify webhook request, get back an authenticated admin context and details on the webhook request
   * 
   */
  webhook: AuthenticateWebhook<string>;
}

export interface ShopifyAppBase<Config extends AppConfigArg> {
  /**
   * The `SessionStorage` instance you passed in as a config option.
   *
   */
  sessionStorage?: SessionStorageType<Config>;

  /**
   * Adds the required Content Security Policy headers for Shopify apps to the given Headers object.
   *
   * {@link https://shopify.dev/docs/apps/store/security/iframe-protection}
   *
   */
  addDocumentResponseHeaders: AddDocumentResponseHeaders;

  /**
   * Register shop-specific webhook subscriptions using the Admin GraphQL API.
   *
   * In many cases defining app-specific webhooks in the `shopify.app.toml` will be sufficient and easier to manage.  Please see:
   *
   * {@link https://shopify.dev/docs/apps/build/webhooks/subscribe#app-specific-vs-shop-specific-subscriptions}
   *
   * You should only use this if you need shop-specific webhooks.
   *
   */
  registerWebhooks: RegisterWebhooks;

  /**
   * Ways to authenticate requests from different surfaces across Shopify.
   *
   */
  authenticate: Authenticate<Config>;

  /**
   * Ways to get Contexts from requests that do not originate from Shopify.
   *
   */
  unauthenticated: Unauthenticated;
}

export interface ShopifyAppLogin {
  /**
   * Log a merchant in, and redirect them to the app root. Will redirect the merchant to authentication if a shop is
   * present in the URL search parameters or form data.
   *
   * This function won't be present when the `distribution` config option is set to `AppDistribution.ShopifyAdmin`,
   * because Admin apps aren't allowed to show a login page.
   *
   */
  login: Login;
}

export type AdminApp<Config extends AppConfigArg> = ShopifyAppBase<Config>;
export type SingleMerchantApp<Config extends AppConfigArg> =
  ShopifyAppBase<Config> & ShopifyAppLogin;
export type AppStoreApp<Config extends AppConfigArg> = ShopifyAppBase<Config> &
  ShopifyAppLogin;

type EnforceSessionStorage<Config extends AppConfigArg, Base> = Base & {
  sessionStorage: SessionStorageType<Config>;
};

/**
 * An object your app can use to interact with Shopify.
 *
 * By default, the app's distribution is `AppStore`.
 */
export type ShopifyApp<Config extends AppConfigArg> =
  Config['distribution'] extends AppDistribution.ShopifyAdmin
    ? AdminApp<Config>
    : Config['distribution'] extends AppDistribution.SingleMerchant
      ? EnforceSessionStorage<Config, SingleMerchantApp<Config>>
      : Config['distribution'] extends AppDistribution.AppStore
        ? EnforceSessionStorage<Config, AppStoreApp<Config>>
        : EnforceSessionStorage<Config, AppStoreApp<Config>>;
