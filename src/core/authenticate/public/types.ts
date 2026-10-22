import type {AuthenticateCheckout} from './checkout/types';
import type {AuthenticateAppProxy} from './appProxy/types';
import type {AuthenticateCustomerAccount} from './customer-account/types';

export interface AuthenticatePublic {
  /**
   * Authenticate a request from a checkout extension
   *
   */
  checkout: AuthenticateCheckout;

  /**
   * Authenticate a request from an app proxy
   *
   */
  appProxy: AuthenticateAppProxy;

  /**
   * Authenticate a request from a customer account extension
   *
   */
  customerAccount: AuthenticateCustomerAccount;
}
