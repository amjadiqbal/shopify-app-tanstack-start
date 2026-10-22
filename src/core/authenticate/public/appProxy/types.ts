import {Session} from '@shopify/shopify-api';

import {AdminApiContext, StorefrontContext} from '../../../clients';

/**
 * Authenticates requests coming to the app from Shopify app proxies.
 * @publicDocs
 */
export type AuthenticateAppProxy = (
  request: Request,
) => Promise<AppProxyContext | AppProxyContextWithSession>;

interface Options {
  /**
   * Whether to use the shop's theme layout around the Liquid content.
   */
  layout?: boolean;
}

export type LiquidResponseFunction = (
  body: string,
  initAndOptions?: number | (ResponseInit & Options),
) => Response;

interface Context {
  /**
   * A utility for creating a Liquid Response.
   *
   */
  liquid: LiquidResponseFunction;
}

export interface AppProxyContext extends Context {
  /**
   * No session is available for the shop that made this request.
   *
   * This comes from the session storage which `shopifyApp` uses to store sessions in your database of choice.
   */
  session: undefined;

  /**
   * No session is available for the shop that made this request.
   * Therefore no methods for interacting with the GraphQL / REST Admin APIs are available.
   */
  admin: undefined;

  /**
   * No session is available for the shop that made this request.
   * Therefore no method for interacting with the Storefront API is available.
   */
  storefront: undefined;
}

export interface AppProxyContextWithSession extends Context {
  /**
   * The session for the shop that made the request.
   *
   * This comes from the session storage which `shopifyApp` uses to store sessions in your database of choice.
   *
   * Use this to get shop or user-specific data.
   *
   */
  session: Session;

  /**
   * Methods for interacting with the GraphQL / REST Admin APIs for the store that made the request.
   *
   */
  admin: AdminApiContext;

  /**
   * Method for interacting with the Shopify Storefront Graphql API for the store that made the request.
   *
   */
  storefront: StorefrontContext;
}
