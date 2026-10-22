import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: {server: 'src/server.ts', react: 'src/react/index.tsx'},
  format: 'esm',
  platform: 'neutral',
  tsconfig: 'tsconfig.build.json',
  dts: true,
  clean: true,
});
