import {Session} from '@shopify/shopify-api';

import type {StorefrontContext} from '../../clients';

export interface UnauthenticatedStorefrontContext {
  /**
   * The session for the given shop.
   *
   * This comes from the session storage which `shopifyApp` uses to store sessions in your database of choice.
   *
   * This will always be an offline session. You can use this to get shop specific data.
   *
   */
  session: Session;

  /**
   * Method for interacting with the Shopify GraphQL Storefront API for the given store.
   *
   */
  storefront: StorefrontContext;
}

/**
 * Creates an unauthenticated Storefront context.
 * @publicDocs
 */
export type GetUnauthenticatedStorefrontContext = (
  shop: string,
) => Promise<UnauthenticatedStorefrontContext>;
