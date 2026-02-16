import { builtinModules } from 'node:module';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
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
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
});
