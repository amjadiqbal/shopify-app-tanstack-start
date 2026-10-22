import {useRouter} from '@tanstack/react-router';
import {type ReactNode, useEffect} from 'react';

import {APP_BRIDGE_URL, POLARIS_URL} from '../shared/const';

export {APP_BRIDGE_URL, POLARIS_URL};

export interface AppBridgeHeadOptions {
  /** Your app's client ID (`SHOPIFY_API_KEY`). It is public; App Bridge reads it from a meta tag. */
  apiKey: string;
  /** Load Polaris web components (`<s-page>`, `<s-button>`, ...). Defaults to true. */
  polaris?: boolean;
  /** Override the Polaris script URL. */
  polarisUrl?: string;
}

/**
 * The `meta` and `scripts` App Bridge needs, for a root route's `head()`. App Bridge must load synchronously and
 * before your app's own scripts, which `head().scripts` does.
 *
 * ```tsx
 * export const Route = createRootRoute({
 *   head: () => appBridgeHead({ apiKey: import.meta.env.VITE_SHOPIFY_API_KEY }),
 *   shellComponent: RootDocument,
 * })
 * ```
 */
export function appBridgeHead({apiKey, polaris = true, polarisUrl = POLARIS_URL}: AppBridgeHeadOptions) {
  return {
    meta: [{name: 'shopify-api-key', content: apiKey}],
    scripts: [{src: APP_BRIDGE_URL}, ...(polaris ? [{src: polarisUrl}] : [])],
  };
}

export interface AppProviderProps {
  children?: ReactNode;
}

/**
 * Connects App Bridge to TanStack Router: links in the admin navigation (`<s-app-nav>`, `<ui-nav-menu>`) and other
 * App Bridge navigation events go through the router instead of reloading the iframe. Render it once inside your
 * root component.
 */
export function AppProvider({children}: AppProviderProps) {
  const router = useRouter();

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const href = (event.target as HTMLElement | null)?.getAttribute('href');
      if (href) router.navigate({href});
    };
    document.addEventListener('shopify:navigate', handleNavigate);
    return () => document.removeEventListener('shopify:navigate', handleNavigate);
  }, [router]);

  return <>{children}</>;
}
