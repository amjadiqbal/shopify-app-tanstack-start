import {
  ConfigParams as ApiConfigArg,
  ConfigInterface as ApiConfig,
  Session,
  ApiVersion,
  WebhookHandler,
} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';
import type {
  BillingConfigOneTimePlan,
  BillingConfigSubscriptionLineItemPlan,
} from '@shopify/shopify-api';

import type {
  ApiFutureFlags,
  FutureFlagOptions,
  FutureFlags,
} from './future/flags';
import type {AppDistribution} from './types';
import type {AdminApiContext} from './clients';
import {IdempotentPromiseHandler} from './authenticate/helpers/idempotent-promise-handler';

export interface BillingConfigWithLineItems {
  [plan: string]:
    BillingConfigOneTimePlan | BillingConfigSubscriptionLineItemPlan;
}

type ReactRouterManagedApiConfigOptions<Future extends FutureFlagOptions> =
  Omit<
    ApiConfigArg<ApiFutureFlags<Future>>,
    | 'hostName'
    | 'hostScheme'
    | 'apiVersion'
    | 'isCustomStoreApp'
    | 'isEmbeddedApp'
    | 'future'
    | 'billing'
    | 'restResources'
  >;

export interface AppConfigArg<
  Storage extends SessionStorage = SessionStorage,
  Future extends FutureFlagOptions = FutureFlagOptions,
> extends ReactRouterManagedApiConfigOptions<Future> {
  /**
   * The URL your app is running on.
   *
   * The `@shopify/cli` provides this URL as `process.env.SHOPIFY_APP_URL`.  For development this is probably a tunnel URL that points to your local machine.  If this is a production app, this is your production URL.
   */
  appUrl: string;

  /**
   * An adaptor for storing sessions in your database of choice.
   *
   * Shopify provides multiple session storage adaptors and you can create your own.
   *
   * Optional for apps created in the Shopify Admin.
   *
   * {@link https://github.com/Shopify/shopify-app-js/blob/main/README.md#session-storage-options}
   *
   */
  sessionStorage?: Storage;

  /**
   * Billing configurations for the app.
   *
   * Uses the new line item billing format that allows for more complex billing structures.
   *
   */
  billing?: BillingConfigWithLineItems;

  /**
   * Whether your app use online or offline tokens.
   *
   * If your app uses online tokens, then both online and offline tokens will be saved to your database.  This ensures your app can perform background jobs.
   *
   * {@link https://shopify.dev/docs/apps/auth/oauth/access-modes}
   *
   * @defaultValue `false`
   */
  useOnlineTokens?: boolean;

  /**
   * The config for the shop-specific webhooks your app needs.
   *
   * Use this to configure shop-specific webhooks. In many cases defining app-specific webhooks in the `shopify.app.toml` will be sufficient and easier to manage.  Please see:
   *
   * {@link https://shopify.dev/docs/apps/build/webhooks/subscribe#app-specific-vs-shop-specific-subscriptions}
   *
   * You should only use this if you need shop-specific webhooks. If you do need shop-specific webhooks this can be in used in conjunction with the afterAuth hook, loaders or processes such as background jobs.
   *
   */
  webhooks?: WebhookConfig;

  /**
   * Functions to call at key places during your apps lifecycle.
   *
   * These functions are called in the context of the request that triggered them.  This means you can access the session.
   *
   */
  hooks?: HooksConfig;

  /**
   * How your app is distributed. Default is `AppDistribution.AppStore`.
   *
   * AppStore should be used for public apps that are distributed in the Shopify App Store.
   * SingleMerchant should be used for custom apps managed in the Partner Dashboard.
   * ShopifyAdmin should be used for apps that are managed in the merchant's Shopify Admin.
   *
   * ShopifyAdmin apps can't be embedded in the Shopify Admin and don't receive session tokens, so `authenticate.admin`
   * does not authenticate their requests. Your app must authenticate its own users before it calls `authenticate.admin`.
   *
   * {@link https://shopify.dev/docs/apps/distribution}
   */
  distribution?: AppDistribution;

  /**
   * What version of Shopify's Admin API's would you like to use.
   *
   * {@link https://shopify.dev/docs/api/}
   *
   */
  apiVersion: ApiVersion;

  /**
   * A path that Shopify can reserve for auth related endpoints.
   *
   * This must match a splat server route in your TanStack Start app (for example `src/routes/auth/$.ts`) whose GET handler returns `shopify.authRouteHandler(request)`.
   *
   * @default `"/auth"`
   *
   */
  authPathPrefix?: string;

  /**
   * Features that will be introduced in future releases of this package.
   *
   * You can opt in to these features by setting the corresponding flags. By doing so, you can prepare for future
   * releases in advance and provide feedback on the new features.
   */
  future?: Future;

  /**
   * The URL to load the Polaris web components script from.
   *
   * This is used to add a preload `Link` header to document responses. It should match the `polarisUrl` you pass to the
   * `AppProvider` component. Defaults to the latest stable Polaris 2.x release on the Shopify CDN (`https://cdn.shopify.com/shopifycloud/polaris-2.js`). Only override this if you need to load a Polaris release candidate, pin a specific version, or stay on Polaris 1.x (`https://cdn.shopify.com/shopifycloud/polaris-1.js`).
   */
  polarisUrl?: string;
}

export interface AppConfig<
  Storage extends SessionStorage = SessionStorage,
> extends Omit<ApiConfig, 'future' | 'billing'> {
  canUseLoginForm: boolean;
  appUrl: string;
  auth: AuthConfig;
  sessionStorage?: Storage;
  useOnlineTokens: boolean;
  hooks: HooksConfig;
  future: FutureFlags;
  idempotentPromiseHandler: IdempotentPromiseHandler;
  distribution: AppDistribution;
  billing?: BillingConfigWithLineItems;
  polarisUrl: string;
}

export interface AuthConfig {
  path: string;
  callbackPath: string;
  exitIframePath: string;
  patchSessionTokenPath: string;
  loginPath: string;
}

export type WebhookConfig = Record<string, WebhookHandler | WebhookHandler[]>;

interface HooksConfig {
  /**
   * A function to call after a merchant installs your app
   *
   * @param context - An object with context about the request that triggered the hook.
   * @param context.session - The session of the merchant that installed your app. This is the output of sessionStorage.loadSession in case people want to load their own.
   * @param context.admin - An object with access to the Shopify Admin API's.
   *
   */
  afterAuth?: (options: AfterAuthOptions) => void | Promise<void>;
}

export interface AfterAuthOptions {
  session: Session;
  admin: AdminApiContext;
}
