/**
 * Builds a redirect `Response`, like React Router's `redirect()`, without depending on a router.
 * TanStack Start passes thrown and returned `Response` objects through to the client unchanged.
 */
export function redirect(url: string, init: number | ResponseInit = 302): Response {
  let responseInit: ResponseInit = typeof init === 'number' ? {status: init} : init;
  if (typeof responseInit.status === 'undefined') {
    responseInit = {...responseInit, status: 302};
  }
  const headers = new Headers(responseInit.headers);
  headers.set('Location', url);
  return new Response(null, {...responseInit, headers});
}
