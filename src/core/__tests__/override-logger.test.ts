import '@shopify/shopify-api/adapters/web-api';

import {
  ApiVersion,
  ConfigParams,
  LogSeverity,
  shopifyApi,
} from '@shopify/shopify-api';

import {overrideLogger} from '../override-logger';

const LOG_FN = vi.fn();
const VALID_API_CONFIG: ConfigParams<any, any> = {
  apiKey: 'test-key',
  apiSecretKey: 'test-secret',
  scopes: ['test-scope'],
  apiVersion: ApiVersion.July26,
  hostName: 'test-host',
  isEmbeddedApp: true,
  logger: {log: LOG_FN, level: LogSeverity.Debug},
};

describe('override logger', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('overrides the package name in log messages', () => {
    // GIVEN
    const logger = overrideLogger(shopifyApi(VALID_API_CONFIG).logger);

    // WHEN
    logger.log(LogSeverity.Info, 'Test message');

    // THEN
    expect(LOG_FN).toHaveBeenCalledWith(
      LogSeverity.Info,
      '[shopify-app/INFO] Test message',
    );
  });

  it('deprecate allows future versions to go through', () => {
    // GIVEN
    const logger = overrideLogger(shopifyApi(VALID_API_CONFIG).logger);

    // WHEN
    logger.deprecated('9999.0.0', 'Test deprecation message');

    // THEN
    expect(LOG_FN).toHaveBeenCalledWith(
      LogSeverity.Warning,
      '[shopify-app/WARNING] [Deprecated | 9999.0.0] Test deprecation message',
    );
  });


  it.each([
    LogSeverity.Debug,
    LogSeverity.Info,
    LogSeverity.Warning,
    LogSeverity.Error,
  ])('logs messages normally at level %s', (level) => {
    // GIVEN
    const logger = overrideLogger(shopifyApi(VALID_API_CONFIG).logger);

    // WHEN
    switch (level) {
      case LogSeverity.Debug:
        logger.debug('Test debug message');
        break;
      case LogSeverity.Info:
        logger.info('Test info message');
        break;
      case LogSeverity.Warning:
        logger.warning('Test warning message');
        break;
      case LogSeverity.Error:
        logger.error('Test error message');
        break;
    }

    // THEN
    expect(LOG_FN).toHaveBeenCalledWith(level, expect.anything());
  });
});
