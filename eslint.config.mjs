import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import prettierPlugin from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  expoConfig,
  prettierPlugin,
  {
    ignores: ['android/', 'ios/', 'dist/', 'node_modules/', '.expo/'],
  },
]);
