import {JwtPayload} from '@shopify/shopify-api';

import {EnsureCORSFunction} from '../../helpers/ensure-cors-headers';

/**
 * Authenticates requests coming from Shopify checkout extensions.
 * @publicDocs
 */
export type AuthenticateCheckout = (
  request: Request,
  options?: AuthenticateCheckoutOptions,
) => Promise<CheckoutContext>;

export interface AuthenticateCheckoutOptions {
  corsHeaders?: string[];
}

/**
 * Authenticated Context for a checkout request
 */
export interface CheckoutContext {
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
