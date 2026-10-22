import {
  AppSubscription,
  BillingCheckParams,
  BillingCheckResponseObject,
  BillingRequestParams,
  UsageRecord,
} from '@shopify/shopify-api';

import type {AppConfigArg} from '../../../config-types';

export interface RequireBillingOptions<
  Config extends AppConfigArg,
> extends Omit<BillingCheckParams, 'session' | 'plans' | 'returnObject'> {
  /**
   * The plans to check for. Must be one of the values defined in the `billing` config option.
   */
  plans: (keyof Config['billing'])[];
  /**
   * How to handle the request if the shop doesn't have an active payment for any plan.
   */
  onFailure: (error: any) => Promise<Response>;
}

export interface CheckBillingOptions<Config extends AppConfigArg> extends Omit<
  BillingCheckParams,
  'session' | 'plans' | 'returnObject'
> {
  /**
   * The plans to check for. Must be one of the values defined in the `billing` config option.
   */
  plans?: (keyof Config['billing'])[];
}

export interface RequestBillingOptions<
  Config extends AppConfigArg,
> extends Omit<BillingRequestParams, 'session' | 'plan' | 'returnObject'> {
  /**
   * The plan to request. Must be one of the values defined in the `billing` config option.
   */
  plan: keyof Config['billing'];
  /**
   * Whether to use the test mode. This prevents the credit card from being charged. Test shops and demo shops cannot be charged.
   */
  isTest?: boolean;
  /**
   * The URL to return to after the merchant approves the payment.
   */
  returnUrl?: string;
}

export interface CancelBillingOptions {
  /**
   * The ID of the subscription to cancel.
   */
  subscriptionId: string;
  /**
   * Whether to issue prorated credits for the unused portion of the app subscription. There will be a corresponding
   * deduction (based on revenue share) to your Partner account. For example, if a $10.00 app subscription
   * (with 0% revenue share) is cancelled and prorated half way through the billing cycle, then the merchant will be
   * credited $5.00 and that amount will be deducted from your Partner account.
   */
  prorate?: boolean;
  /**
   * Whether to use the test mode. This prevents the credit card from being charged.
   */
  isTest?: boolean;
}

export interface CreateUsageRecordOptions {
  /**
   * The description of the app usage record.
   */
  description: string;
  /**
   * The price of the app usage record.
   */
  price: {
    /**
     * The amount to charge for this usage record.
     */
    amount: number;
    /**
     * The currency code for this usage record.
     */
    currencyCode: string;
  };
  /**
   * Whether to use the test mode. This prevents the credit card from being charged.
   */
  isTest: boolean;
  /*
   * Defines the usage pricing plan the merchant is subscribed to.
   */
  subscriptionLineItemId?: string;
  /*
   * A unique key generated to avoid duplicate charges.
   */
  idempotencyKey?: string;
}

export interface UpdateUsageCappedAmountOptions {
  /**
   * The subscription line item ID to update.
   */
  subscriptionLineItemId: string;
  /**
   * The maximum charge for the usage billing plan.
   */
  cappedAmount: {
    /**
     * The amount to update.
     */
    amount: number;
    /**
     * The currency code to update.
     */
    currencyCode: string;
  };
}

/**
 * Provides utilities that apps can use to request [Manual Pricing](https://shopify.dev/docs/apps/launch/billing/manual-pricing) billing for the app using the Admin API.
 * @publicDocs
 */
export interface BillingContext<Config extends AppConfigArg> {
  /**
   * Checks if the shop has an active payment for any plan defined in the `billing` config option.
   *
   * @returns A promise that resolves to an object containing the active purchases for the shop.
   *
   */
  require: (
    options: RequireBillingOptions<Config>,
  ) => Promise<BillingCheckResponseObject>;

  /**
   * Checks if the shop has an active payment for any plan defined in the `billing` config option.
   *
   * @returns A promise that resolves to an object containing the active purchases for the shop.
   *
   */
  check: <Options extends CheckBillingOptions<Config>>(
    options?: Options,
  ) => Promise<BillingCheckResponseObject>;

  /**
   * Requests payment for the plan.
   *
   * @returns Redirects to the confirmation URL for the payment.
   *
   */
  request: (options: RequestBillingOptions<Config>) => Promise<never>;

  /**
   * Cancels an ongoing subscription, given its ID.
   *
   * @returns The cancelled subscription.
   *
   */
  cancel: (options: CancelBillingOptions) => Promise<AppSubscription>;

  /**
   * Creates a usage record for an app subscription. [Shopify App Pricing](https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing) supports usage-based plans through the [App Events API](https://shopify.dev/docs/api/app-events) instead of usage records.
   *
   * @returns Returns a usage record when one was created successfully.
   *
   */
  createUsageRecord: (
    options: CreateUsageRecordOptions,
  ) => Promise<UsageRecord>;

  /**
   * Updates the capped amount for a usage billing plan.
   *
   * @returns Redirects to a confirmation page to update the usage billing plan.
   *
   */
  updateUsageCappedAmount: (
    options: UpdateUsageCappedAmountOptions,
  ) => Promise<never>;
}
