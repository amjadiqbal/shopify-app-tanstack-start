import type {Shopify} from '@shopify/shopify-api';

export function overrideLogger(logger: Shopify['logger']): Shopify['logger'] {
  const baseContext = {package: 'shopify-app'};

  const warningFunction: Shopify['logger']['warning'] = (
    message,
    context = {},
  ) => logger.warning(message, {...baseContext, ...context});

  function deprecated(warningFunction: Shopify['logger']['warning']) {
    return function (version: string, message: string): Promise<void> {
      return warningFunction(`[Deprecated | ${version}] ${message}`);
    };
  }

  return {
    ...logger,
    log: (severity, message, context = {}) =>
      logger.log(severity, message, {...baseContext, ...context}),
    debug: (message, context = {}) =>
      logger.debug(message, {...baseContext, ...context}),
    info: (message, context = {}) =>
      logger.info(message, {...baseContext, ...context}),
    warning: warningFunction,
    error: (message, context = {}) =>
      logger.error(message, {...baseContext, ...context}),
    deprecated: deprecated(warningFunction),
  };
}
