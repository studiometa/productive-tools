/**
 * Tests for run-script limits and feature gating.
 */

import { describe, it, expect } from 'vitest';

import { isRunScriptEnabled, resolveRunLimits } from './limits.js';

const env = (overrides: Record<string, string>): NodeJS.ProcessEnv =>
  overrides as NodeJS.ProcessEnv;

describe('isRunScriptEnabled', () => {
  it('is disabled by default', () => {
    expect(isRunScriptEnabled(env({}))).toBe(false);
  });

  it('is enabled only for the exact string "true"', () => {
    expect(isRunScriptEnabled(env({ PRODUCTIVE_MCP_ENABLE_RUN: 'true' }))).toBe(true);
    expect(isRunScriptEnabled(env({ PRODUCTIVE_MCP_ENABLE_RUN: '1' }))).toBe(false);
    expect(isRunScriptEnabled(env({ PRODUCTIVE_MCP_ENABLE_RUN: 'TRUE' }))).toBe(false);
    expect(isRunScriptEnabled(env({ PRODUCTIVE_MCP_ENABLE_RUN: 'yes' }))).toBe(false);
  });
});

describe('resolveRunLimits', () => {
  it('returns documented defaults when no env vars are set', () => {
    expect(resolveRunLimits(env({}))).toEqual({
      timeoutMs: 5_000,
      memoryBytes: 64 * 1024 * 1024,
      maxApiCalls: 50,
      maxOutputBytes: 256 * 1024,
      maxCodeBytes: 128 * 1024,
    });
  });

  it('applies env overrides', () => {
    const limits = resolveRunLimits(
      env({
        PRODUCTIVE_MCP_RUN_TIMEOUT_MS: '10000',
        PRODUCTIVE_MCP_RUN_MEMORY_MB: '32',
        PRODUCTIVE_MCP_RUN_MAX_API_CALLS: '5',
        PRODUCTIVE_MCP_RUN_MAX_OUTPUT_KB: '64',
        PRODUCTIVE_MCP_RUN_MAX_CODE_KB: '16',
      }),
    );
    expect(limits).toEqual({
      timeoutMs: 10_000,
      memoryBytes: 32 * 1024 * 1024,
      maxApiCalls: 5,
      maxOutputBytes: 64 * 1024,
      maxCodeBytes: 16 * 1024,
    });
  });

  it.each([['0'], ['-1'], ['abc'], ['1.5'], ['']])(
    'falls back to default for invalid value %s',
    (value) => {
      const limits = resolveRunLimits(env({ PRODUCTIVE_MCP_RUN_MAX_API_CALLS: value }));
      expect(limits.maxApiCalls).toBe(50);
    },
  );
});
