import {vi} from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

export const fetchMock = createFetchMock(vi);
// Enabled before the Shopify web-api adapter is imported, because the adapter captures `fetch` on import.
fetchMock.enableMocks();
