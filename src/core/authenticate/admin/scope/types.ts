/**
 * Provides utilities that apps can use to [manage scopes](https://shopify.dev/docs/apps/build/authentication-authorization/app-installation/manage-access-scopes) for the app using the Admin API.
 * @publicDocs
 */
export interface ScopesApiContext {
  /**
   * Queries Shopify for the scopes for this app on this shop
   *
   * @returns {ScopesDetail} The scope details.
   *
   */
  query: () => Promise<ScopesDetail>;

  /**
   * Requests the merchant to grant the provided scopes for this app on this shop
   *
   * Warning: This method performs a server-side redirect.
   *
   */
  request: (scopes: Scope[]) => Promise<void>;

  /**
   * Revokes the provided scopes from this app on this shop
   *
   * Warning: This method throws an [error](https://shopify.dev/docs/api/admin-graphql/unstable/objects/AppRevokeAccessScopesAppRevokeScopeError) if the provided optional scopes contains a required scope.
   *
   */
  revoke: (scopes: Scope[]) => Promise<ScopesRevokeResponse>;
}

/**
 * `Scope` represents an [access scope](https://shopify.dev/docs/api/usage/access-scopes) handle, like "`write_products`" or "`read_orders`"
 */
export type Scope = string;

/**
 * `UserResult` represents the results of a user responding to a scopes request, i.e. a merchant user’s action taken when presented with a grant modal.
 */
export type UserResult = 'granted-all' | 'declined-all';

export interface ScopesDetail {
  /**
   * The scopes that have been granted on the shop for this app
   */
  granted: Scope[];
  /**
   * The required scopes that the app has declared in its configuration
   */
  required: Scope[];
  /**
   * The optional scopes that the app has declared in its configuration
   */
  optional: Scope[];
}

export interface ScopesRequestResponse {
  result: UserResult;
  detail: ScopesDetail;
}

export interface ScopesRevokeResponse {
  /**
   * The scopes that have been revoked on the shop for this app
   */
  revoked: Scope[];
}
