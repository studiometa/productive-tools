import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
        cli: './src/cli.ts',
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/cli.ts', // CLI entry point, tested manually
        'src/index.ts', // Entry point export file
        'src/types.ts', // Type definitions only
        'scripts/**',
        '**/*.test.ts',
        '**/__tests__/**',
        '*.config.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 85,
        functions: 70,
        lines: 70,
      },
    },
  },
});
