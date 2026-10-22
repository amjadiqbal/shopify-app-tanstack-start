import {StorefrontOperations} from '@shopify/storefront-api-client';

import {GraphQLClient} from '../types';

/**
 * Provides utilities that apps can use to make requests to the Storefront API.
 * @publicDocs
 */
export interface StorefrontContext {
  /**
   * Method for interacting with the Shopify Storefront GraphQL API
   *
   *
   * {@link https://shopify.dev/docs/api/storefront}
   *
   */
  graphql: GraphQLClient<StorefrontOperations>;
}
