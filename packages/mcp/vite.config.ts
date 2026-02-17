import { defineConfig } from 'vitest/config';

import { createBuildConfig, createTestConfig, versionDefine } from '../../vite.config.base.ts';

export default defineConfig({
  define: versionDefine(),
  build: createBuildConfig({
    entry: {
      index: './src/index.ts',
      server: './src/server.ts',
      auth: './src/auth.ts',
      crypto: './src/crypto.ts',
      oauth: './src/oauth.ts',
      tools: './src/tools.ts',
      handlers: './src/handlers.ts',
      stdio: './src/stdio.ts',
      http: './src/http.ts',
    },
    external: [
      '@modelcontextprotocol/sdk',
      '@modelcontextprotocol/sdk/server/index.js',
      '@modelcontextprotocol/sdk/server/stdio.js',
      '@modelcontextprotocol/sdk/types.js',
      '@studiometa/productive-api',
      '@studiometa/productive-core',
      'h3',
    ],
  }),
  test: createTestConfig({
    name: 'mcp',
    coverageExclude: ['src/index.ts', 'src/server.ts', 'src/http.ts'],
    coverageThresholds: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  }),
});
