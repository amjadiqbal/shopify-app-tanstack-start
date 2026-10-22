import {Session} from '@shopify/shopify-api';

import {AdminApiContext} from '../../clients';

export interface UnauthenticatedAdminContext {
  /**
   * The session for the given shop.
   *
   * This comes from the session storage which `shopifyApp` uses to store sessions in your database of choice.
   *
   * This will always be an offline session. You can use to get shop-specific data.
   *
   */
  session: Session;

  /**
   * Methods for interacting with the GraphQL Admin API for the given store.
   *
   */
  admin: AdminApiContext;
}

/**
 * Creates an unauthenticated Admin context.
 * @publicDocs
 */
export type GetUnauthenticatedAdminContext = (
  shop: string,
) => Promise<UnauthenticatedAdminContext>;
