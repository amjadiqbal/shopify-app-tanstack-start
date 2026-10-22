/**
 * Parses a request body that passed HMAC validation. A body that is not JSON is a bad request (400), not a crash.
 * Not in upstream: upstream calls `JSON.parse(rawBody)` directly.
 */
export function parseJsonBody(rawBody: string): any {
  try {
    return JSON.parse(rawBody);
  } catch (_error) {
    throw new Response(undefined, {status: 400, statusText: 'Bad Request'});
  }
}
