import { defineConfig } from 'vitest/config';

// Unit tests for the web app's pure modules (state, share links). UI is checked in the browser.
export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', 'out/**'],
    environment: 'node',
  },
});
