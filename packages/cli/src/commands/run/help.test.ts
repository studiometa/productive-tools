import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { showRunHelp } from './help.js';

describe('showRunHelp', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('outputs help text', () => {
    showRunHelp();
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('productive run');
    expect(output).toContain('script');
    expect(output).toContain('ScriptContext');
  });

  it('includes both pattern A and pattern B examples', () => {
    showRunHelp();
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('export default async function');
    expect(output).toContain('globals');
  });

  it('documents the output utilities', () => {
    showRunHelp();
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('output.table');
    expect(output).toContain('output.json');
    expect(output).toContain('output.csv');
    expect(output).toContain('output.spinner');
  });

  it('documents TypeScript support', () => {
    showRunHelp();
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('TypeScript');
    expect(output).toContain('--experimental-strip-types');
  });
});
