import {Session} from '@shopify/shopify-api';

import type {AdminApiContext} from '../../clients';

export type FulfillmentServicePayload = Record<string, any> & {
  kind: string;
};

export interface FulfillmentServiceContext {
  /**
   * A session with an offline token for the shop.
   *
   * Returned only if there is a session for the shop.
   * */
  session: Session;
  /**
   *
   * An admin context for the fulfillment service request.
   *
   * Returned only if there is a session for the shop.
   */
  admin: AdminApiContext;

  /**
   * The payload from the fulfillment service request.
   *
   */
  payload: FulfillmentServicePayload;
}

/**
 * Verifies requests coming from Shopify to fulfillment service apps.
 * @publicDocs
 */
export type AuthenticateFulfillmentService = (
  request: Request,
) => Promise<FulfillmentServiceContext>;
