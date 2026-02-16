import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
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
        '@studiometa/productive-api',
        '@studiometa/productive-core',
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
        'src/cli.ts', // CLI entry point, tested via e2e
        'src/index.ts', // Entry point, CLI is not a library
        'src/types.ts', // Type definitions only
        'src/commands/*/index.ts', // Barrel re-exports
        'src/renderers/index.ts', // Barrel re-export
        'src/renderers/human/index.ts', // Barrel re-export
        'scripts/**',
        '**/*.test.ts',
        '**/__tests__/**',
        '*.config.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
});
