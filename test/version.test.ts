import {readFileSync} from 'node:fs';
import {expect, it} from 'vitest';

import {LIBRARY_VERSION} from '../src/core/version';

it('LIBRARY_VERSION matches package.json', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  expect(LIBRARY_VERSION).toBe(pkg.version);
});
