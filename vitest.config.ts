import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@advayta108/uplati-sdk': path.resolve(__dirname, 'lib/uplati-sdk/src/index.ts'),
    },
  },
});
