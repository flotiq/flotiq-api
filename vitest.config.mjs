import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    alias: {
      '../../flotiq-cli/src/util': resolve(
        __dirname,
        'test/mocks/flotiq-cli-util.cjs'
      ),
    },
  },
});