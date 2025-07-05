import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./test/setup-env.js'],
    environment: 'node',
    globals: true
  }
});
