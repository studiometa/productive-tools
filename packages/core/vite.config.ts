import { defineConfig } from 'vitest/config';

import { createBuildConfig, createTestConfig } from '../../vite.config.base.ts';

export default defineConfig({
  build: createBuildConfig({
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
      'executors/reports/index': './src/executors/reports/index.ts',
    },
    external: ['@studiometa/productive-api'],
  }),
  test: {
    ...createTestConfig({
      name: 'core',
      coverageExclude: ['src/index.ts'],
      coverageThresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    }),
    isolate: false,
  },
});
