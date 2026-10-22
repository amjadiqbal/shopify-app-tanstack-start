import type {WebhookContext} from '../core/authenticate/webhooks/types';
import type {AppConfigArg} from '../core/config-types';
import type {ShopifyApp} from '../core/types';

type Handler = (webhook: WebhookContext<string>) => unknown;

/**
 * Your code for each compliance topic. Shopify requires the data request and redaction to be completed within 30
 * days; queue the work and return quickly, because Shopify retries a webhook that takes longer than 5 seconds.
 */
export interface ComplianceWebhookHandlers {
  /** `customers/data_request`: send the customer's stored data to the store owner. */
  customersDataRequest?: Handler;
  /** `customers/redact`: delete or anonymise the customer's data. */
  customersRedact?: Handler;
  /** `shop/redact` (48 hours after uninstall): delete the shop's data. The shop's sessions are deleted for you. */
  shopRedact?: Handler;
  /** `app/uninstalled`, if you point it at the same route. The shop's sessions are deleted for you. */
  appUninstalled?: Handler;
  /** Any other topic sent to this route. Without it, other topics are acknowledged and ignored. */
  other?: Handler;
  /**
   * Called when handling fails: one of your handlers throws, or deleting the shop's sessions fails. The webhook is then
   * answered with 500 so Shopify retries it. Defaults to `console.error`. If `onError` itself throws, that error is
   * logged with `console.error` and the answer is still 500.
   */
  onError?: (error: unknown, webhook: WebhookContext<string>) => unknown;
}

export function complianceWebhooksFactory<Config extends AppConfigArg>(app: ShopifyApp<Config>) {
  return function complianceWebhooks(handlers: ComplianceWebhookHandlers = {}) {
    return async function handleComplianceWebhook(request: Request): Promise<Response> {
      let webhook: WebhookContext<string>;
      try {
        webhook = await app.authenticate.webhook(request);
      } catch (errorOrResponse) {
        // 401 for a bad HMAC, as Shopify's compliance checks expect; 400/405 for other invalid requests.
        if (errorOrResponse instanceof Response) return errorOrResponse;
        throw errorOrResponse;
      }

      try {
        await dispatch(webhook);
      } catch (error) {
        try {
          await (handlers.onError ?? logError)(error, webhook);
        } catch (onErrorFailure) {
          logError(onErrorFailure, webhook);
        }
        return new Response(null, {status: 500});
      }
      return new Response(null, {status: 200});
    };

    async function dispatch(webhook: WebhookContext<string>) {
      switch (webhook.topic) {
        case 'CUSTOMERS_DATA_REQUEST':
          await handlers.customersDataRequest?.(webhook);
          break;
        case 'CUSTOMERS_REDACT':
          await handlers.customersRedact?.(webhook);
          break;
        case 'SHOP_REDACT':
          await handlers.shopRedact?.(webhook);
          await deleteShopSessions(app, webhook.shop);
          break;
        case 'APP_UNINSTALLED':
          await handlers.appUninstalled?.(webhook);
          await deleteShopSessions(app, webhook.shop);
          break;
        default:
          await handlers.other?.(webhook);
      }
    }
  };
}

function logError(error: unknown, webhook: WebhookContext<string>) {
  console.error(`[shopify-app-tanstack-start] ${webhook.topic} webhook handler failed for ${webhook.shop}:`, error);
}

async function deleteShopSessions<Config extends AppConfigArg>(app: ShopifyApp<Config>, shop: string) {
  const storage = app.sessionStorage;
  if (!storage) return;
  const sessions = await storage.findSessionsByShop(shop);
  if (sessions.length > 0) await storage.deleteSessions(sessions.map((session) => session.id));
}
