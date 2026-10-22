import {Session} from '@shopify/shopify-api';

import type {AdminApiContext} from '../../clients';

export interface FlowContext {
  /**
   * A session with an offline token for the shop.
   *
   * Returned only if there is a session for the shop.
   *
   */
  session: Session;

  /**
   * The payload from the Flow request.
   *
   */
  payload: any;

  /**
   * An admin context for the Flow request.
   *
   * Returned only if there is a session for the shop.
   *
   */
  admin: AdminApiContext;
}

/**
 * Verifies requests coming from Shopify Flow extensions.
 * @publicDocs
 */
export type AuthenticateFlow = (request: Request) => Promise<FlowContext>;
