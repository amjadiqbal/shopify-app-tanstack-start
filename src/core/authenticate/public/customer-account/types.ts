import {JwtPayload} from '@shopify/shopify-api';

import {EnsureCORSFunction} from '../../helpers/ensure-cors-headers';

/**
 * Authenticates requests coming from Shopify customer account extensions.
 * @publicDocs
 */
export type AuthenticateCustomerAccount = (
  request: Request,
  options?: AuthenticateCustomerAccountOptions,
) => Promise<CustomerAccountContext>;

export interface AuthenticateCustomerAccountOptions {
  corsHeaders?: string[];
}

/**
 * Authenticated Context for a customer account extension request
 */
export interface CustomerAccountContext {
  /**
   * The decoded and validated session token for the request
   *
   * Refer to the OAuth docs for the [session token payload](https://shopify.dev/docs/apps/auth/oauth/session-tokens#payload).
   *
   */
  sessionToken: JwtPayload;

  /**
   * A function that ensures the CORS headers are set correctly for the response.
   *
   */
  cors: EnsureCORSFunction;
}
