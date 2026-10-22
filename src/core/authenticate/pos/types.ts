import {JwtPayload} from '@shopify/shopify-api';

import {EnsureCORSFunction} from '../helpers/ensure-cors-headers';

export type AuthenticatePOS = (
  request: Request,
  options?: AuthenticatePOSOptions,
) => Promise<POSContext>;

export interface AuthenticatePOSOptions {
  corsHeaders?: string[];
}

/**
 * Authenticated Context for a POS UI extension request
 */
export interface POSContext {
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
