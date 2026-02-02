import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/cli.ts', // CLI entry point - wiring only
        'src/index.ts', // Package exports - no logic
        'src/types.ts', // Type definitions only
        'src/commands/completion.ts', // Shell completion scripts - hard to test
        'src/commands/completion-helper.ts', // Completion helper - shell integration
      ],
    },
  },
});
