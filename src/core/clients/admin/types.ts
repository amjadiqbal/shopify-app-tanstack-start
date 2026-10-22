import {AdminOperations} from '@shopify/admin-api-client';
import {Session} from '@shopify/shopify-api';

import {BasicParams} from '../../types';
import {GraphQLClient} from '../types';

export interface AdminClientOptions {
  params: BasicParams;
  session: Session;
  handleClientError?: HandleAdminClientError;
}

export type HandleAdminClientError = (arg: {
  error: any;
  params: BasicParams;
  session: Session;
}) => Promise<void>;

/**
 * Provides utilities that apps can use to make requests to the Admin API.
 * @publicDocs
 */
export interface AdminApiContext {
  /**
   * Methods for interacting with the Shopify Admin GraphQL API
   *
   * {@link https://shopify.dev/docs/api/admin-graphql}
   * {@link https://github.com/Shopify/shopify-app-js/blob/main/packages/apps/shopify-api/docs/reference/clients/Graphql.md}
   *
   */
  graphql: GraphQLClient<AdminOperations>;
}
