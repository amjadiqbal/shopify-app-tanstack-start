import type {GetUnauthenticatedAdminContext} from './admin/types';
import type {GetUnauthenticatedStorefrontContext} from './storefront/types';

export interface Unauthenticated {
  /**
   * Get an admin context by passing a shop
   *
   * **Warning** This should only be used for Requests that do not originate from Shopify.
   * You must do your own authentication before using this method.
   * This method throws an error if there is no session for the shop.
   *
   */
  admin: GetUnauthenticatedAdminContext;

  /**
   * Get a storefront context by passing a shop
   *
   * **Warning** This should only be used for Requests that do not originate from Shopify.
   * You must do your own authentication before using this method.
   * This method throws an error if there is no session for the shop.
   *
   */
  storefront: GetUnauthenticatedStorefrontContext;
}
