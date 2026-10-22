import {fetchMock} from './fetch-mock';
import '@shopify/shopify-api/adapters/web-api';
import {beforeEach} from 'vitest';

// Every test starts with no mocked responses, so a test never reaches a real Shopify endpoint.
beforeEach(() => {
  fetchMock.resetMocks();
});
