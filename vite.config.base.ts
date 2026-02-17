import type { UserConfig } from 'vite';
import type { UserConfig as VitestUserConfig } from 'vitest/config';

import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';

/**
 * Shared Vite build config for all packages.
 *
 * Centralizes target, format, sourcemap, and external builtins.
 * Each package only provides its own entry points and extra externals.
 */
export function createBuildConfig(options: {
  entry: Record<string, string>;
  external?: (string | RegExp)[];
  preserveModules?: boolean;
}): UserConfig['build'] {
  const { entry, external = [], preserveModules = false } = options;

  return {
    lib: {
      entry,
      formats: ['es'],
      fileName: (_format: string, entryName: string) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`), ...external],
      output: {
        preserveModules,
      },
    },
    target: 'node24',
    minify: false,
    sourcemap: true,
  };
}

/**
 * Read __VERSION__ define from the package's package.json.
 */
export function versionDefine(): Record<string, string> {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
  return { __VERSION__: JSON.stringify(pkg.version) };
}

/**
 * Shared Vitest test config.
 *
 * Centralizes reporters, coverage provider, and reporter formats.
 * Each package provides its own coverage thresholds and excludes.
 */
export function createTestConfig(options?: {
  name?: string;
  setupFiles?: string[];
  coverageExclude?: string[];
  coverageThresholds?: {
    statements?: number;
    branches?: number;
    functions?: number;
    lines?: number;
  };
}): VitestUserConfig['test'] {
  const { name, setupFiles, coverageExclude = [], coverageThresholds } = options ?? {};

  return {
    name,
    environment: 'node',
    setupFiles,
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', '**/*.config.ts', ...coverageExclude],
      thresholds: coverageThresholds,
    },
  };
}
