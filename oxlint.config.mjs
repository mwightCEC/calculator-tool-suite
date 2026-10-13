import { oxlint } from 'oxc-config-mantine';
import { defineConfig } from 'oxlint';

export default defineConfig({
  ...oxlint,
  ignorePatterns: ['**/*.{mjs,cjs,js,d.ts,d.mts}', '**/.next', '**/coverage'],
});
