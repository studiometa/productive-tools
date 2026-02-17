import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
        'context/index': './src/context/index.ts',
        'context/from-command-context': './src/context/from-command-context.ts',
        'context/from-handler-context': './src/context/from-handler-context.ts',
        'executors/time/index': './src/executors/time/index.ts',
        'executors/projects/index': './src/executors/projects/index.ts',
        'executors/people/index': './src/executors/people/index.ts',
        'executors/services/index': './src/executors/services/index.ts',
        'executors/companies/index': './src/executors/companies/index.ts',
        'executors/tasks/index': './src/executors/tasks/index.ts',
        'executors/deals/index': './src/executors/deals/index.ts',
        'executors/bookings/index': './src/executors/bookings/index.ts',
        'executors/comments/index': './src/executors/comments/index.ts',
        'executors/timers/index': './src/executors/timers/index.ts',
        'executors/budgets/index': './src/executors/budgets/index.ts',
        'executors/reports/index': './src/executors/reports/index.ts',
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        '@studiometa/productive-api',
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
      ],
      output: {
        preserveModules: false,
      },
    },
    target: 'node24',
    minify: false,
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'node',
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/index.ts',
        '**/*.test.ts',
        '**/__tests__/**',
        '*.config.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
