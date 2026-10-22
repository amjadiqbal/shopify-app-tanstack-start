import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: [
      'src/**/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.tsx',
      'test/**/*.test.ts',
      'test/**/*.test.tsx',
    ],
    setupFiles: ['./test/setup.ts'],
    typecheck: {enabled: true, include: ['test/**/*.test-d.ts'], tsconfig: './tsconfig.json'},
  },
});
