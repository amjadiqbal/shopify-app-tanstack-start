import {JwtPayload, Session} from '@shopify/shopify-api';

import {EnsureCORSFunction} from '../helpers/ensure-cors-headers';
import type {AppConfigArg} from '../../config-types';
import type {AdminApiContext} from '../../clients';
import type {AppDistribution} from '../../types';

import type {BillingContext} from './billing/types';
import {RedirectFunction} from './helpers/redirect';
import {ScopesApiContext} from './scope/types';

interface AdminContextInternal<Config extends AppConfigArg> {
  /**
   * The session for the user who made the request.
   *
   * This comes from the session storage which `shopifyApp` uses to store sessions in your database of choice.
   *
   * Use this to get shop or user-specific data.
   *
   */
  session: Session;

  /**
   * Methods for interacting with the GraphQL / REST Admin APIs for the store that made the request.
   */
  admin: AdminApiContext;

  /**
   * Billing methods for this store, based on the plans defined in the `billing` config option.
   *
   * {@link https://shopify.dev/docs/apps/billing}
   */
  billing: BillingContext<Config>;

  /**
   * A function that ensures the CORS headers are set correctly for the response.
   *
   */
  cors: EnsureCORSFunction;
}

export interface EmbeddedAdminContext<
  Config extends AppConfigArg,
> extends AdminContextInternal<Config> {
  /**
   * The decoded and validated session token for the request.
   *
   * Returned only for embedded apps (all distribution types except merchant custom apps)
   *
   * {@link https://shopify.dev/docs/apps/auth/oauth/session-tokens#payload}
   *
   */
  sessionToken: JwtPayload;

  /**
   * A function that redirects the user to a new page, ensuring that the appropriate parameters are set for embedded
   * apps.
   *
   * Returned only for embedded apps (all apps except merchant custom apps).
   *
   * Request parameters (including `id_token`, `shop`, `host`, and `embedded`) are only copied to the destination when
   * it resolves to the same origin as `appUrl`. This helper does not validate the destination URL — avoid passing
   * unvalidated user input (for example, a raw `?next=` query parameter) and use an allow-list of paths instead.
   *
   */
  redirect: RedirectFunction;
}
export interface MerchantCustomAdminContext<
  Config extends AppConfigArg,
> extends AdminContextInternal<Config> {}

type EmbeddedTypedAdminContext<Config extends AppConfigArg> =
  Config['distribution'] extends AppDistribution.ShopifyAdmin
    ? MerchantCustomAdminContext<Config>
    : EmbeddedAdminContext<Config>;

export interface ScopesContext {
  /**
   * Methods to manage scopes for the store that made the request.
   */
  scopes: ScopesApiContext;
}

export type AdminContext<Config extends AppConfigArg> =
  EmbeddedTypedAdminContext<Config> & ScopesContext;

/**
 * Authenticates requests coming from the Shopify admin.
 *
 * > Note: The shape of the returned object changes depending on the `distribution` config. Merchant custom apps (`AppDistribution.ShopifyAdmin`) do not return session tokens or redirect functionality. All other distributions return a context with session tokens and redirect functionality.
 *
 * > Caution: For merchant custom apps (`AppDistribution.ShopifyAdmin`), `authenticate.admin` does not authenticate the request. These apps can't be embedded in the Shopify admin, so requests don't carry a session token. The function returns an Admin API context that uses your app's `adminApiAccessToken` for any request it receives. Your app must authenticate its own users before it calls `authenticate.admin`, for example with your identity provider, a private network, or HTTP authentication.
 * @publicDocs
 */
export type AuthenticateAdmin<Config extends AppConfigArg> = (
  request: Request,
) => Promise<AdminContext<Config>>;
