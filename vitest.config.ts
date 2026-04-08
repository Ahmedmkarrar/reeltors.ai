import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'app/api/**/*.ts',
        'lib/**/*.ts',
      ],
      exclude: ['**/*.test.ts'],
    },
  },
});
