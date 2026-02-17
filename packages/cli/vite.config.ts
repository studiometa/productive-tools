import { defineConfig } from 'vitest/config';

import { createBuildConfig, createTestConfig, versionDefine } from '../../vite.config.base.ts';

export default defineConfig({
  define: versionDefine(),
  build: createBuildConfig({
    entry: {
      index: './src/index.ts',
      cli: './src/cli.ts',
    },
    external: ['@studiometa/productive-api', '@studiometa/productive-core'],
  }),
  test: createTestConfig({
    name: 'cli',
    setupFiles: ['./vitest.setup.ts'],
    coverageExclude: [
      'src/cli.ts',
      'src/index.ts',
      'src/types.ts',
      'src/commands/completion.ts',
      'src/commands/completion-helper.ts',
    ],
    coverageThresholds: {
      statements: 84,
      branches: 70,
      functions: 90,
      lines: 84,
    },
  }),
});
