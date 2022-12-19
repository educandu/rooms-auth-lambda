import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.js'],
    exclude: [],
    setupFiles: ['src/test-setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: [
        'src/dev-server/**',
        'src/test-setup.js',
        'src/lambda/website-api-client.js'
      ]
    }
  }
});
