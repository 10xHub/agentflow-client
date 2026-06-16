import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'dist-types/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/examples/**',
        '**/docs/**',
        'check.ts'
      ],
      include: ['src/**/*.ts'],
      all: true,
      thresholds: {
        lines: 75,
        functions: 60,
        branches: 75,
        statements: 75
      }
    }
  }
});
