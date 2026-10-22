import {Session, WebhookTypeValue} from '@shopify/shopify-api';

import type {AdminApiContext} from '../../clients';

export interface RegisterWebhooksOptions {
  /**
   * The Shopify session used to register webhooks using the Admin API.
   */
  session: Session;
}

interface Context<Topics = string | number | symbol> {
  /**
   * The API version used for the webhook.
   *
   */
  apiVersion: string;

  /**
   * The shop where the webhook was triggered.
   *
   */
  shop: string;

  /**
   * The topic of the webhook.
   *
   */
  topic: Topics;

  /**
   * A unique ID for the webhook. This is the idempotency key — useful to keep track of which
   * events your app has already processed.
   *
   */
  webhookId: string;

  /**
   * The payload from the webhook request.
   *
   */
  payload: Record<string, any>;

  /**
   * The type of webhook: 'webhooks' for traditional webhooks or 'events' for events webhooks.
   */
  webhookType: WebhookTypeValue;

  /**
   * The name assigned to the webhook subscription. Only available for traditional webhooks.
   */
  name?: string;

  /**
   * The handle for the webhook subscription. Only available for events webhooks.
   */
  handle?: string;

  /**
   * The action type: 'create', 'update', or 'delete'. Only available for events webhooks.
   */
  action?: string;

  /**
   * The timestamp when the webhook was triggered.
   */
  triggeredAt?: string;

  /**
   * The unique event identifier. Only available for webhooks, not events webhooks.
   */
  eventId?: string;
}

export interface WebhookContextWithoutSession<
  Topics = string | number | symbol,
> extends Context<Topics> {
  session: undefined;
  admin: undefined;
}

export interface WebhookContextWithSession<
  Topics = string | number | symbol,
> extends Context<Topics> {
  /**
   * A session with an offline token for the shop.
   *
   * Returned only if there is a session for the shop.
   * Webhook requests can trigger after an app is uninstalled
   * If the app is already uninstalled, the session may be undefined.
   * Therefore, you should check for the session before using it.
   *
   */
  session: Session;

  /**
   * An admin context for the webhook.
   *
   * Returned only if there is a session for the shop.
   *
   */
  admin: AdminApiContext;
}

export type WebhookContext<Topics = string | number | symbol> =
  WebhookContextWithoutSession<Topics> | WebhookContextWithSession<Topics>;

/**
 * Verifies requests coming from Shopify webhooks.
 * @publicDocs
 */
export type AuthenticateWebhook<Topics = string | number | symbol> = (
  request: Request,
) => Promise<WebhookContext<Topics>>;
